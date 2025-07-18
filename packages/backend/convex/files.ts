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

// Upload file without linking to specific issue (for general attachments page)
export const uploadToGeneral = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
	},
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

		// Create a placeholder issue for general attachments
		// This could be improved in the future by having a separate attachments table
		const generalIssue = await ctx.db
			.query("issues")
			.filter((q) => q.eq(q.field("title"), "[General Attachments]"))
			.first();

		let issueId = generalIssue?._id;

		if (!issueId) {
			// Create a general attachments issue if it doesn't exist
			issueId = await ctx.db.insert("issues", {
				title: "[General Attachments]",
				description: "Container for general file attachments",
				identifier: "GENERAL-001",
				projectId: null as any,
				statusId: null as any,
				priorityId: null as any,
				assignedTo: null,
				createdBy: user._id,
				updatedBy: user._id,
				dueDate: null,
				stateId: null as any,
				estimate: null,
				sortOrder: 0,
				completedAt: null,
				canceledAt: null,
				archivedAt: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				startsAt: null,
				organizationId: null as any,
				isConstructionTask: true,
			});
		}

		await ctx.db.insert("issueAttachments", {
			issueId,
			fileName: args.fileName,
			fileUrl: args.storageId,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
		});
	},
});
