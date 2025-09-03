import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Generate journal entry number
const generateEntryNumber = (index: number): string => {
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	return `ЖП-${date}-${String(index).padStart(5, "0")}`;
};

// Create manual journal entry
export const createJournalEntry = mutation({
	args: {
		projectId: v.optional(v.id("constructionProjects")),
		date: v.string(),
		description: v.string(),
		type: v.union(
			v.literal("payment"),
			v.literal("expense"),
			v.literal("revenue"),
			v.literal("transfer"),
			v.literal("adjustment"),
		),
		lines: v.array(
			v.object({
				accountCode: v.string(),
				debit: v.number(),
				credit: v.number(),
				description: v.optional(v.string()),
				analyticsCode: v.optional(v.string()),
				taxAmount: v.optional(v.number()),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Validate that debits equal credits
		const totalDebits = args.lines.reduce((sum, line) => sum + line.debit, 0);
		const totalCredits = args.lines.reduce((sum, line) => sum + line.credit, 0);

		if (Math.abs(totalDebits - totalCredits) > 0.01) {
			throw new Error(
				`Дебет (${totalDebits}) не равен кредиту (${totalCredits})`,
			);
		}

		// Get count for entry number
		const existingEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization._id),
			)
			.collect();

		const entryNumber = generateEntryNumber(existingEntries.length + 1);

		// Create journal entry
		const journalEntryId = await ctx.db.insert("journalEntries", {
			organizationId: organization._id,
			projectId: args.projectId,
			entryNumber,
			date: args.date,
			description: args.description,
			type: args.type,
			status: "draft",
			relatedPaymentId: undefined,
			createdBy: user._id,
			approvedBy: undefined,
			createdAt: Date.now(),
			postedAt: undefined,
		});

		// Create journal lines
		for (const line of args.lines) {
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

			await ctx.db.insert("journalLines", {
				journalEntryId,
				accountId: account._id,
				debit: line.debit,
				credit: line.credit,
				description: line.description,
				analyticsCode: line.analyticsCode,
				taxAmount: line.taxAmount,
				createdAt: Date.now(),
			});
		}

		return { journalEntryId, entryNumber };
	},
});

// Post journal entry
export const postJournalEntry = mutation({
	args: { journalEntryId: v.id("journalEntries") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		const entry = await ctx.db.get(args.journalEntryId);
		if (!entry) throw new Error("Проводка не найдена");

		if (entry.status === "posted") {
			throw new Error("Проводка уже проведена");
		}

		// Validate journal lines balance
		const lines = await ctx.db
			.query("journalLines")
			.withIndex("by_entry", (q) => q.eq("journalEntryId", args.journalEntryId))
			.collect();

		const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
		const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

		if (Math.abs(totalDebits - totalCredits) > 0.01) {
			throw new Error("Проводка не сбалансирована");
		}

		// Post the entry
		await ctx.db.patch(args.journalEntryId, {
			status: "posted",
			approvedBy: user._id,
			postedAt: Date.now(),
		});

		// Clear cached balances for affected accounts
		const accountIds = [...new Set(lines.map((l) => l.accountId))];
		for (const accountId of accountIds) {
			const balances = await ctx.db
				.query("accountBalances")
				.withIndex("by_account", (q) => q.eq("accountId", accountId))
				.collect();

			for (const balance of balances) {
				await ctx.db.delete(balance._id);
			}
		}

		return { success: true };
	},
});

// Cancel journal entry
export const cancelJournalEntry = mutation({
	args: { journalEntryId: v.id("journalEntries") },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.journalEntryId);
		if (!entry) throw new Error("Проводка не найдена");

		if (entry.status === "cancelled") {
			throw new Error("Проводка уже отменена");
		}

		await ctx.db.patch(args.journalEntryId, {
			status: "cancelled",
		});

		// Clear cached balances if entry was posted
		if (entry.status === "posted") {
			const lines = await ctx.db
				.query("journalLines")
				.withIndex("by_entry", (q) =>
					q.eq("journalEntryId", args.journalEntryId),
				)
				.collect();

			const accountIds = [...new Set(lines.map((l) => l.accountId))];
			for (const accountId of accountIds) {
				const balances = await ctx.db
					.query("accountBalances")
					.withIndex("by_account", (q) => q.eq("accountId", accountId))
					.collect();

				for (const balance of balances) {
					await ctx.db.delete(balance._id);
				}
			}
		}

		return { success: true };
	},
});

// Get journal entries
export const getJournalEntries = query({
	args: {
		projectId: v.optional(v.id("constructionProjects")),
		status: v.optional(
			v.union(v.literal("draft"), v.literal("posted"), v.literal("cancelled")),
		),
		type: v.optional(
			v.union(
				v.literal("payment"),
				v.literal("expense"),
				v.literal("revenue"),
				v.literal("transfer"),
				v.literal("adjustment"),
			),
		),
		dateFrom: v.optional(v.string()),
		dateTo: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		let entries = await ctx.db
			.query("journalEntries")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization._id),
			)
			.collect();

		// Apply filters
		if (args.projectId) {
			entries = entries.filter((e) => e.projectId === args.projectId);
		}

		if (args.status) {
			entries = entries.filter((e) => e.status === args.status);
		}

		if (args.type) {
			entries = entries.filter((e) => e.type === args.type);
		}

		if (args.dateFrom) {
			entries = entries.filter((e) => e.date >= args.dateFrom);
		}

		if (args.dateTo) {
			entries = entries.filter((e) => e.date <= args.dateTo);
		}

		// Get details
		const entriesWithDetails = await Promise.all(
			entries.map(async (entry) => {
				const [createdBy, approvedBy, lines, payment] = await Promise.all([
					ctx.db.get(entry.createdBy),
					entry.approvedBy ? ctx.db.get(entry.approvedBy) : null,
					ctx.db
						.query("journalLines")
						.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
						.collect(),
					entry.relatedPaymentId ? ctx.db.get(entry.relatedPaymentId) : null,
				]);

				// Get account details for lines
				const linesWithAccounts = await Promise.all(
					lines.map(async (line) => {
						const account = await ctx.db.get(line.accountId);
						return {
							...line,
							account,
						};
					}),
				);

				const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
				const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);

				return {
					...entry,
					createdBy,
					approvedBy,
					lines: linesWithAccounts,
					payment,
					totalDebits,
					totalCredits,
					isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
				};
			}),
		);

		return entriesWithDetails.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	},
});

// Get journal entry details
export const getJournalEntry = query({
	args: { journalEntryId: v.id("journalEntries") },
	handler: async (ctx, args) => {
		const entry = await ctx.db.get(args.journalEntryId);
		if (!entry) return null;

		const [createdBy, approvedBy, lines, payment] = await Promise.all([
			ctx.db.get(entry.createdBy),
			entry.approvedBy ? ctx.db.get(entry.approvedBy) : null,
			ctx.db
				.query("journalLines")
				.withIndex("by_entry", (q) => q.eq("journalEntryId", entry._id))
				.collect(),
			entry.relatedPaymentId ? ctx.db.get(entry.relatedPaymentId) : null,
		]);

		// Get account details for lines
		const linesWithAccounts = await Promise.all(
			lines.map(async (line) => {
				const account = await ctx.db.get(line.accountId);
				return {
					...line,
					account,
				};
			}),
		);

		const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
		const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);

		return {
			...entry,
			createdBy,
			approvedBy,
			lines: linesWithAccounts,
			payment,
			totalDebits,
			totalCredits,
			isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
		};
	},
});

// Create expense entry (simplified for users)
export const createExpenseEntry = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		date: v.string(),
		amount: v.number(),
		expenseCategory: v.string(),
		description: v.string(),
		paymentMethod: v.union(
			v.literal("bank"),
			v.literal("cash"),
			v.literal("card"),
		),
		counterparty: v.optional(v.string()),
		taxAmount: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Map expense category to account
		const expenseAccountMap: Record<string, string> = {
			Материалы: "10",
			Зарплата: "70",
			Налоги: "68",
			Общехозяйственные: "26",
			Производство: "20",
			Прочие: "91",
		};

		const expenseAccountCode = expenseAccountMap[args.expenseCategory] || "91";

		// Get payment account based on method
		const paymentAccountCode = args.paymentMethod === "cash" ? "50" : "51";

		// Get accounts
		const [expenseAccount, paymentAccount] = await Promise.all([
			ctx.db
				.query("accounts")
				.withIndex("by_code", (q) =>
					q
						.eq("organizationId", organization._id)
						.eq("code", expenseAccountCode),
				)
				.first(),
			ctx.db
				.query("accounts")
				.withIndex("by_code", (q) =>
					q
						.eq("organizationId", organization._id)
						.eq("code", paymentAccountCode),
				)
				.first(),
		]);

		if (!expenseAccount || !paymentAccount) {
			throw new Error("Необходимые счета не найдены");
		}

		// Create simplified expense entry
		const lines = [
			{
				accountCode: expenseAccountCode,
				debit: args.amount,
				credit: 0,
				description: args.description,
				taxAmount: args.taxAmount,
			},
			{
				accountCode: paymentAccountCode,
				debit: 0,
				credit: args.amount,
				description: `Оплата: ${args.description}`,
			},
		];

		return await createJournalEntry(ctx, {
			projectId: args.projectId,
			date: args.date,
			description: `Расход: ${args.description}`,
			type: "expense",
			lines,
		});
	},
});
