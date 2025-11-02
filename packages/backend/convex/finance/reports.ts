import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Get project financial summary
export const getProjectFinancialSummary = query({
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
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
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
					q.lte(q.field("date"), period + "-31"),
				),
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
			.filter((p) => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);

		const totalOutgoing = payments
			.filter((p) => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);

		// Get budget information
		const budgets = await ctx.db
			.query("projectBudgets")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("status"), "approved"))
			.collect();

		const currentBudget = budgets.sort(
			(a, b) =>
				new Date(b.effectiveDate).getTime() -
				new Date(a.effectiveDate).getTime(),
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
			budget: currentBudget
				? {
						total: currentBudget.totalBudget,
						spent: balancesByType.expense,
						remaining: currentBudget.totalBudget - balancesByType.expense,
						percentUsed:
							(balancesByType.expense / currentBudget.totalBudget) * 100,
					}
				: null,
			profitability: {
				grossProfit: balancesByType.revenue - balancesByType.expense,
				profitMargin:
					balancesByType.revenue > 0
						? ((balancesByType.revenue - balancesByType.expense) /
								balancesByType.revenue) *
							100
						: 0,
				roi:
					project.contractValue > 0
						? ((balancesByType.revenue - balancesByType.expense) /
								project.contractValue) *
							100
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
					q.eq("organizationId", organization.id).eq("type", "revenue"),
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) =>
					q.eq("organizationId", organization.id).eq("type", "expense"),
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
					q.lte(q.field("date"), args.dateTo),
				),
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
			}),
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
			}),
		);

		const totalRevenue = revenueItems.reduce(
			(sum, item) => sum + item.amount,
			0,
		);
		const totalExpenses = expenseItems.reduce(
			(sum, item) => sum + item.amount,
			0,
		);

		return {
			period: {
				from: args.dateFrom,
				to: args.dateTo,
			},
			revenue: {
				items: revenueItems.filter((item) => item.amount !== 0),
				total: totalRevenue,
			},
			expenses: {
				items: expenseItems.filter((item) => item.amount !== 0),
				total: totalExpenses,
			},
			netIncome: totalRevenue - totalExpenses,
			profitMargin:
				totalRevenue > 0
					? ((totalRevenue - totalExpenses) / totalRevenue) * 100
					: 0,
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
					q.eq("organizationId", organization.id).eq("type", "asset"),
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) =>
					q.eq("organizationId", organization.id).eq("type", "liability"),
				)
				.collect(),
			ctx.db
				.query("accounts")
				.withIndex("by_type", (q) =>
					q.eq("organizationId", organization.id).eq("type", "equity"),
				)
				.collect(),
		]);

		// Get journal entries up to the date
		let journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.filter((q) =>
				q.and(
					q.eq(q.field("status"), "posted"),
					q.lte(q.field("date"), args.date),
				),
			)
			.collect();

		if (args.projectId) {
			journalEntries = journalEntries.filter(
				(e) => e.projectId === args.projectId,
			);
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
			}),
		);

		// Calculate liability balances
		const liabilityItems = await Promise.all(
			liabilities.map(async (account) => {
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
			}),
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
			}),
		);

		const totalAssets = assetItems.reduce((sum, item) => sum + item.balance, 0);
		const totalLiabilities = liabilityItems.reduce(
			(sum, item) => sum + item.balance,
			0,
		);
		const totalEquity = equityItems.reduce(
			(sum, item) => sum + item.balance,
			0,
		);

		return {
			date: args.date,
			assets: {
				items: assetItems.filter((item) => item.balance !== 0),
				total: totalAssets,
			},
			liabilities: {
				items: liabilityItems.filter((item) => item.balance !== 0),
				total: totalLiabilities,
			},
			equity: {
				items: equityItems.filter((item) => item.balance !== 0),
				total: totalEquity,
			},
			isBalanced:
				Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
		};
	},
});

// Get simple project financial overview (for UI display)
export const getProjectFinancialOverview = query({
	args: {
		projectId: v.id("constructionProjects"),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Get project details
		const project = await ctx.db.get(args.projectId);
		if (!project) throw new Error("Проект не найден");

		// Get payment statistics
		const payments = await ctx.db
			.query("payments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const confirmedPayments = payments.filter((p) => p.status === "confirmed");
		const pendingPayments = payments.filter((p) => p.status === "pending");

		const totalIncoming = confirmedPayments
			.filter((p) => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);

		const totalOutgoing = confirmedPayments
			.filter((p) => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);

		const pendingIncoming = pendingPayments
			.filter((p) => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);

		const pendingOutgoing = pendingPayments
			.filter((p) => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);

		// Get traditional expenses from expenses table
		const expenses = await ctx.db
			.query("expenses")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const paidExpenses = expenses.filter((e) => e.status === "paid");
		const approvedExpenses = expenses.filter((e) => e.status === "approved");
		const pendingExpenses = expenses.filter((e) => e.status === "pending");

		const totalPaid = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
		const totalApproved = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
		const totalPending = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
		const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

		// Group expenses by category
		const expensesByCategory: Record<string, number> = {};
		for (const expense of paidExpenses) {
			expensesByCategory[expense.category] =
				(expensesByCategory[expense.category] || 0) + expense.amount;
		}

		// Get expense accounts from chart of accounts
		const expenseAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_type", (q) =>
				q.eq("organizationId", organization.id).eq("type", "expense"),
			)
			.collect();

		// Calculate expenses from journal entries
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("status"), "posted"))
			.collect();

		let totalJournalExpenses = 0;
		const expensesByAccount: Record<string, number> = {};

		for (const entry of journalEntries) {
			const lines = await ctx.db
				.query("journalLines")
				.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
				.collect();

			for (const line of lines) {
				const account = expenseAccounts.find((acc) => acc._id === line.accountId);
				if (account) {
					const expenseAmount = line.debit - line.credit;
					totalJournalExpenses += expenseAmount;
					expensesByAccount[account.name] =
						(expensesByAccount[account.name] || 0) + expenseAmount;
				}
			}
		}

		// Use the higher of paid expenses or journal expenses for balance calculation
		// This ensures we don't underreport expenses
		const totalExpensesForBalance = Math.max(totalPaid, totalJournalExpenses);

		// Calculate profitability
		const netProfit = totalIncoming - totalExpensesForBalance;
		const netCashPosition = totalIncoming - totalOutgoing;
		const profitMargin =
			totalIncoming > 0 ? (netProfit / totalIncoming) * 100 : 0;

		return {
			project: {
				name: project.name,
				client: project.client,
				contractValue: project.contractValue || 0,
				revenue: project.revenue || 0,
			},
			payments: {
				totalIncoming,
				totalOutgoing,
				pendingIncoming,
				pendingOutgoing,
				netCashFlow: totalIncoming - totalOutgoing,
				totalCount: payments.length,
				confirmedCount: confirmedPayments.length,
				pendingCount: pendingPayments.length,
			},
			expenses: {
				// Traditional expense tracking (from expenses table)
				totalPaid,
				totalApproved,
				totalPending,
				paidCount: paidExpenses.length,
				approvedCount: approvedExpenses.length,
				pendingCount: pendingExpenses.length,
				totalCount: expenses.length,
				byCategory: expensesByCategory,
				// Journal-based accounting
				total: totalJournalExpenses,
				byAccount: expensesByAccount,
			},
			balance: {
				currentBalance: netProfit,
				netCashFlow: netCashPosition,
				projectedBalance:
					totalIncoming + pendingIncoming - totalExpensesForBalance - totalPending,
				profitMargin,
			},
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
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.filter((q) =>
				q.or(q.eq(q.field("code"), "50"), q.eq(q.field("code"), "51")),
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
					q.lte(q.field("date"), args.dateTo),
				),
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
			const cashLines = lines.filter((l) =>
				cashAccounts.some((ca) => ca._id === l.accountId),
			);

			if (cashLines.length > 0) {
				const cashFlow = cashLines.reduce(
					(sum, l) => sum + l.debit - l.credit,
					0,
				);

				const activity = {
					date: entry.date,
					description: entry.description,
					amount: cashFlow,
					type: entry.type,
				};

				// Categorize by type
				if (
					entry.type === "payment" ||
					entry.type === "expense" ||
					entry.type === "revenue"
				) {
					operatingActivities.push(activity);
				} else if (entry.type === "adjustment") {
					investingActivities.push(activity);
				} else {
					financingActivities.push(activity);
				}
			}
		}

		const totalOperating = operatingActivities.reduce(
			(sum, a) => sum + a.amount,
			0,
		);
		const totalInvesting = investingActivities.reduce(
			(sum, a) => sum + a.amount,
			0,
		);
		const totalFinancing = financingActivities.reduce(
			(sum, a) => sum + a.amount,
			0,
		);

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

// ================== ORGANIZATION-LEVEL QUERIES ==================

// Get organization-wide financial overview
export const getOrganizationFinancialOverview = query({
	args: {
		period: v.optional(v.string()), // YYYY-MM format
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		const period = args.period || new Date().toISOString().slice(0, 7);

		// Get all active construction projects
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		const activeProjects = projects.filter(
			(p) => p.statusId !== "completed" && p.statusId !== "cancelled",
		);

		// Aggregate payment data across all projects
		let totalIncoming = 0;
		let totalOutgoing = 0;
		let pendingIncoming = 0;
		let pendingOutgoing = 0;

		// Get expense accounts from chart of accounts
		const expenseAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_type", (q) =>
				q.eq("organizationId", organization.id).eq("type", "expense"),
			)
			.collect();

		// Aggregate traditional expense data from expenses table
		let totalPaidExpenses = 0;
		let totalApprovedExpenses = 0;
		let totalPendingExpenses = 0;
		let totalExpenseCount = 0;
		let paidExpenseCount = 0;
		let approvedExpenseCount = 0;
		let pendingExpenseCount = 0;

		// For journal entry expenses
		let totalJournalExpenses = 0;
		const expensesByAccount: Record<string, number> = {};
		const expensesByCategory: Record<string, number> = {};

		// Project financial summaries for ranking
		const projectSummaries = [];

		for (const project of projects) {
			// Get payments for this project
			const payments = await ctx.db
				.query("payments")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.collect();

			const confirmedPayments = payments.filter(
				(p) => p.status === "confirmed",
			);
			const pendingPayments = payments.filter((p) => p.status === "pending");

			const projectIncoming = confirmedPayments
				.filter((p) => p.type === "incoming")
				.reduce((sum, p) => sum + p.amount, 0);

			const projectOutgoing = confirmedPayments
				.filter((p) => p.type === "outgoing")
				.reduce((sum, p) => sum + p.amount, 0);

			totalIncoming += projectIncoming;
			totalOutgoing += projectOutgoing;

			pendingIncoming += pendingPayments
				.filter((p) => p.type === "incoming")
				.reduce((sum, p) => sum + p.amount, 0);

			pendingOutgoing += pendingPayments
				.filter((p) => p.type === "outgoing")
				.reduce((sum, p) => sum + p.amount, 0);

			// Get traditional expenses from expenses table for this project
			const expenses = await ctx.db
				.query("expenses")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.collect();

			const paidExpenses = expenses.filter((e) => e.status === "paid");
			const approvedExpenses = expenses.filter((e) => e.status === "approved");
			const pendingExpenses = expenses.filter((e) => e.status === "pending");

			const projectPaidExpenses = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
			const projectApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
			const projectPendingExpenses = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

			totalPaidExpenses += projectPaidExpenses;
			totalApprovedExpenses += projectApprovedExpenses;
			totalPendingExpenses += projectPendingExpenses;
			totalExpenseCount += expenses.length;
			paidExpenseCount += paidExpenses.length;
			approvedExpenseCount += approvedExpenses.length;
			pendingExpenseCount += pendingExpenses.length;

			// Group expenses by category
			for (const expense of paidExpenses) {
				expensesByCategory[expense.category] =
					(expensesByCategory[expense.category] || 0) + expense.amount;
			}

			// Get journal entries for this project to calculate accounting expenses
			const journalEntries = await ctx.db
				.query("journalEntries")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.filter((q) => q.eq(q.field("status"), "posted"))
				.collect();

			// Calculate expenses from journal entries
			let projectJournalExpenses = 0;
			for (const entry of journalEntries) {
				const lines = await ctx.db
					.query("journalLines")
					.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
					.collect();

				for (const line of lines) {
					const account = expenseAccounts.find((acc) => acc._id === line.accountId);
					if (account) {
						const expenseAmount = line.debit - line.credit;
						projectJournalExpenses += expenseAmount;
						expensesByAccount[account.name] =
							(expensesByAccount[account.name] || 0) + expenseAmount;
					}
				}
			}

			totalJournalExpenses += projectJournalExpenses;

			// Use the higher of paid expenses or journal expenses for balance calculation
			const projectExpensesForBalance = Math.max(projectPaidExpenses, projectJournalExpenses);

			// Calculate project metrics
			const projectBalance = projectIncoming - projectExpensesForBalance;
			const projectProfitMargin =
				projectIncoming > 0 ? (projectBalance / projectIncoming) * 100 : 0;

			projectSummaries.push({
				projectId: project._id,
				name: project.name,
				client: project.client,
				revenue: projectIncoming,
				expenses: projectExpensesForBalance,
				balance: projectBalance,
				profitMargin: projectProfitMargin,
				status: project.statusId,
			});
		}

		// Sort projects by profitability
		const topProjects = [...projectSummaries]
			.sort((a, b) => b.profitMargin - a.profitMargin)
			.slice(0, 5);

		const projectsAtRisk = projectSummaries
			.filter((p) => p.balance < 0)
			.sort((a, b) => a.balance - b.balance)
			.slice(0, 5);

		// Use the higher of paid expenses or journal expenses for balance calculation
		const totalExpensesForBalance = Math.max(totalPaidExpenses, totalJournalExpenses);

		// Calculate organization-wide metrics
		const netProfit = totalIncoming - totalExpensesForBalance;
		const netCashFlow = totalIncoming - totalOutgoing;
		const profitMargin =
			totalIncoming > 0 ? (netProfit / totalIncoming) * 100 : 0;

		return {
			organization: {
				name: organization.name,
				totalProjects: projects.length,
				activeProjects: activeProjects.length,
			},
			revenue: {
				total: totalIncoming,
				byProject: projectSummaries.map((p) => ({
					projectId: p.projectId,
					amount: p.revenue,
				})),
			},
			expenses: {
				// Traditional expense tracking (from expenses table)
				totalPaid: totalPaidExpenses,
				totalApproved: totalApprovedExpenses,
				totalPending: totalPendingExpenses,
				paidCount: paidExpenseCount,
				approvedCount: approvedExpenseCount,
				pendingCount: pendingExpenseCount,
				totalCount: totalExpenseCount,
				byCategory: expensesByCategory,
				// Journal-based accounting
				total: totalJournalExpenses,
				byAccount: expensesByAccount,
				// For compatibility
				paid: totalPaidExpenses,
				approved: totalApprovedExpenses,
				pending: totalPendingExpenses,
				byProject: projectSummaries.map((p) => ({
					projectId: p.projectId,
					amount: p.expenses,
				})),
			},
			payments: {
				totalIncoming,
				totalOutgoing,
				pendingIncoming,
				pendingOutgoing,
				netCashFlow,
			},
			balance: {
				currentBalance: netProfit,
				netCashFlow: netCashFlow,
				profitMargin,
			},
			topProjects,
			projectsAtRisk,
		};
	},
});

// Get organization cash flow by period
export const getOrganizationCashFlowByPeriod = query({
	args: {
		dateFrom: v.string(),
		dateTo: v.string(),
		groupBy: v.union(v.literal("day"), v.literal("week"), v.literal("month")),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Get all payments in the date range
		const payments = await ctx.db
			.query("payments")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.filter((q) =>
				q.and(
					q.eq(q.field("status"), "confirmed"),
					q.gte(q.field("paymentDate"), args.dateFrom),
					q.lte(q.field("paymentDate"), args.dateTo),
				),
			)
			.collect();

		// Group payments by period
		const cashFlowByPeriod: Record<
			string,
			{ incoming: number; outgoing: number; net: number }
		> = {};

		payments.forEach((payment) => {
			let periodKey: string;
			const date = new Date(payment.paymentDate);

			if (args.groupBy === "day") {
				periodKey = payment.paymentDate; // YYYY-MM-DD
			} else if (args.groupBy === "week") {
				// Get week number
				const weekNumber = Math.floor(
					(date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) /
						(7 * 24 * 60 * 60 * 1000),
				);
				periodKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
			} else {
				// month
				periodKey = payment.paymentDate.slice(0, 7); // YYYY-MM
			}

			if (!cashFlowByPeriod[periodKey]) {
				cashFlowByPeriod[periodKey] = { incoming: 0, outgoing: 0, net: 0 };
			}

			if (payment.type === "incoming") {
				cashFlowByPeriod[periodKey].incoming += payment.amount;
			} else {
				cashFlowByPeriod[periodKey].outgoing += payment.amount;
			}

			cashFlowByPeriod[periodKey].net =
				cashFlowByPeriod[periodKey].incoming -
				cashFlowByPeriod[periodKey].outgoing;
		});

		// Convert to array and sort by period
		const cashFlowArray = Object.entries(cashFlowByPeriod)
			.map(([period, data]) => ({
				period,
				...data,
			}))
			.sort((a, b) => a.period.localeCompare(b.period));

		// Calculate cumulative net cash flow
		let cumulative = 0;
		const withCumulative = cashFlowArray.map((item) => {
			cumulative += item.net;
			return {
				...item,
				cumulative,
			};
		});

		return {
			period: {
				from: args.dateFrom,
				to: args.dateTo,
				groupBy: args.groupBy,
			},
			data: withCumulative,
			summary: {
				totalIncoming: withCumulative.reduce(
					(sum, item) => sum + item.incoming,
					0,
				),
				totalOutgoing: withCumulative.reduce(
					(sum, item) => sum + item.outgoing,
					0,
				),
				netCashFlow:
					withCumulative.reduce((sum, item) => sum + item.incoming, 0) -
					withCumulative.reduce((sum, item) => sum + item.outgoing, 0),
			},
		};
	},
});

// Get organization budget summary
export const getOrganizationBudgetSummary = query({
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Get all projects
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		let totalBudgeted = 0;
		let totalSpent = 0;
		const projectBudgets = [];
		const projectsOverBudget = [];
		const projectsUnderBudget = [];

		for (const project of projects) {
			// Get current approved budget for the project
			const budgets = await ctx.db
				.query("projectBudgets")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.filter((q) => q.eq(q.field("status"), "approved"))
				.collect();

			if (budgets.length > 0) {
				const currentBudget = budgets.sort(
					(a, b) =>
						new Date(b.effectiveDate).getTime() -
						new Date(a.effectiveDate).getTime(),
				)[0];

				// Get actual expenses
				const expenses = await ctx.db
					.query("expenses")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.filter((q) => q.eq(q.field("status"), "paid"))
					.collect();

				const projectSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

				totalBudgeted += currentBudget.totalBudget;
				totalSpent += projectSpent;

				const utilization = (projectSpent / currentBudget.totalBudget) * 100;

				const budgetInfo = {
					projectId: project._id,
					projectName: project.name,
					budgeted: currentBudget.totalBudget,
					spent: projectSpent,
					remaining: currentBudget.totalBudget - projectSpent,
					utilization,
					status:
						utilization > 100
							? "overbudget"
							: utilization > 80
								? "warning"
								: "ontrack",
				};

				projectBudgets.push(budgetInfo);

				if (utilization > 100) {
					projectsOverBudget.push(budgetInfo);
				} else if (utilization < 50) {
					projectsUnderBudget.push(budgetInfo);
				}
			}
		}

		const totalUtilization =
			totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

		return {
			summary: {
				totalBudgeted,
				totalSpent,
				totalRemaining: totalBudgeted - totalSpent,
				utilization: totalUtilization,
				projectsWithBudgets: projectBudgets.length,
				projectsOverBudget: projectsOverBudget.length,
				projectsUnderBudget: projectsUnderBudget.length,
			},
			projectBudgets,
			projectsOverBudget,
			projectsUnderBudget,
		};
	},
});

// Get project financial rankings
export const getProjectFinancialRankings = query({
	args: {
		sortBy: v.union(
			v.literal("profitMargin"),
			v.literal("revenue"),
			v.literal("expenses"),
			v.literal("balance"),
		),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		const limit = args.limit || 10;

		// Get all projects
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Calculate financial metrics for each project
		const projectMetrics = [];

		for (const project of projects) {
			// Get payments
			const payments = await ctx.db
				.query("payments")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.filter((q) => q.eq(q.field("status"), "confirmed"))
				.collect();

			const revenue = payments
				.filter((p) => p.type === "incoming")
				.reduce((sum, p) => sum + p.amount, 0);

			const expenses = payments
				.filter((p) => p.type === "outgoing")
				.reduce((sum, p) => sum + p.amount, 0);

			const balance = revenue - expenses;
			const profitMargin = revenue > 0 ? (balance / revenue) * 100 : 0;

			// Get budget info
			const budgets = await ctx.db
				.query("projectBudgets")
				.withIndex("by_project", (q) => q.eq("projectId", project._id))
				.filter((q) => q.eq(q.field("status"), "approved"))
				.collect();

			const currentBudget =
				budgets.length > 0
					? budgets.sort(
							(a, b) =>
								new Date(b.effectiveDate).getTime() -
								new Date(a.effectiveDate).getTime(),
						)[0]
					: null;

			projectMetrics.push({
				projectId: project._id,
				name: project.name,
				client: project.client,
				contractValue: project.contractValue,
				revenue,
				expenses,
				balance,
				profitMargin,
				budget: currentBudget?.totalBudget || 0,
				percentComplete: project.percentComplete,
				status: project.statusId,
			});
		}

		// Sort based on requested field
		projectMetrics.sort((a, b) => {
			switch (args.sortBy) {
				case "profitMargin":
					return b.profitMargin - a.profitMargin;
				case "revenue":
					return b.revenue - a.revenue;
				case "expenses":
					return b.expenses - a.expenses;
				case "balance":
					return b.balance - a.balance;
				default:
					return 0;
			}
		});

		return projectMetrics.slice(0, limit);
	},
});

// Get organization expenses by category
export const getOrganizationExpensesByCategory = query({
	args: {
		period: v.optional(v.string()), // YYYY-MM format
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("approved"),
				v.literal("paid"),
				v.literal("rejected"),
				v.literal("cancelled"),
			),
		),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Build filter for expenses
		let expensesQuery = ctx.db
			.query("expenses")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			);

		// Get all expenses (we'll filter in memory for more flexibility)
		const allExpenses = await expensesQuery.collect();

		// Apply filters
		let filteredExpenses = allExpenses;

		if (args.period) {
			filteredExpenses = filteredExpenses.filter((e) =>
				e.expenseDate.startsWith(args.period),
			);
		}

		if (args.status) {
			filteredExpenses = filteredExpenses.filter(
				(e) => e.status === args.status,
			);
		}

		// Group by category
		const categories = [
			"materials",
			"labor",
			"equipment",
			"transport",
			"utilities",
			"permits",
			"insurance",
			"taxes",
			"other",
		];

		const categoryData = categories.map((category) => {
			const categoryExpenses = filteredExpenses.filter(
				(e) => e.category === category,
			);
			const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
			const count = categoryExpenses.length;

			// Get top vendors for this category
			const vendorTotals: Record<string, number> = {};
			categoryExpenses.forEach((e) => {
				vendorTotals[e.vendor] = (vendorTotals[e.vendor] || 0) + e.amount;
			});

			const topVendors = Object.entries(vendorTotals)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 3)
				.map(([vendor, amount]) => ({ vendor, amount }));

			return {
				category,
				displayName: getCategoryDisplayName(category),
				total,
				count,
				percentage: 0, // Will calculate after
				topVendors,
			};
		});

		// Calculate percentages
		const grandTotal = categoryData.reduce((sum, c) => sum + c.total, 0);
		categoryData.forEach((c) => {
			c.percentage = grandTotal > 0 ? (c.total / grandTotal) * 100 : 0;
		});

		// Sort by total amount
		categoryData.sort((a, b) => b.total - a.total);

		// Get trend data (last 6 months)
		const trendData = [];
		const currentDate = new Date();

		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - i,
				1,
			);
			const monthKey = monthDate.toISOString().slice(0, 7);

			const monthExpenses = allExpenses.filter((e) =>
				e.expenseDate.startsWith(monthKey),
			);

			const monthByCategory: Record<string, number> = {};
			categories.forEach((cat) => {
				monthByCategory[cat] = monthExpenses
					.filter((e) => e.category === cat)
					.reduce((sum, e) => sum + e.amount, 0);
			});

			trendData.push({
				month: monthKey,
				...monthByCategory,
				total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
			});
		}

		return {
			period: args.period || "all",
			status: args.status || "all",
			categories: categoryData,
			total: grandTotal,
			trend: trendData,
		};
	},
});

// Helper function for category display names
function getCategoryDisplayName(category: string): string {
	const names: Record<string, string> = {
		materials: "Материалы",
		labor: "Работа",
		equipment: "Оборудование",
		transport: "Транспорт",
		utilities: "Коммунальные услуги",
		permits: "Разрешения",
		insurance: "Страхование",
		taxes: "Налоги",
		other: "Другое",
	};
	return names[category] || category;
}
