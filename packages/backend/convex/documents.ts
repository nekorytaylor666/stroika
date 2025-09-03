import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";
import { canAccessDocument, canAccessProject } from "./permissions/checks";

export const list = query({
	args: {
		projectId: v.optional(v.id("constructionProjects")),
		parentId: v.optional(v.union(v.id("documents"), v.null())),
		search: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// If filtering by project, check project access
		if (args.projectId) {
			const hasProjectAccess = await canAccessProject(
				ctx,
				user._id,
				args.projectId,
				"read",
			);
			if (!hasProjectAccess) {
				return []; // Return empty if no access to project
			}
		}

		let documents = await ctx.db
			.query("documents")
			.withIndex("by_parent", (q) =>
				q.eq("parentId", args.parentId === undefined ? null : args.parentId),
			)
			.filter((q) => q.eq(q.field("organizationId"), organization._id))
			.collect();

		if (args.projectId) {
			documents = documents.filter((doc) => doc.projectId === args.projectId);
		}

		// Filter documents user has access to
		const accessibleDocuments = [];
		for (const doc of documents) {
			// Check document access
			const hasAccess = await canAccessDocument(
				ctx,
				user._id,
				doc._id,
				"viewer",
			);
			if (hasAccess) {
				accessibleDocuments.push(doc);
			}
		}

		if (args.search) {
			const searchLower = args.search.toLowerCase();
			documents = accessibleDocuments.filter(
				(doc) =>
					doc.title.toLowerCase().includes(searchLower) ||
					doc.content?.toLowerCase().includes(searchLower),
			);
		} else {
			documents = accessibleDocuments;
		}

		const documentsWithDetails = await Promise.all(
			documents.map(async (doc) => {
				const [author, lastEditor, assignedTo, childrenCount] =
					await Promise.all([
						ctx.db.get(doc.authorId),
						doc.lastEditedBy ? ctx.db.get(doc.lastEditedBy) : null,
						doc.assignedTo ? ctx.db.get(doc.assignedTo) : null,
						ctx.db
							.query("documents")
							.withIndex("by_parent", (q) => q.eq("parentId", doc._id))
							.collect()
							.then((children) => children.length),
					]);

				return {
					...doc,
					author,
					lastEditor,
					assignedTo,
					childrenCount,
				};
			}),
		);

		return documentsWithDetails.sort(
			(a, b) => b._creationTime - a._creationTime,
		);
	},
});

export const get = query({
	args: { id: v.id("documents") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		// Check if user has access to this document
		const hasAccess = await canAccessDocument(ctx, user._id, args.id, "viewer");
		if (!hasAccess) {
			throw new Error("Insufficient permissions to view this document");
		}

		const document = await ctx.db.get(args.id);
		if (!document) return null;

		const [author, lastEditor, assignedTo, parent, children] =
			await Promise.all([
				ctx.db.get(document.authorId),
				document.lastEditedBy ? ctx.db.get(document.lastEditedBy) : null,
				document.assignedTo ? ctx.db.get(document.assignedTo) : null,
				document.parentId ? ctx.db.get(document.parentId) : null,
				ctx.db
					.query("documents")
					.withIndex("by_parent", (q) => q.eq("parentId", document._id))
					.collect(),
			]);

		const childrenWithDetails = await Promise.all(
			children.map(async (child) => {
				const childAuthor = await ctx.db.get(child.authorId);
				return { ...child, author: childAuthor };
			}),
		);

		return {
			...document,
			author,
			lastEditor,
			assignedTo,
			parent,
			children: childrenWithDetails,
		};
	},
});

export const create = mutation({
	args: {
		title: v.string(),
		content: v.optional(v.string()),
		projectId: v.optional(v.id("constructionProjects")),
		parentId: v.optional(v.id("documents")),
		assignedTo: v.optional(v.id("users")),
		dueDate: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		grantAccessTo: v.optional(
			v.array(
				v.object({
					userId: v.optional(v.id("users")),
					teamId: v.optional(v.id("teams")),
					accessLevel: v.union(
						v.literal("owner"),
						v.literal("editor"),
						v.literal("commenter"),
						v.literal("viewer"),
					),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// If creating under a project, check project access
		if (args.projectId) {
			const hasProjectAccess = await canAccessProject(
				ctx,
				user._id,
				args.projectId,
				"write",
			);
			if (!hasProjectAccess) {
				throw new Error(
					"Insufficient permissions to create documents in this project",
				);
			}
		}

		// If creating under a parent document, check parent access
		if (args.parentId) {
			const hasParentAccess = await canAccessDocument(
				ctx,
				user._id,
				args.parentId,
				"editor",
			);
			if (!hasParentAccess) {
				throw new Error("Insufficient permissions to create child documents");
			}
		}

		const documentId = await ctx.db.insert("documents", {
			organizationId: organization._id,
			title: args.title,
			content: args.content || "",
			projectId: args.projectId,
			parentId: args.parentId || null,
			authorId: user._id,
			assignedTo: args.assignedTo,
			dueDate: args.dueDate,
			tags: args.tags || [],
			status: "draft",
			version: 1,
			lastEditedBy: user._id,
			lastEditedAt: Date.now(),
		});

		// Grant owner access to the creator
		await ctx.db.insert("documentAccess", {
			documentId,
			userId: user._id,
			teamId: undefined,
			accessLevel: "owner",
			canShare: true,
			grantedBy: user._id,
			grantedAt: Date.now(),
			expiresAt: undefined,
		});

		// Grant access to specified users/teams
		if (args.grantAccessTo) {
			for (const access of args.grantAccessTo) {
				if (!access.userId && !access.teamId) continue;

				await ctx.db.insert("documentAccess", {
					documentId,
					userId: access.userId,
					teamId: access.teamId,
					accessLevel: access.accessLevel,
					canShare:
						access.accessLevel === "owner" || access.accessLevel === "editor",
					grantedBy: user._id,
					grantedAt: Date.now(),
					expiresAt: undefined,
				});
			}
		}

		// If assigned to someone, grant them editor access
		if (args.assignedTo && args.assignedTo !== user._id) {
			const existingAccess = await ctx.db
				.query("documentAccess")
				.withIndex("by_document_user", (q) =>
					q.eq("documentId", documentId).eq("userId", args.assignedTo!),
				)
				.first();

			if (!existingAccess) {
				await ctx.db.insert("documentAccess", {
					documentId,
					userId: args.assignedTo,
					teamId: undefined,
					accessLevel: "editor",
					canShare: true,
					grantedBy: user._id,
					grantedAt: Date.now(),
					expiresAt: undefined,
				});
			}
		}

		return documentId;
	},
});

export const update = mutation({
	args: {
		id: v.id("documents"),
		title: v.optional(v.string()),
		content: v.optional(v.string()),
		status: v.optional(
			v.union(
				v.literal("draft"),
				v.literal("in_progress"),
				v.literal("review"),
				v.literal("completed"),
			),
		),
		assignedTo: v.optional(v.id("users")),
		dueDate: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		const existing = await ctx.db.get(args.id);
		if (!existing) throw new Error("Document not found");

		const { id, ...updates } = args;

		await ctx.db.patch(args.id, {
			...updates,
			lastEditedBy: user._id,
			lastEditedAt: Date.now(),
			version: existing.version + 1,
		});

		// Create version history
		await ctx.db.insert("documentVersions", {
			documentId: args.id,
			version: existing.version,
			content: existing.content,
			editedBy: existing.lastEditedBy,
			editedAt: existing.lastEditedAt,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("documents") },
	handler: async (ctx, args) => {
		await getCurrentUserWithOrganization(ctx);

		const document = await ctx.db.get(args.id);
		if (!document) throw new Error("Document not found");

		// Recursively delete children
		const children = await ctx.db
			.query("documents")
			.withIndex("by_parent", (q) => q.eq("parentId", args.id))
			.collect();

		for (const child of children) {
			await ctx.db.delete(child._id);
		}

		// Delete versions
		const versions = await ctx.db
			.query("documentVersions")
			.withIndex("by_document", (q) => q.eq("documentId", args.id))
			.collect();

		for (const version of versions) {
			await ctx.db.delete(version._id);
		}

		// Delete the document
		await ctx.db.delete(args.id);
	},
});

export const duplicate = mutation({
	args: { id: v.id("documents") },
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		const original = await ctx.db.get(args.id);
		if (!original) throw new Error("Document not found");

		const newId = await ctx.db.insert("documents", {
			organizationId: organization._id,
			title: `${original.title} (Copy)`,
			content: original.content,
			projectId: original.projectId,
			parentId: original.parentId,
			authorId: user._id,
			assignedTo: original.assignedTo,
			dueDate: original.dueDate,
			tags: original.tags,
			status: "draft",
			version: 1,
			lastEditedBy: user._id,
			lastEditedAt: Date.now(),
		});

		return newId;
	},
});

export const getVersionHistory = query({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const versions = await ctx.db
			.query("documentVersions")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.order("desc")
			.collect();

		const versionsWithEditors = await Promise.all(
			versions.map(async (version) => {
				const editor = await ctx.db.get(version.editedBy);
				return { ...version, editor };
			}),
		);

		return versionsWithEditors;
	},
});

export const restoreVersion = mutation({
	args: {
		documentId: v.id("documents"),
		versionId: v.id("documentVersions"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const user = await ctx.db
			.query("users")
			.withIndex("by_token", (q) =>
				q.eq("tokenIdentifier", identity.tokenIdentifier),
			)
			.unique();

		if (!user) throw new Error("User not found");

		const [document, version] = await Promise.all([
			ctx.db.get(args.documentId),
			ctx.db.get(args.versionId),
		]);

		if (!document || !version) throw new Error("Document or version not found");

		// Save current as version
		await ctx.db.insert("documentVersions", {
			documentId: args.documentId,
			version: document.version,
			content: document.content,
			editedBy: document.lastEditedBy,
			editedAt: document.lastEditedAt,
		});

		// Restore the version
		await ctx.db.patch(args.documentId, {
			content: version.content,
			lastEditedBy: user._id,
			lastEditedAt: Date.now(),
			version: document.version + 1,
		});
	},
});
