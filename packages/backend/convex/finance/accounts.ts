import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Standard Russian Chart of Accounts for construction
const STANDARD_ACCOUNTS = [
	// АКТИВЫ (Assets)
	{
		code: "01",
		name: "Основные средства",
		type: "asset" as const,
		category: "Внеоборотные активы",
	},
	{
		code: "10",
		name: "Материалы",
		type: "asset" as const,
		category: "Оборотные активы",
	},
	{
		code: "20",
		name: "Основное производство",
		type: "asset" as const,
		category: "Затраты на производство",
	},
	{
		code: "26",
		name: "Общехозяйственные расходы",
		type: "expense" as const,
		category: "Расходы",
	},
	{
		code: "41",
		name: "Товары",
		type: "asset" as const,
		category: "Оборотные активы",
	},
	{
		code: "50",
		name: "Касса",
		type: "asset" as const,
		category: "Денежные средства",
	},
	{
		code: "51",
		name: "Расчетные счета",
		type: "asset" as const,
		category: "Денежные средства",
	},
	{
		code: "60",
		name: "Расчеты с поставщиками и подрядчиками",
		type: "liability" as const,
		category: "Кредиторская задолженность",
	},
	{
		code: "62",
		name: "Расчеты с покупателями и заказчиками",
		type: "asset" as const,
		category: "Дебиторская задолженность",
	},
	{
		code: "66",
		name: "Расчеты по краткосрочным кредитам и займам",
		type: "liability" as const,
		category: "Заемные средства",
	},
	{
		code: "67",
		name: "Расчеты по долгосрочным кредитам и займам",
		type: "liability" as const,
		category: "Заемные средства",
	},
	{
		code: "68",
		name: "Расчеты по налогам и сборам",
		type: "liability" as const,
		category: "Обязательства",
	},
	{
		code: "69",
		name: "Расчеты по социальному страхованию",
		type: "liability" as const,
		category: "Обязательства",
	},
	{
		code: "70",
		name: "Расчеты с персоналом по оплате труда",
		type: "liability" as const,
		category: "Обязательства",
	},
	{
		code: "71",
		name: "Расчеты с подотчетными лицами",
		type: "asset" as const,
		category: "Дебиторская задолженность",
	},
	{
		code: "76",
		name: "Расчеты с разными дебиторами и кредиторами",
		type: "asset" as const,
		category: "Прочие расчеты",
	},

	// КАПИТАЛ (Equity)
	{
		code: "80",
		name: "Уставный капитал",
		type: "equity" as const,
		category: "Капитал",
	},
	{
		code: "84",
		name: "Нераспределенная прибыль",
		type: "equity" as const,
		category: "Капитал",
	},

	// ДОХОДЫ И РАСХОДЫ (Revenue and Expenses)
	{
		code: "90",
		name: "Продажи",
		type: "revenue" as const,
		category: "Доходы от основной деятельности",
	},
	{
		code: "91",
		name: "Прочие доходы и расходы",
		type: "revenue" as const,
		category: "Прочие доходы",
	},
	{
		code: "99",
		name: "Прибыли и убытки",
		type: "equity" as const,
		category: "Финансовый результат",
	},
];

// Initialize standard accounts for organization
export const initializeAccounts = mutation({
	args: {},
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Check if accounts already exist
		const existingAccounts = await ctx.db
			.query("accounts")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.first();

		if (existingAccounts) {
			return { success: false, message: "Accounts already initialized" };
		}

		// Create standard accounts
		for (const account of STANDARD_ACCOUNTS) {
			await ctx.db.insert("accounts", {
				organizationId: organization.id,
				code: account.code,
				name: account.name,
				type: account.type,
				category: account.category,
				parentAccountId: undefined,
				isActive: true,
				description: undefined,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
		}

		return { success: true, message: "Accounts initialized successfully" };
	},
});

// Get all accounts for organization
export const getAccounts = query({
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		return await ctx.db
			.query("accounts")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();
	},
});

// Get accounts by type
export const getAccountsByType = query({
	args: {
		type: v.union(
			v.literal("asset"),
			v.literal("liability"),
			v.literal("equity"),
			v.literal("revenue"),
			v.literal("expense"),
		),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		return await ctx.db
			.query("accounts")
			.withIndex("by_type", (q) =>
				q.eq("organizationId", organization.id).eq("type", args.type),
			)
			.collect();
	},
});

// Create custom account
export const createAccount = mutation({
	args: {
		code: v.string(),
		name: v.string(),
		type: v.union(
			v.literal("asset"),
			v.literal("liability"),
			v.literal("equity"),
			v.literal("revenue"),
			v.literal("expense"),
		),
		category: v.optional(v.string()),
		parentAccountId: v.optional(v.id("accounts")),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Check if account code already exists
		const existing = await ctx.db
			.query("accounts")
			.withIndex("by_code", (q) =>
				q.eq("organizationId", organization.id).eq("code", args.code),
			)
			.first();

		if (existing) {
			throw new Error(`Счет с кодом ${args.code} уже существует`);
		}

		return await ctx.db.insert("accounts", {
			organizationId: organization.id,
			code: args.code,
			name: args.name,
			type: args.type,
			category: args.category,
			parentAccountId: args.parentAccountId,
			isActive: true,
			description: args.description,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});

// Update account
export const updateAccount = mutation({
	args: {
		id: v.id("accounts"),
		name: v.optional(v.string()),
		category: v.optional(v.string()),
		description: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;

		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Get account balance for a period
export const getAccountBalance = query({
	args: {
		accountId: v.id("accounts"),
		projectId: v.optional(v.id("constructionProjects")),
		period: v.optional(v.string()), // YYYY-MM format
	},
	handler: async (ctx, args) => {
		const period = args.period || new Date().toISOString().slice(0, 7);

		// Try to get cached balance first
		const balance = await ctx.db
			.query("accountBalances")
			.withIndex("by_account_period", (q) => {
				const query = q.eq("accountId", args.accountId).eq("period", period);
				return query;
			})
			.filter((q) => {
				if (args.projectId) {
					return q.eq(q.field("projectId"), args.projectId);
				}
				return q.eq(q.field("projectId"), undefined);
			})
			.first();

		if (balance) {
			return balance;
		}

		// Calculate balance from journal lines
		const journalEntries = await ctx.db
			.query("journalEntries")
			.withIndex("by_date", (q) => q.lte("date", period + "-31"))
			.filter((q) => {
				let condition = q.eq(q.field("status"), "posted");
				if (args.projectId) {
					condition = q.and(
						condition,
						q.eq(q.field("projectId"), args.projectId),
					);
				}
				return condition;
			})
			.collect();

		const entryIds = journalEntries.map((e) => e._id);

		const journalLines = await ctx.db
			.query("journalLines")
			.withIndex("by_account", (q) => q.eq("accountId", args.accountId))
			.filter((q) => {
				// Check if journalEntryId is in entryIds
				return entryIds.some((id) => q.eq(q.field("journalEntryId"), id));
			})
			.collect();

		const totalDebits = journalLines.reduce((sum, line) => sum + line.debit, 0);
		const totalCredits = journalLines.reduce(
			(sum, line) => sum + line.credit,
			0,
		);

		// Get account type to determine normal balance
		const account = await ctx.db.get(args.accountId);
		if (!account) throw new Error("Account not found");

		// Assets and Expenses have debit normal balance
		// Liabilities, Equity, and Revenue have credit normal balance
		const isDebitAccount =
			account.type === "asset" || account.type === "expense";
		const closingBalance = isDebitAccount
			? totalDebits - totalCredits
			: totalCredits - totalDebits;

		// Cache the balance
		const balanceData = {
			accountId: args.accountId,
			projectId: args.projectId,
			period,
			openingBalance: 0, // Would need previous period balance
			totalDebits,
			totalCredits,
			closingBalance,
			lastUpdated: Date.now(),
		};

		await ctx.db.insert("accountBalances", balanceData);

		return balanceData;
	},
});
