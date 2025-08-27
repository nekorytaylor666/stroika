import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import type { Id } from "../_generated/dataModel";

// Generate payment number
const generatePaymentNumber = (type: "incoming" | "outgoing", index: number): string => {
	const prefix = type === "incoming" ? "ВП" : "ИП"; // ВП - Входящий платеж, ИП - Исходящий платеж
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	return `${prefix}-${date}-${String(index).padStart(4, "0")}`;
};

// Create payment
export const createPayment = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		type: v.union(v.literal("incoming"), v.literal("outgoing")),
		amount: v.number(),
		currency: v.optional(v.string()),
		paymentDate: v.string(),
		dueDate: v.optional(v.string()),
		counterparty: v.string(),
		counterpartyInn: v.optional(v.string()),
		purpose: v.string(),
		bankAccount: v.optional(v.string()),
		paymentMethod: v.union(
			v.literal("bank_transfer"),
			v.literal("cash"),
			v.literal("card"),
			v.literal("other")
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		
		// Get count for payment number
		const existingPayments = await ctx.db
			.query("payments")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.collect();
			
		const paymentNumber = generatePaymentNumber(args.type, existingPayments.length + 1);
		
		const paymentId = await ctx.db.insert("payments", {
			organizationId: organization._id,
			projectId: args.projectId,
			paymentNumber,
			type: args.type,
			amount: args.amount,
			currency: args.currency || "RUB",
			paymentDate: args.paymentDate,
			dueDate: args.dueDate,
			counterparty: args.counterparty,
			counterpartyInn: args.counterpartyInn,
			purpose: args.purpose,
			status: "pending",
			bankAccount: args.bankAccount,
			paymentMethod: args.paymentMethod,
			notes: args.notes,
			createdBy: user._id,
			confirmedBy: undefined,
			createdAt: Date.now(),
			confirmedAt: undefined,
		});
		
		return { paymentId, paymentNumber };
	},
});

// Get project payments
export const getProjectPayments = query({
	args: { 
		projectId: v.id("constructionProjects"),
		type: v.optional(v.union(v.literal("incoming"), v.literal("outgoing"))),
		status: v.optional(v.union(
			v.literal("pending"),
			v.literal("confirmed"),
			v.literal("rejected"),
			v.literal("cancelled")
		)),
	},
	handler: async (ctx, args) => {
		let query = ctx.db
			.query("payments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId));
			
		let payments = await query.collect();
		
		// Filter by type if specified
		if (args.type) {
			payments = payments.filter(p => p.type === args.type);
		}
		
		// Filter by status if specified
		if (args.status) {
			payments = payments.filter(p => p.status === args.status);
		}
		
		// Get user details
		const paymentsWithUsers = await Promise.all(
			payments.map(async (payment) => {
				const [createdBy, confirmedBy] = await Promise.all([
					ctx.db.get(payment.createdBy),
					payment.confirmedBy ? ctx.db.get(payment.confirmedBy) : null,
				]);
				
				return {
					...payment,
					createdBy,
					confirmedBy,
				};
			})
		);
		
		return paymentsWithUsers.sort((a, b) => 
			new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
		);
	},
});

// Update payment status
export const updatePaymentStatus = mutation({
	args: {
		paymentId: v.id("payments"),
		status: v.union(
			v.literal("confirmed"),
			v.literal("rejected"),
			v.literal("cancelled")
		),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) throw new Error("Платеж не найден");
		
		await ctx.db.patch(args.paymentId, {
			status: args.status,
			confirmedBy: args.status === "confirmed" ? user._id : undefined,
			confirmedAt: args.status === "confirmed" ? Date.now() : undefined,
		});
		
		// If confirmed, create journal entry
		if (args.status === "confirmed") {
			await createJournalEntryForPayment(ctx, payment);
		}
		
		return { success: true };
	},
});

// Create journal entry for confirmed payment
async function createJournalEntryForPayment(ctx: any, payment: any) {
	const { organization } = await getCurrentUserWithOrganization(ctx);
	
	// Get accounts
	const bankAccount = await ctx.db
		.query("accounts")
		.withIndex("by_code", (q) => 
			q.eq("organizationId", organization._id)
			 .eq("code", "51") // Расчетные счета
		)
		.first();
		
	const counterpartyAccount = await ctx.db
		.query("accounts")
		.withIndex("by_code", (q) => 
			q.eq("organizationId", organization._id)
			 .eq("code", payment.type === "incoming" ? "62" : "60") // 62 - покупатели, 60 - поставщики
		)
		.first();
		
	if (!bankAccount || !counterpartyAccount) {
		throw new Error("Необходимые счета не найдены. Инициализируйте план счетов.");
	}
	
	// Create journal entry
	const entryNumber = `АВТ-${payment.paymentNumber}`;
	const journalEntryId = await ctx.db.insert("journalEntries", {
		organizationId: organization._id,
		projectId: payment.projectId,
		entryNumber,
		date: payment.paymentDate,
		description: `${payment.type === "incoming" ? "Поступление" : "Оплата"}: ${payment.purpose}`,
		type: "payment",
		status: "posted",
		relatedPaymentId: payment._id,
		createdBy: payment.createdBy,
		approvedBy: payment.confirmedBy,
		createdAt: Date.now(),
		postedAt: Date.now(),
	});
	
	// Create journal lines
	if (payment.type === "incoming") {
		// Debit bank, credit receivables
		await ctx.db.insert("journalLines", {
			journalEntryId,
			accountId: bankAccount._id,
			debit: payment.amount,
			credit: 0,
			description: `Поступление от ${payment.counterparty}`,
			createdAt: Date.now(),
		});
		
		await ctx.db.insert("journalLines", {
			journalEntryId,
			accountId: counterpartyAccount._id,
			debit: 0,
			credit: payment.amount,
			description: `Погашение задолженности ${payment.counterparty}`,
			createdAt: Date.now(),
		});
	} else {
		// Credit bank, debit payables
		await ctx.db.insert("journalLines", {
			journalEntryId,
			accountId: counterpartyAccount._id,
			debit: payment.amount,
			credit: 0,
			description: `Оплата ${payment.counterparty}`,
			createdAt: Date.now(),
		});
		
		await ctx.db.insert("journalLines", {
			journalEntryId,
			accountId: bankAccount._id,
			debit: 0,
			credit: payment.amount,
			description: `Перечисление ${payment.counterparty}`,
			createdAt: Date.now(),
		});
	}
	
	// Clear cached balances for affected accounts
	await ctx.db
		.query("accountBalances")
		.withIndex("by_account", (q) => q.eq("accountId", bankAccount._id))
		.collect()
		.then(balances => 
			Promise.all(balances.map(b => ctx.db.delete(b._id)))
		);
		
	await ctx.db
		.query("accountBalances")
		.withIndex("by_account", (q) => q.eq("accountId", counterpartyAccount._id))
		.collect()
		.then(balances => 
			Promise.all(balances.map(b => ctx.db.delete(b._id)))
		);
}

// Add document to payment
export const addPaymentDocument = mutation({
	args: {
		paymentId: v.id("payments"),
		documentType: v.union(
			v.literal("invoice"),
			v.literal("act"),
			v.literal("contract"),
			v.literal("receipt"),
			v.literal("bank_statement"),
			v.literal("other")
		),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		
		await ctx.db.insert("paymentDocuments", {
			paymentId: args.paymentId,
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

// Get payment documents
export const getPaymentDocuments = query({
	args: { paymentId: v.id("payments") },
	handler: async (ctx, args) => {
		const documents = await ctx.db
			.query("paymentDocuments")
			.withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
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
			})
		);
		
		return documentsWithUrls;
	},
});

// Get payment statistics for project
export const getPaymentStatistics = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const payments = await ctx.db
			.query("payments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
			
		const confirmed = payments.filter(p => p.status === "confirmed");
		const pending = payments.filter(p => p.status === "pending");
		
		const totalIncoming = confirmed
			.filter(p => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);
			
		const totalOutgoing = confirmed
			.filter(p => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);
			
		const pendingIncoming = pending
			.filter(p => p.type === "incoming")
			.reduce((sum, p) => sum + p.amount, 0);
			
		const pendingOutgoing = pending
			.filter(p => p.type === "outgoing")
			.reduce((sum, p) => sum + p.amount, 0);
			
		return {
			totalIncoming,
			totalOutgoing,
			pendingIncoming,
			pendingOutgoing,
			netCashFlow: totalIncoming - totalOutgoing,
			totalPayments: payments.length,
			confirmedPayments: confirmed.length,
			pendingPayments: pending.length,
		};
	},
});