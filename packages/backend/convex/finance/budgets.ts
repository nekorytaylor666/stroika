import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Create project budget
export const createBudget = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		name: v.string(),
		totalBudget: v.number(),
		effectiveDate: v.string(),
		notes: v.optional(v.string()),
		budgetLines: v.array(
			v.object({
				accountCode: v.string(),
				category: v.string(),
				description: v.string(),
				plannedAmount: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Create budget
		const budgetId = await ctx.db.insert("projectBudgets", {
			organizationId: organization._id,
			projectId: args.projectId,
			name: args.name,
			totalBudget: args.totalBudget,
			status: "draft",
			effectiveDate: args.effectiveDate,
			notes: args.notes,
			createdBy: user._id,
			approvedBy: undefined,
			createdAt: Date.now(),
			approvedAt: undefined,
		});

		// Create budget lines
		for (const line of args.budgetLines) {
			// Find account by code
			const account = await ctx.db
				.query("accounts")
				.withIndex("by_code", (q) =>
					q.eq("organizationId", organization._id).eq("code", line.accountCode),
				)
				.first();

			if (!account) {
				throw new Error(`Счет с кодом ${line.accountCode} не найден`);
			}

			await ctx.db.insert("budgetLines", {
				budgetId,
				accountId: account._id,
				category: line.category,
				description: line.description,
				plannedAmount: line.plannedAmount,
				allocatedAmount: 0,
				spentAmount: 0,
				notes: undefined,
				createdAt: Date.now(),
			});
		}

		return { budgetId };
	},
});

// Get project budgets
export const getProjectBudgets = query({
	args: {
		projectId: v.id("constructionProjects"),
		status: v.optional(
			v.union(v.literal("draft"), v.literal("approved"), v.literal("revised")),
		),
	},
	handler: async (ctx, args) => {
		let budgets = await ctx.db
			.query("projectBudgets")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		if (args.status) {
			budgets = budgets.filter((b) => b.status === args.status);
		}

		// Get user details and budget lines
		const budgetsWithDetails = await Promise.all(
			budgets.map(async (budget) => {
				const [createdBy, approvedBy, budgetLines] = await Promise.all([
					ctx.db.get(budget.createdBy),
					budget.approvedBy ? ctx.db.get(budget.approvedBy) : null,
					ctx.db
						.query("budgetLines")
						.withIndex("by_budget", (q) => q.eq("budgetId", budget._id))
						.collect(),
				]);

				// Get account details for budget lines
				const linesWithAccounts = await Promise.all(
					budgetLines.map(async (line) => {
						const account = await ctx.db.get(line.accountId);
						return {
							...line,
							account,
						};
					}),
				);

				// Calculate totals
				const totalPlanned = linesWithAccounts.reduce(
					(sum, l) => sum + l.plannedAmount,
					0,
				);
				const totalAllocated = linesWithAccounts.reduce(
					(sum, l) => sum + l.allocatedAmount,
					0,
				);
				const totalSpent = await calculateTotalSpent(
					ctx,
					budget._id,
					args.projectId,
				);

				return {
					...budget,
					createdBy,
					approvedBy,
					budgetLines: linesWithAccounts,
					totalPlanned,
					totalAllocated,
					totalSpent,
					remainingBudget: budget.totalBudget - totalSpent,
				};
			}),
		);

		return budgetsWithDetails.sort(
			(a, b) =>
				new Date(b.effectiveDate).getTime() -
				new Date(a.effectiveDate).getTime(),
		);
	},
});

// Calculate total spent for a budget
async function calculateTotalSpent(
	ctx: any,
	budgetId: string,
	projectId: string,
): Promise<number> {
	// Get all expense journal entries for the project
	const journalEntries = await ctx.db
		.query("journalEntries")
		.withIndex("by_project", (q) => q.eq("projectId", projectId))
		.filter((q) =>
			q.and(
				q.eq(q.field("status"), "posted"),
				q.eq(q.field("type"), "expense"),
			),
		)
		.collect();

	if (journalEntries.length === 0) return 0;

	// Get budget lines to know which accounts to track
	const budgetLines = await ctx.db
		.query("budgetLines")
		.withIndex("by_budget", (q) => q.eq("budgetId", budgetId))
		.collect();

	const trackedAccountIds = budgetLines.map((l) => l.accountId);

	// Get journal lines for tracked accounts
	let totalSpent = 0;
	for (const entry of journalEntries) {
		const lines = await ctx.db
			.query("journalLines")
			.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
			.collect();

		for (const line of lines) {
			if (trackedAccountIds.includes(line.accountId)) {
				totalSpent += line.debit; // Expenses are debits
			}
		}
	}

	return totalSpent;
}

// Approve budget
export const approveBudget = mutation({
	args: { budgetId: v.id("projectBudgets") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		await ctx.db.patch(args.budgetId, {
			status: "approved",
			approvedBy: user._id,
			approvedAt: Date.now(),
		});

		return { success: true };
	},
});

// Create budget revision
export const createBudgetRevision = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		originalBudgetId: v.id("projectBudgets"),
		name: v.string(),
		totalBudget: v.number(),
		reason: v.string(),
		effectiveDate: v.string(),
		notes: v.optional(v.string()),
		budgetLines: v.array(
			v.object({
				accountCode: v.string(),
				category: v.string(),
				description: v.string(),
				plannedAmount: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const originalBudget = await ctx.db.get(args.originalBudgetId);
		if (!originalBudget) throw new Error("Исходный бюджет не найден");

		// Create new budget
		const newBudgetId = await ctx.db.insert("projectBudgets", {
			organizationId: organization._id,
			projectId: args.projectId,
			name: args.name,
			totalBudget: args.totalBudget,
			status: "revised",
			effectiveDate: args.effectiveDate,
			notes: args.notes,
			createdBy: user._id,
			approvedBy: undefined,
			createdAt: Date.now(),
			approvedAt: undefined,
		});

		// Create budget lines for new budget
		for (const line of args.budgetLines) {
			const account = await ctx.db
				.query("accounts")
				.withIndex("by_code", (q) =>
					q.eq("organizationId", organization._id).eq("code", line.accountCode),
				)
				.first();

			if (!account) {
				throw new Error(`Счет с кодом ${line.accountCode} не найден`);
			}

			await ctx.db.insert("budgetLines", {
				budgetId: newBudgetId,
				accountId: account._id,
				category: line.category,
				description: line.description,
				plannedAmount: line.plannedAmount,
				allocatedAmount: 0,
				spentAmount: 0,
				notes: undefined,
				createdAt: Date.now(),
			});
		}

		// Create revision record
		await ctx.db.insert("budgetRevisions", {
			projectId: args.projectId,
			originalBudgetId: args.originalBudgetId,
			newBudgetId,
			reason: args.reason,
			changeAmount: args.totalBudget - originalBudget.totalBudget,
			revisedBy: user._id,
			approvedBy: undefined,
			createdAt: Date.now(),
			approvedAt: undefined,
		});

		return { newBudgetId };
	},
});

// Get project budget (current active budget)
export const getProjectBudget = query({
	args: {
		projectId: v.id("constructionProjects"),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Get approved budget for the project
		const budgets = await ctx.db
			.query("projectBudgets")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("status"), "approved"))
			.collect();

		if (budgets.length === 0) {
			return null;
		}

		// Get the most recent approved budget
		const currentBudget = budgets.sort(
			(a, b) =>
				new Date(b.effectiveDate).getTime() -
				new Date(a.effectiveDate).getTime(),
		)[0];

		// Get budget lines
		const budgetLines = await ctx.db
			.query("budgetLines")
			.withIndex("by_budget", (q) => q.eq("budgetId", currentBudget._id))
			.collect();

		// Get approver info
		const approver = currentBudget.approvedBy
			? await ctx.db.get(currentBudget.approvedBy)
			: null;

		return {
			...currentBudget,
			lines: budgetLines,
			approver,
		};
	},
});

// Get budget variance
export const getBudgetVariance = query({
	args: {
		budgetId: v.id("projectBudgets"),
		period: v.optional(v.string()), // YYYY-MM format
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		const budget = await ctx.db.get(args.budgetId);
		if (!budget) throw new Error("Бюджет не найден");

		const period = args.period || new Date().toISOString().slice(0, 7);

		// Get budget lines
		const budgetLines = await ctx.db
			.query("budgetLines")
			.withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
			.collect();

		// Get actual expenses from journal entries
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_project", (q) => q.eq("projectId", budget.projectId))
			.filter((q) =>
				q.and(
					q.eq(q.field("status"), "posted"),
					q.lte(q.field("date"), period + "-31"),
				),
			)
			.collect();

		// Get expense accounts
		const expenseAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_type", (q) =>
				q.eq("organizationId", organization._id).eq("type", "expense"),
			)
			.collect();

		// Calculate actual expenses by category
		const actualByCategory: Record<string, number> = {};

		for (const entry of journalEntries) {
			const lines = await ctx.db
				.query("journalLines")
				.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
				.collect();

			for (const line of lines) {
				const account = expenseAccounts.find((a) => a._id === line.accountId);
				if (account) {
					const category = account.category || "Прочие";
					actualByCategory[category] =
						(actualByCategory[category] || 0) + line.debit - line.credit;
				}
			}
		}

		// Compare budget vs actual
		const comparison = budgetLines.map((budgetLine) => {
			const actual = actualByCategory[budgetLine.category] || 0;
			const variance = budgetLine.plannedAmount - actual;
			const variancePercent =
				budgetLine.plannedAmount > 0 ? (variance / budgetLine.plannedAmount) * 100 : 0;

			return {
				...budgetLine,
				actual,
				variance,
				variancePercent,
				status:
					variancePercent < -10
						? "overbudget"
						: variancePercent < 0
							? "warning"
							: "ontrack",
			};
		});

		const totalBudget = budgetLines.reduce((sum, l) => sum + l.plannedAmount, 0);
		const totalActual = Object.values(actualByCategory).reduce(
			(sum, v) => sum + v,
			0,
		);
		const totalVariance = totalBudget - totalActual;

		return {
			budgetId: args.budgetId,
			period,
			lines: comparison,
			summary: {
				totalBudget,
				totalActual,
				totalVariance,
				variancePercent:
					totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0,
			},
		};
	},
});

// Get budget revisions
export const getBudgetRevisions = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const revisions = await ctx.db
			.query("budgetRevisions")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const revisionsWithDetails = await Promise.all(
			revisions.map(async (revision) => {
				const [originalBudget, newBudget, revisedBy, approvedBy] =
					await Promise.all([
						ctx.db.get(revision.originalBudgetId),
						ctx.db.get(revision.newBudgetId),
						ctx.db.get(revision.revisedBy),
						revision.approvedBy ? ctx.db.get(revision.approvedBy) : null,
					]);

				return {
					...revision,
					originalBudget,
					newBudget,
					revisedBy,
					approvedBy,
				};
			}),
		);

		return revisionsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
	},
});

// Get budget vs actual comparison
export const getBudgetComparison = query({
	args: {
		projectId: v.id("constructionProjects"),
		budgetId: v.optional(v.id("projectBudgets")),
	},
	handler: async (ctx, args) => {
		// Get active budget or specified budget
		let budget;
		if (args.budgetId) {
			budget = await ctx.db.get(args.budgetId);
		} else {
			// Get latest approved budget
			const budgets = await ctx.db
				.query("projectBudgets")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.filter((q) => q.eq(q.field("status"), "approved"))
				.collect();

			budget = budgets.sort(
				(a, b) =>
					new Date(b.effectiveDate).getTime() -
					new Date(a.effectiveDate).getTime(),
			)[0];
		}

		if (!budget) {
			return null;
		}

		// Get budget lines
		const budgetLines = await ctx.db
			.query("budgetLines")
			.withIndex("by_budget", (q) => q.eq("budgetId", budget._id))
			.collect();

		// Calculate actual spending for each line
		const comparison = await Promise.all(
			budgetLines.map(async (line) => {
				const account = await ctx.db.get(line.accountId);
				if (!account) return null;

				// Get actual spending from journal entries
				const journalEntries = await ctx.db
					.query("journalEntries")
					.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
					.filter((q) => q.eq(q.field("status"), "posted"))
					.collect();

				let actualSpent = 0;
				for (const entry of journalEntries) {
					const journalLines = await ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.filter((q) => q.eq(q.field("accountId"), line.accountId))
						.collect();

					actualSpent += journalLines.reduce((sum, l) => sum + l.debit, 0);
				}

				return {
					...line,
					account,
					actualSpent,
					variance: line.plannedAmount - actualSpent,
					percentUsed:
						line.plannedAmount > 0
							? (actualSpent / line.plannedAmount) * 100
							: 0,
				};
			}),
		);

		const validComparison = comparison.filter((c) => c !== null);

		return {
			budget,
			comparison: validComparison,
			totalPlanned: validComparison.reduce(
				(sum, c) => sum + c.plannedAmount,
				0,
			),
			totalSpent: validComparison.reduce((sum, c) => sum + c.actualSpent, 0),
			totalVariance: validComparison.reduce((sum, c) => sum + c.variance, 0),
		};
	},
});
