import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";

// Generate expense number
const generateExpenseNumber = (category: string, index: number): string => {
	const categoryPrefix =
		{
			materials: "МАТ",
			labor: "РАБ",
			equipment: "ОБО",
			transport: "ТРА",
			utilities: "КОМ",
			permits: "РАЗ",
			insurance: "СТР",
			taxes: "НАЛ",
			other: "ПРО",
		}[category] || "РАС";

	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	return `${categoryPrefix}-${date}-${String(index).padStart(4, "0")}`;
};

// Create expense
export const createExpense = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		category: v.union(
			v.literal("materials"),
			v.literal("labor"),
			v.literal("equipment"),
			v.literal("transport"),
			v.literal("utilities"),
			v.literal("permits"),
			v.literal("insurance"),
			v.literal("taxes"),
			v.literal("other"),
		),
		description: v.string(),
		amount: v.number(),
		currency: v.optional(v.string()),
		expenseDate: v.string(),
		vendor: v.string(),
		vendorInn: v.optional(v.string()),
		invoiceNumber: v.optional(v.string()),
		paymentMethod: v.union(
			v.literal("bank_transfer"),
			v.literal("cash"),
			v.literal("card"),
			v.literal("other"),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Get count for expense number
		const existingExpenses = await ctx.db
			.query("expenses")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization._id),
			)
			.collect();

		const expenseNumber = generateExpenseNumber(
			args.category,
			existingExpenses.length + 1,
		);

		const expenseId = await ctx.db.insert("expenses", {
			organizationId: organization._id,
			projectId: args.projectId,
			expenseNumber,
			category: args.category,
			description: args.description,
			amount: args.amount,
			currency: args.currency || "RUB",
			expenseDate: args.expenseDate,
			vendor: args.vendor,
			vendorInn: args.vendorInn,
			invoiceNumber: args.invoiceNumber,
			status: "pending",
			paymentMethod: args.paymentMethod,
			relatedPaymentId: undefined,
			notes: args.notes,
			createdBy: user._id,
			approvedBy: undefined,
			paidBy: undefined,
			createdAt: Date.now(),
			approvedAt: undefined,
			paidAt: undefined,
		});

		return { expenseId, expenseNumber };
	},
});

// Get project expenses
export const getProjectExpenses = query({
	args: {
		projectId: v.id("constructionProjects"),
		category: v.optional(
			v.union(
				v.literal("materials"),
				v.literal("labor"),
				v.literal("equipment"),
				v.literal("transport"),
				v.literal("utilities"),
				v.literal("permits"),
				v.literal("insurance"),
				v.literal("taxes"),
				v.literal("other"),
			),
		),
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
		const query = ctx.db
			.query("expenses")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId));

		let expenses = await query.collect();

		// Filter by category if specified
		if (args.category) {
			expenses = expenses.filter((e) => e.category === args.category);
		}

		// Filter by status if specified
		if (args.status) {
			expenses = expenses.filter((e) => e.status === args.status);
		}

		// Get user details and related payment info
		const expensesWithDetails = await Promise.all(
			expenses.map(async (expense) => {
				const [createdBy, approvedBy, paidBy, relatedPayment] =
					await Promise.all([
						ctx.db.get(expense.createdBy),
						expense.approvedBy ? ctx.db.get(expense.approvedBy) : null,
						expense.paidBy ? ctx.db.get(expense.paidBy) : null,
						expense.relatedPaymentId
							? ctx.db.get(expense.relatedPaymentId)
							: null,
					]);

				return {
					...expense,
					createdBy,
					approvedBy,
					paidBy,
					relatedPayment,
				};
			}),
		);

		return expensesWithDetails.sort(
			(a, b) =>
				new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime(),
		);
	},
});

// Update expense status
export const updateExpenseStatus = mutation({
	args: {
		expenseId: v.id("expenses"),
		status: v.union(
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		const expense = await ctx.db.get(args.expenseId);
		if (!expense) throw new Error("Расход не найден");

		const updates: any = {
			status: args.status,
		};

		if (args.status === "approved") {
			updates.approvedBy = user._id;
			updates.approvedAt = Date.now();
		}

		await ctx.db.patch(args.expenseId, updates);
		return { success: true };
	},
});

// Mark expense as paid
export const markExpenseAsPaid = mutation({
	args: {
		expenseId: v.id("expenses"),
		paymentId: v.optional(v.id("payments")),
		createPayment: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const expense = await ctx.db.get(args.expenseId);
		if (!expense) throw new Error("Расход не найден");

		// If creating a payment automatically
		let paymentId = args.paymentId;
		if (args.createPayment && !paymentId) {
			// Get count for payment number
			const existingPayments = await ctx.db
				.query("payments")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", organization._id),
				)
				.collect();

			const paymentNumber = `ИП-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(existingPayments.length + 1).padStart(4, "0")}`;

			paymentId = await ctx.db.insert("payments", {
				organizationId: organization._id,
				projectId: expense.projectId,
				paymentNumber,
				type: "outgoing",
				amount: expense.amount,
				currency: expense.currency,
				paymentDate: new Date().toISOString().split("T")[0],
				counterparty: expense.vendor,
				counterpartyInn: expense.vendorInn,
				purpose: `Оплата: ${expense.description}`,
				status: "confirmed",
				paymentMethod: expense.paymentMethod,
				createdBy: user._id,
				confirmedBy: user._id,
				createdAt: Date.now(),
				confirmedAt: Date.now(),
			});
		}

		await ctx.db.patch(args.expenseId, {
			status: "paid",
			paidBy: user._id,
			paidAt: Date.now(),
			relatedPaymentId: paymentId,
		});

		return { success: true, paymentId };
	},
});

// Add document to expense
export const addExpenseDocument = mutation({
	args: {
		expenseId: v.id("expenses"),
		documentType: v.union(
			v.literal("invoice"),
			v.literal("receipt"),
			v.literal("contract"),
			v.literal("delivery_note"),
			v.literal("act"),
			v.literal("other"),
		),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		await ctx.db.insert("expenseDocuments", {
			expenseId: args.expenseId,
			documentType: args.documentType,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});

		return { success: true };
	},
});

// Get expense documents
export const getExpenseDocuments = query({
	args: { expenseId: v.id("expenses") },
	handler: async (ctx, args) => {
		const documents = await ctx.db
			.query("expenseDocuments")
			.withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
			.collect();

		const documentsWithUrls = await Promise.all(
			documents.map(async (doc) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(doc.uploadedBy),
					ctx.storage.getUrl(doc.fileUrl as Id<"_storage">),
				]);

				return {
					...doc,
					fileUrl: fileUrl || doc.fileUrl,
					uploader,
				};
			}),
		);

		return documentsWithUrls;
	},
});

// Get expense statistics for project
export const getExpenseStatistics = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const expenses = await ctx.db
			.query("expenses")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const approved = expenses.filter((e) => e.status === "approved");
		const paid = expenses.filter((e) => e.status === "paid");
		const pending = expenses.filter((e) => e.status === "pending");

		// Category breakdown
		const categoryTotals = expenses.reduce(
			(acc, expense) => {
				if (expense.status === "paid" || expense.status === "approved") {
					acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			totalExpenses: paid.reduce((sum, e) => sum + e.amount, 0),
			approvedExpenses: approved.reduce((sum, e) => sum + e.amount, 0),
			pendingExpenses: pending.reduce((sum, e) => sum + e.amount, 0),
			totalCount: expenses.length,
			paidCount: paid.length,
			approvedCount: approved.length,
			pendingCount: pending.length,
			categoryBreakdown: categoryTotals,
		};
	},
});

// Update expense
export const updateExpense = mutation({
	args: {
		expenseId: v.id("expenses"),
		category: v.optional(
			v.union(
				v.literal("materials"),
				v.literal("labor"),
				v.literal("equipment"),
				v.literal("transport"),
				v.literal("utilities"),
				v.literal("permits"),
				v.literal("insurance"),
				v.literal("taxes"),
				v.literal("other"),
			),
		),
		description: v.optional(v.string()),
		amount: v.optional(v.number()),
		expenseDate: v.optional(v.string()),
		vendor: v.optional(v.string()),
		vendorInn: v.optional(v.string()),
		invoiceNumber: v.optional(v.string()),
		paymentMethod: v.optional(
			v.union(
				v.literal("bank_transfer"),
				v.literal("cash"),
				v.literal("card"),
				v.literal("other"),
			),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { expenseId, ...updates } = args;

		const expense = await ctx.db.get(expenseId);
		if (!expense) throw new Error("Расход не найден");

		// Only allow updates if expense is not paid
		if (expense.status === "paid") {
			throw new Error("Нельзя редактировать оплаченный расход");
		}

		await ctx.db.patch(expenseId, updates);
		return { success: true };
	},
});

// Delete expense
export const deleteExpense = mutation({
	args: {
		expenseId: v.id("expenses"),
	},
	handler: async (ctx, args) => {
		const expense = await ctx.db.get(args.expenseId);
		if (!expense) throw new Error("Расход не найден");

		// Only allow deletion if expense is not paid
		if (expense.status === "paid") {
			throw new Error("Нельзя удалить оплаченный расход");
		}

		// Delete related documents
		const documents = await ctx.db
			.query("expenseDocuments")
			.withIndex("by_expense", (q) => q.eq("expenseId", args.expenseId))
			.collect();

		for (const doc of documents) {
			await ctx.db.delete(doc._id);
		}

		await ctx.db.delete(args.expenseId);
		return { success: true };
	},
});
