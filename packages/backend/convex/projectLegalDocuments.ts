import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

export const uploadDocument = mutation({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		documentType: v.union(
			v.literal("contract"),
			v.literal("invoice"),
			v.literal("receipt"),
			v.literal("permit"),
			v.literal("certificate"),
			v.literal("report"),
			v.literal("protocol"),
			v.literal("other"),
		),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const project = await ctx.db.get(args.constructionProjectId);
		if (!project) throw new Error("Project not found");

		const documentId = await ctx.db.insert("projectLegalDocuments", {
			constructionProjectId: args.constructionProjectId,
			organizationId: organization._id,
			documentType: args.documentType,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			description: args.description,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
			status: "draft",
		});

		return documentId;
	},
});

export const getProjectDocuments = query({
	args: {
		constructionProjectId: v.id("constructionProjects"),
	},
	handler: async (ctx, args) => {
		const documents = await ctx.db
			.query("projectLegalDocuments")
			.withIndex("by_project", (q) =>
				q.eq("constructionProjectId", args.constructionProjectId),
			)
			.order("desc")
			.collect();

		const documentsWithDetails = await Promise.all(
			documents.map(async (doc) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(doc.uploadedBy),
					ctx.storage.getUrl(doc.fileUrl as any),
				]);
				return {
					...doc,
					fileUrl: fileUrl || doc.fileUrl,
					uploader,
				};
			}),
		);

		return documentsWithDetails;
	},
});

export const deleteDocument = mutation({
	args: {
		documentId: v.id("projectLegalDocuments"),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.documentId);
		if (!document) throw new Error("Document not found");

		// Delete the file from storage
		await ctx.storage.delete(document.fileUrl as any);

		// Delete the document record
		await ctx.db.delete(args.documentId);

		return { success: true };
	},
});

export const updateDocument = mutation({
	args: {
		documentId: v.id("projectLegalDocuments"),
		documentType: v.optional(
			v.union(
				v.literal("contract"),
				v.literal("invoice"),
				v.literal("receipt"),
				v.literal("permit"),
				v.literal("certificate"),
				v.literal("report"),
				v.literal("protocol"),
				v.literal("other"),
			),
		),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("pending_review"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired"),
			),
		),
		description: v.optional(v.string()),
		expirationDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.documentId);
		if (!document) throw new Error("Document not found");

		const updates: any = {};
		if (args.documentType !== undefined)
			updates.documentType = args.documentType;
		if (args.status !== undefined) updates.status = args.status;
		if (args.description !== undefined) updates.description = args.description;
		if (args.expirationDate !== undefined)
			updates.expirationDate = args.expirationDate;

		await ctx.db.patch(args.documentId, updates);

		return { success: true };
	},
});
