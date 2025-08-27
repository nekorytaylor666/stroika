import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Get project financial summary
export const getFinancialSummary = query({
	args: { 
		projectId: v.id("constructionProjects"),
		period: v.optional(v.string()), // YYYY-MM format
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		const period = args.period || new Date().toISOString().slice(0, 7);
		
		// Get project details
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Проект не найден");
		
		// Get all accounts
		const accounts = await ctx.db
			.query("accounts")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.collect();
			
		// Calculate balances for each account type
		const balancesByType: Record<string, number> = {
			asset: 0,
			liability: 0,
			equity: 0,
			revenue: 0,
			expense: 0,
		};
		
		// Get journal entries for the project
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => 
				q.and(
					q.eq(q.field("status"), "posted"),
					q.lte(q.field("date"), period + "-31")
				)
			)
			.collect();
			
		// Calculate account balances
		for (const account of accounts) {
			let balance = 0;
			
			for (const entry of journalEntries) {
				const lines = await ctx.db
					.query("journalLines")
					.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
					.filter((q) => q.eq(q.field("accountId"), account._id))
					.collect();
					
				for (const line of lines) {
					// For assets and expenses, debits increase and credits decrease
					// For liabilities, equity, and revenue, credits increase and debits decrease
					if (account.type === "asset" || account.type === "expense") {
						balance += line.debit - line.credit;
					} else {
						balance += line.credit - line.debit;
					}
				}
			}
			
			balancesByType[account.type] += balance;
		}
		
		// Get payment statistics
		const payments = await ctx.db
			.query("payments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("status"), "confirmed"))
			.collect();
			
		const totalIncoming = payments
			.filter(p => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);
			
		const totalOutgoing = payments
			.filter(p => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);
			
		// Get budget information
		const budgets = await ctx.db
			.query("projectBudgets")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("status"), "approved"))
			.collect();
			
		const currentBudget = budgets.sort((a, b) => 
			new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
		)[0];
		
		return {
			project: {
				name: project.name,
				client: project.client,
				contractValue: project.contractValue,
			},
			balances: {
				assets: balancesByType.asset,
				liabilities: balancesByType.liability,
				equity: balancesByType.equity,
				revenue: balancesByType.revenue,
				expenses: balancesByType.expense,
				netIncome: balancesByType.revenue - balancesByType.expense,
			},
			cashFlow: {
				totalIncoming,
				totalOutgoing,
				netCashFlow: totalIncoming - totalOutgoing,
			},
			budget: currentBudget ? {
				total: currentBudget.totalBudget,
				spent: balancesByType.expense,
				remaining: currentBudget.totalBudget - balancesByType.expense,
				percentUsed: (balancesByType.expense / currentBudget.totalBudget) * 100,
			} : null,
			profitability: {
				grossProfit: balancesByType.revenue - balancesByType.expense,
				profitMargin: balancesByType.revenue > 0 
					? ((balancesByType.revenue - balancesByType.expense) / balancesByType.revenue) * 100 
					: 0,
				roi: project.contractValue > 0
					? ((balancesByType.revenue - balancesByType.expense) / project.contractValue) * 100
					: 0,
			},
		};
	},
});

// Generate P&L Statement (Отчет о прибылях и убытках)
export const getProfitLossStatement = query({
	args: {
		projectId: v.id("constructionProjects"),
		dateFrom: v.string(),
		dateTo: v.string(),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		
		// Get revenue and expense accounts
		const [revenueAccounts, expenseAccounts] = await Promise.all([
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) => 
					q.eq("organizationId", organization._id)
					 .eq("type", "revenue")
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) => 
					q.eq("organizationId", organization._id)
					 .eq("type", "expense")
				)
				.collect(),
		]);
		
		// Get journal entries for the period
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => 
				q.and(
					q.eq(q.field("status"), "posted"),
					q.gte(q.field("date"), args.dateFrom),
					q.lte(q.field("date"), args.dateTo)
				)
			)
			.collect();
			
		// Calculate revenue items
		const revenueItems = await Promise.all(
			revenueAccounts.map(async (account) => {
				let amount = 0;
				
				for (const entry of journalEntries) {
					const lines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.filter((q) => q.eq(q.field("accountId"), account._id))
						.collect();
						
					amount += lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
				}
				
				return {
					account,
					amount,
				};
			})
		);
		
		// Calculate expense items
		const expenseItems = await Promise.all(
			expenseAccounts.map(async (account) => {
				let amount = 0;
				
				for (const entry of journalEntries) {
					const lines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.filter((q) => q.eq(q.field("accountId"), account._id))
						.collect();
						
					amount += lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
				}
				
				return {
					account,
					amount,
				};
			})
		);
		
		const totalRevenue = revenueItems.reduce((sum, item) => sum + item.amount, 0);
		const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
		
		return {
			period: {
				from: args.dateFrom,
				to: args.dateTo,
			},
			revenue: {
				items: revenueItems.filter(item => item.amount !== 0),
				total: totalRevenue,
			},
			expenses: {
				items: expenseItems.filter(item => item.amount !== 0),
				total: totalExpenses,
			},
			netIncome: totalRevenue - totalExpenses,
			profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
		};
	},
});

// Generate Balance Sheet (Баланс)
export const getBalanceSheet = query({
	args: {
		projectId: v.optional(v.id("constructionProjects")),
		date: v.string(),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		
		// Get all account types
		const [assets, liabilities, equity] = await Promise.all([
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) => 
					q.eq("organizationId", organization._id)
					 .eq("type", "asset")
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) => 
					q.eq("organizationId", organization._id)
					 .eq("type", "liability")
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) => 
					q.eq("organizationId", organization._id)
					 .eq("type", "equity")
				)
				.collect(),
		]);
		
		// Get journal entries up to the date
		let journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.filter((q) => 
				q.and(
					q.eq(q.field("status"), "posted"),
					q.lte(q.field("date"), args.date)
				)
			)
			.collect();
			
		if (args.projectId) {
			journalEntries = journalEntries.filter(e => e.projectId === args.projectId);
		}
		
		// Calculate asset balances
		const assetItems = await Promise.all(
			assets.map(async (account) => {
				let balance = 0;
				
				for (const entry of journalEntries) {
					const lines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.filter((q) => q.eq(q.field("accountId"), account._id))
						.collect();
						
					balance += lines.reduce((sum, l) => sum + l.debit - l.credit, 0);
				}
				
				return {
					account,
					balance,
				};
			})
		);
		
		// Calculate liability balances
		const liabilityItems = await Promise.all(
			liabilities.map(async (account) => {
				let balance = 0;
				
				for (const entry of journalEntries) {
					const lines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId"), entry._id))
						.filter((q) => q.eq(q.field("accountId"), account._id))
						.collect();
						
					balance += lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
				}
				
				return {
					account,
					balance,
				};
			})
		);
		
		// Calculate equity balances
		const equityItems = await Promise.all(
			equity.map(async (account) => {
				let balance = 0;
				
				for (const entry of journalEntries) {
					const lines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.filter((q) => q.eq(q.field("accountId"), account._id))
						.collect();
						
					balance += lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
				}
				
				return {
					account,
					balance,
				};
			})
		);
		
		const totalAssets = assetItems.reduce((sum, item) => sum + item.balance, 0);
		const totalLiabilities = liabilityItems.reduce((sum, item) => sum + item.balance, 0);
		const totalEquity = equityItems.reduce((sum, item) => sum + item.balance, 0);
		
		return {
			date: args.date,
			assets: {
				items: assetItems.filter(item => item.balance !== 0),
				total: totalAssets,
			},
			liabilities: {
				items: liabilityItems.filter(item => item.balance !== 0),
				total: totalLiabilities,
			},
			equity: {
				items: equityItems.filter(item => item.balance !== 0),
				total: totalEquity,
			},
			isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
		};
	},
});

// Get cash flow statement
export const getCashFlowStatement = query({
	args: {
		projectId: v.id("constructionProjects"),
		dateFrom: v.string(),
		dateTo: v.string(),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		
		// Get cash accounts (50 - Касса, 51 - Расчетные счета)
		const cashAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.filter((q) => 
				q.or(
					q.eq(q.field("code"), "50"),
					q.eq(q.field("code"), "51")
				)
			)
			.collect();
			
		// Get journal entries for the period
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => 
				q.and(
					q.eq(q.field("status"), "posted"),
					q.gte(q.field("date"), args.dateFrom),
					q.lte(q.field("date"), args.dateTo)
				)
			)
			.collect();
			
		// Categorize cash flows
		const operatingActivities: any[] = [];
		const investingActivities: any[] = [];
		const financingActivities: any[] = [];
		
		for (const entry of journalEntries) {
			const lines = await ctx.db
				.query("journalLines")
				.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
				.collect();
				
			// Check if any cash account is involved
			const cashLines = lines.filter(l => 
				cashAccounts.some(ca => ca._id === l.accountId)
			);
			
			if (cashLines.length > 0) {
				const cashFlow = cashLines.reduce((sum, l) => sum + l.debit - l.credit, 0);
				
				const activity = {
					date: entry.date,
					description: entry.description,
					amount: cashFlow,
					type: entry.type,
				};
				
				// Categorize by type
				if (entry.type === "payment" || entry.type === "expense" || entry.type === "revenue") {
					operatingActivities.push(activity);
				} else if (entry.type === "adjustment") {
					investingActivities.push(activity);
				} else {
					financingActivities.push(activity);
				}
			}
		}
		
		const totalOperating = operatingActivities.reduce((sum, a) => sum + a.amount, 0);
		const totalInvesting = investingActivities.reduce((sum, a) => sum + a.amount, 0);
		const totalFinancing = financingActivities.reduce((sum, a) => sum + a.amount, 0);
		
		return {
			period: {
				from: args.dateFrom,
				to: args.dateTo,
			},
			operatingActivities: {
				items: operatingActivities,
				total: totalOperating,
			},
			investingActivities: {
				items: investingActivities,
				total: totalInvesting,
			},
			financingActivities: {
				items: financingActivities,
				total: totalFinancing,
			},
			netCashFlow: totalOperating + totalInvesting + totalFinancing,
		};
	},
});