import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	getCurrentUser,
	getCurrentUserWithOrganization,
} from "./helpers/getCurrentUser";

export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		return await ctx.storage.generateUploadUrl();
	},
});

export const getUrl = query({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, args) => {
		return await ctx.storage.getUrl(args.storageId);
	},
});

export const deleteFile = mutation({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		await ctx.storage.delete(args.storageId);
	},
});

export const attachToDocument = mutation({
	args: {
		documentId: v.id("documents"),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		await ctx.db.insert("documentAttachments", {
			documentId: args.documentId,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});

		// Log activity
		await ctx.db.insert("documentActivity", {
			documentId: args.documentId,
			userId: user._id,
			action: "attachment_added",
			details: args.fileName,
			timestamp: Date.now(),
		});
	},
});

export const getDocumentAttachments = query({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const attachments = await ctx.db
			.query("documentAttachments")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.collect();

		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					uploader,
				};
			}),
		);

		return attachmentsWithUsers;
	},
});

export const removeAttachment = mutation({
	args: { attachmentId: v.id("documentAttachments") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const attachment = await ctx.db.get(args.attachmentId);
		if (!attachment) throw new Error("Attachment not found");

		await ctx.db.delete(args.attachmentId);

		// Log activity
		await ctx.db.insert("documentActivity", {
			documentId: attachment.documentId,
			userId: user._id,
			action: "attachment_removed",
			details: attachment.fileName,
			timestamp: Date.now(),
		});
	},
});

// Issue/Project attachment functions
export const attachToIssue = mutation({
	args: {
		issueId: v.optional(v.id("issues")), // Now optional
		projectId: v.optional(v.id("constructionProjects")), // For direct project attachments
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Ensure at least one of issueId or projectId is provided
		if (!args.issueId && !args.projectId) {
			throw new Error("Either issueId or projectId must be provided");
		}

		await ctx.db.insert("issueAttachments", {
			issueId: args.issueId,
			projectId: args.projectId,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});
	},
});

export const getIssueAttachments = query({
	args: { issueId: v.id("issues") },
	handler: async (ctx, args) => {
		const attachments = await ctx.db
			.query("issueAttachments")
			.withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
			.collect();

		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					uploader,
				};
			}),
		);

		return attachmentsWithUsers;
	},
});

// Get attachments for a project (not tied to specific issues)
export const getProjectAttachments = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const attachments = await ctx.db
			.query("issueAttachments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("issueId"), undefined)) // Only get project-level attachments
			.collect();

		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					uploader,
				};
			}),
		);

		return attachmentsWithUsers;
	},
});

export const removeIssueAttachment = mutation({
	args: { attachmentId: v.id("issueAttachments") },
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		const attachment = await ctx.db.get(args.attachmentId);
		if (!attachment) throw new Error("Attachment not found");

		await ctx.db.delete(args.attachmentId);
	},
});

// Upload file to project (with optional issue linking)
export const uploadToProject = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		projectId: v.id("constructionProjects"),
		issueId: v.optional(v.id("issues")), // Optional - attach to specific issue if provided
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Directly attach to project (and optionally to issue)
		await ctx.db.insert("issueAttachments", {
			issueId: args.issueId || undefined, // Optional issue attachment
			projectId: args.projectId, // Always attach to project
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});
	},
});

export const getProjectAttachments = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const attachments = await ctx.db
			.query("issueAttachments")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					uploader,
				};
			}),
		);

		return attachmentsWithUsers;
	},
});

export const uploadToGeneral = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// General attachments without issue or project association
		await ctx.db.insert("issueAttachments", {
			issueId: undefined,
			projectId: undefined,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});
	},
});
