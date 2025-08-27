import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

// Upload a legal document
export const uploadDocument = mutation({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		documentType: v.union(
			v.literal("contract"),
			v.literal("invoice"),
			v.literal("permit"),
			v.literal("insurance"),
			v.literal("report"),
			v.literal("legal"),
			v.literal("financial"),
			v.literal("other"),
		),
		title: v.string(),
		description: v.optional(v.string()),
		storageId: v.id("_storage"),
		fileName: v.string(),
		fileSize: v.number(),
		mimeType: v.string(),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired"),
				v.literal("archived"),
			),
		),
		validUntil: v.optional(v.string()),
		metadata: v.optional(v.string()),
		isPrivate: v.optional(v.boolean()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Verify project belongs to organization
		const project = await ctx.db.get(args.constructionProjectId);
		if (!project || project.organizationId !== organization._id) {
			throw new Error("Project not found or access denied");
		}

		const documentId = await ctx.db.insert("projectLegalDocuments", {
			constructionProjectId: args.constructionProjectId,
			organizationId: organization._id,
			documentType: args.documentType,
			title: args.title,
			description: args.description,
			storageId: args.storageId,
			fileName: args.fileName,
			fileSize: args.fileSize,
			mimeType: args.mimeType,
			uploadedBy: user._id,
			uploadedAt: Date.now(),
			status: args.status || "pending",
			validUntil: args.validUntil,
			metadata: args.metadata,
			isPrivate: args.isPrivate || false,
			allowedUserIds: [],
			tags: args.tags || [],
		});

		return documentId;
	},
});

// Get all documents for a project
export const getProjectDocuments = query({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		documentType: v.optional(
			v.union(
				v.literal("contract"),
				v.literal("invoice"),
				v.literal("permit"),
				v.literal("insurance"),
				v.literal("report"),
				v.literal("legal"),
				v.literal("financial"),
				v.literal("other"),
			),
		),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired"),
				v.literal("archived"),
			),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Verify project belongs to organization
		const project = await ctx.db.get(args.constructionProjectId);
		if (!project || project.organizationId !== organization._id) {
			return [];
		}

		const documentsQuery = ctx.db
			.query("projectLegalDocuments")
			.withIndex("by_project", (q) =>
				q.eq("constructionProjectId", args.constructionProjectId),
			);

		// Apply filters if provided
		let documents = await documentsQuery.collect();

		if (args.documentType) {
			documents = documents.filter(
				(doc) => doc.documentType === args.documentType,
			);
		}

		if (args.status) {
			documents = documents.filter((doc) => doc.status === args.status);
		}

		// Sort by upload date (newest first)
		documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

		// Enrich with uploader information
		const enrichedDocuments = await Promise.all(
			documents.map(async (doc) => {
				const uploader = await ctx.db.get(doc.uploadedBy);
				const url = await ctx.storage.getUrl(doc.storageId);
				return {
					...doc,
					uploader,
					url,
				};
			}),
		);

		return enrichedDocuments;
	},
});

// Get specific document details
export const getDocumentById = query({
	args: { id: v.id("projectLegalDocuments") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document || document.organizationId !== organization._id) {
			return null;
		}

		// Check permissions
		if (document.isPrivate && document.uploadedBy !== user._id) {
			if (!document.allowedUserIds.includes(user._id)) {
				return null;
			}
		}

		const uploader = await ctx.db.get(document.uploadedBy);
		const url = await ctx.storage.getUrl(document.storageId);

		return {
			...document,
			uploader,
			url,
		};
	},
});

// Update document metadata
export const updateDocument = mutation({
	args: {
		id: v.id("projectLegalDocuments"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired"),
				v.literal("archived"),
			),
		),
		validUntil: v.optional(v.string()),
		metadata: v.optional(v.string()),
		isPrivate: v.optional(v.boolean()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document || document.organizationId !== organization._id) {
			throw new Error("Document not found or access denied");
		}

		// Only uploader or admin can update (permission check placeholder)
		// TODO: Add proper permission check when permissions are implemented

		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);

		return { success: true };
	},
});

// Delete a document
export const deleteDocument = mutation({
	args: { id: v.id("projectLegalDocuments") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document || document.organizationId !== organization._id) {
			throw new Error("Document not found or access denied");
		}

		// Only uploader or admin can delete (permission check placeholder)
		// TODO: Add proper permission check when permissions are implemented

		// Delete from storage
		await ctx.storage.delete(document.storageId);

		// Delete document record
		await ctx.db.delete(args.id);

		return { success: true };
	},
});

// Get document URL for download
export const getDocumentUrl = query({
	args: { id: v.id("projectLegalDocuments") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document || document.organizationId !== organization._id) {
			return null;
		}

		// Check permissions
		if (document.isPrivate && document.uploadedBy !== user._id) {
			if (!document.allowedUserIds.includes(user._id)) {
				return null;
			}
		}

		return await ctx.storage.getUrl(document.storageId);
	},
});

// Update document status
export const updateDocumentStatus = mutation({
	args: {
		id: v.id("projectLegalDocuments"),
		status: v.union(
			v.literal("draft"),
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("expired"),
			v.literal("archived"),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document || document.organizationId !== organization._id) {
			throw new Error("Document not found or access denied");
		}

		// TODO: Add proper permission check when permissions are implemented

		await ctx.db.patch(args.id, { status: args.status });

		return { success: true };
	},
});

// Search documents with filters
export const searchDocuments = query({
	args: {
		organizationId: v.optional(v.id("organizations")),
		search: v.optional(v.string()),
		documentType: v.optional(
			v.union(
				v.literal("contract"),
				v.literal("invoice"),
				v.literal("permit"),
				v.literal("insurance"),
				v.literal("report"),
				v.literal("legal"),
				v.literal("financial"),
				v.literal("other"),
			),
		),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("pending"),
				v.literal("approved"),
				v.literal("rejected"),
				v.literal("expired"),
				v.literal("archived"),
			),
		),
		uploaderId: v.optional(v.id("users")),
		startDate: v.optional(v.number()),
		endDate: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const documentsQuery = ctx.db
			.query("projectLegalDocuments")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId || organization._id),
			);

		let documents = await documentsQuery.collect();

		// Apply search filter
		if (args.search) {
			const searchLower = args.search.toLowerCase();
			documents = documents.filter(
				(doc) =>
					doc.title.toLowerCase().includes(searchLower) ||
					doc.fileName.toLowerCase().includes(searchLower) ||
					doc.description?.toLowerCase().includes(searchLower) ||
					doc.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
			);
		}

		// Apply type filter
		if (args.documentType) {
			documents = documents.filter(
				(doc) => doc.documentType === args.documentType,
			);
		}

		// Apply status filter
		if (args.status) {
			documents = documents.filter((doc) => doc.status === args.status);
		}

		// Apply uploader filter
		if (args.uploaderId) {
			documents = documents.filter((doc) => doc.uploadedBy === args.uploaderId);
		}

		// Apply date range filter
		if (args.startDate || args.endDate) {
			documents = documents.filter((doc) => {
				if (args.startDate && doc.uploadedAt < args.startDate) return false;
				if (args.endDate && doc.uploadedAt > args.endDate) return false;
				return true;
			});
		}

		// Apply tag filter
		if (args.tags && args.tags.length > 0) {
			documents = documents.filter((doc) =>
				args.tags!.some((tag) => doc.tags.includes(tag)),
			);
		}

		// Sort by upload date (newest first)
		documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

		// Enrich with uploader information and project
		const enrichedDocuments = await Promise.all(
			documents.map(async (doc) => {
				const [uploader, project] = await Promise.all([
					ctx.db.get(doc.uploadedBy),
					ctx.db.get(doc.constructionProjectId),
				]);
				const url = await ctx.storage.getUrl(doc.storageId);
				return {
					...doc,
					uploader,
					project,
					url,
				};
			}),
		);

		return enrichedDocuments;
	},
});

// Get documents by type for a project
export const getDocumentsByType = query({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		documentType: v.union(
			v.literal("contract"),
			v.literal("invoice"),
			v.literal("permit"),
			v.literal("insurance"),
			v.literal("report"),
			v.literal("legal"),
			v.literal("financial"),
			v.literal("other"),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Verify project belongs to organization
		const project = await ctx.db.get(args.constructionProjectId);
		if (!project || project.organizationId !== organization._id) {
			return [];
		}

		const documents = await ctx.db
			.query("projectLegalDocuments")
			.withIndex("by_project", (q) =>
				q.eq("constructionProjectId", args.constructionProjectId),
			)
			.filter((q) => q.eq(q.field("documentType"), args.documentType))
			.collect();

		// Sort by upload date (newest first)
		documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

		// Enrich with uploader information
		const enrichedDocuments = await Promise.all(
			documents.map(async (doc) => {
				const uploader = await ctx.db.get(doc.uploadedBy);
				const url = await ctx.storage.getUrl(doc.storageId);
				return {
					...doc,
					uploader,
					url,
				};
			}),
		);

		return enrichedDocuments;
	},
});

// Get document statistics for a project
export const getDocumentStats = query({
	args: { constructionProjectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Verify project belongs to organization
		const project = await ctx.db.get(args.constructionProjectId);
		if (!project || project.organizationId !== organization._id) {
			return null;
		}

		const documents = await ctx.db
			.query("projectLegalDocuments")
			.withIndex("by_project", (q) =>
				q.eq("constructionProjectId", args.constructionProjectId),
			)
			.collect();

		// Calculate statistics
		const stats = {
			total: documents.length,
			byType: {} as Record<string, number>,
			byStatus: {} as Record<string, number>,
			totalSize: 0,
			expiringSoon: 0,
			expired: 0,
		};

		const now = new Date();
		const thirtyDaysFromNow = new Date(
			now.getTime() + 30 * 24 * 60 * 60 * 1000,
		);

		for (const doc of documents) {
			// Count by type
			stats.byType[doc.documentType] =
				(stats.byType[doc.documentType] || 0) + 1;

			// Count by status
			stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

			// Total size
			stats.totalSize += doc.fileSize;

			// Check expiration
			if (doc.validUntil) {
				const expirationDate = new Date(doc.validUntil);
				if (expirationDate < now) {
					stats.expired++;
				} else if (expirationDate < thirtyDaysFromNow) {
					stats.expiringSoon++;
				}
			}
		}

		return stats;
	},
});

// Check if user has access to a document
export const checkDocumentAccess = query({
	args: {
		documentId: v.id("projectLegalDocuments"),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.documentId);
		if (!document || document.organizationId !== organization._id) {
			return { hasAccess: false, reason: "Document not found" };
		}

		// Public documents are accessible to all organization members
		if (!document.isPrivate) {
			return { hasAccess: true, reason: "Public document" };
		}

		// Private documents - check if user is uploader
		if (document.uploadedBy === user._id) {
			return { hasAccess: true, reason: "Document owner" };
		}

		// Check if user is in allowed list
		if (document.allowedUserIds.includes(user._id)) {
			return { hasAccess: true, reason: "Explicitly allowed" };
		}

		// TODO: Add role-based permission checks when implemented

		return { hasAccess: false, reason: "No access permission" };
	},
});

// Add user to document access list
export const grantDocumentAccess = mutation({
	args: {
		documentId: v.id("projectLegalDocuments"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.documentId);
		if (!document || document.organizationId !== organization._id) {
			throw new Error("Document not found or access denied");
		}

		// Only document owner or admin can grant access
		// TODO: Add proper admin check when permissions are implemented
		if (document.uploadedBy !== user._id) {
			throw new Error("Only document owner can grant access");
		}

		// Add user to allowed list if not already there
		if (!document.allowedUserIds.includes(args.userId)) {
			await ctx.db.patch(args.documentId, {
				allowedUserIds: [...document.allowedUserIds, args.userId],
			});
		}

		return { success: true };
	},
});

// Revoke user access to document
export const revokeDocumentAccess = mutation({
	args: {
		documentId: v.id("projectLegalDocuments"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.documentId);
		if (!document || document.organizationId !== organization._id) {
			throw new Error("Document not found or access denied");
		}

		// Only document owner or admin can revoke access
		// TODO: Add proper admin check when permissions are implemented
		if (document.uploadedBy !== user._id) {
			throw new Error("Only document owner can revoke access");
		}

		// Remove user from allowed list
		await ctx.db.patch(args.documentId, {
			allowedUserIds: document.allowedUserIds.filter(
				(id) => id !== args.userId,
			),
		});

		return { success: true };
	},
});
