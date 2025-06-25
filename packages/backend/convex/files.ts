import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID or skip user tracking
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

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
				const uploader = await ctx.db.get(attachment.uploadedBy);
				return { ...attachment, uploader };
			}),
		);

		return attachmentsWithUsers;
	},
});

export const removeAttachment = mutation({
	args: { attachmentId: v.id("documentAttachments") },
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID or skip user tracking
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

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

// Issue attachment functions
export const attachToIssue = mutation({
	args: {
		issueId: v.id("issues"),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID or skip user tracking
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

		await ctx.db.insert("issueAttachments", {
			issueId: args.issueId,
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
				const uploader = await ctx.db.get(attachment.uploadedBy);
				return { ...attachment, uploader };
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
