import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

export const linkToTask = mutation({
	args: {
		documentId: v.id("documents"),
		taskId: v.id("issues"),
		relationshipType: v.union(
			v.literal("attachment"),
			v.literal("reference"),
			v.literal("deliverable"),
			v.literal("requirement"),
		),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID or skip user tracking
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

		// Check if link already exists
		const existing = await ctx.db
			.query("documentTasks")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.filter((q) => q.eq(q.field("taskId"), args.taskId))
			.first();

		if (existing) {
			// Update existing relationship
			await ctx.db.patch(existing._id, {
				relationshipType: args.relationshipType,
				description: args.description,
			});
			return existing._id;
		}

		// Create new relationship
		const linkId = await ctx.db.insert("documentTasks", {
			documentId: args.documentId,
			taskId: args.taskId,
			relationshipType: args.relationshipType,
			description: args.description,
			createdBy: user._id,
			createdAt: Date.now(),
		});

		// Log activity
		await ctx.db.insert("documentActivity", {
			documentId: args.documentId,
			userId: user._id,
			action: "assigned",
			details: `Linked to task`,
			timestamp: Date.now(),
		});

		return linkId;
	},
});

export const unlinkFromTask = mutation({
	args: {
		documentId: v.id("documents"),
		taskId: v.id("issues"),
	},
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		// For now, use a default user ID or skip user tracking
		const users = await ctx.db.query("users").take(1);
		const user = users[0];
		if (!user) throw new Error("No users found in database");

		const link = await ctx.db
			.query("documentTasks")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.filter((q) => q.eq(q.field("taskId"), args.taskId))
			.first();

		if (!link) throw new Error("Link not found");

		await ctx.db.delete(link._id);

		// Log activity
		await ctx.db.insert("documentActivity", {
			documentId: args.documentId,
			userId: user._id,
			action: "assigned",
			details: `Unlinked from task`,
			timestamp: Date.now(),
		});
	},
});

export const getDocumentTasks = query({
	args: { documentId: v.id("documents") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("documentTasks")
			.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
			.collect();

		const linksWithDetails = await Promise.all(
			links.map(async (link) => {
				const [task, createdBy] = await Promise.all([
					ctx.db.get(link.taskId),
					ctx.db.get(link.createdBy),
				]);

				if (!task) return null;

				// Get task details
				const [assignee, status, priority, labels] = await Promise.all([
					task.assigneeId ? ctx.db.get(task.assigneeId) : null,
					ctx.db.get(task.statusId),
					ctx.db.get(task.priorityId),
					Promise.all(task.labelIds.map((id) => ctx.db.get(id))),
				]);

				return {
					...link,
					task: {
						...task,
						assignee,
						status,
						priority,
						labels: labels.filter(Boolean),
					},
					createdBy,
				};
			}),
		);

		return linksWithDetails.filter(Boolean);
	},
});

export const getTaskDocuments = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const links = await ctx.db
			.query("documentTasks")
			.withIndex("by_task", (q) => q.eq("taskId", args.taskId))
			.collect();

		const linksWithDetails = await Promise.all(
			links.map(async (link) => {
				const [document, createdBy] = await Promise.all([
					ctx.db.get(link.documentId),
					ctx.db.get(link.createdBy),
				]);

				if (!document) return null;

				const author = await ctx.db.get(document.authorId);

				return {
					...link,
					document: {
						...document,
						author,
					},
					createdBy,
				};
			}),
		);

		return linksWithDetails.filter(Boolean);
	},
});

export const searchTasksToLink = query({
	args: {
		search: v.string(),
		excludeDocumentId: v.optional(v.id("documents")),
	},
	handler: async (ctx, args) => {
		let tasks = await ctx.db.query("issues").collect();

		// Filter by search
		const searchLower = args.search.toLowerCase();
		tasks = tasks.filter(
			(task) =>
				task.identifier.toLowerCase().includes(searchLower) ||
				task.title.toLowerCase().includes(searchLower),
		);

		// Exclude already linked tasks
		if (args.excludeDocumentId) {
			const linkedTasks = await ctx.db
				.query("documentTasks")
				.withIndex("by_document", (q) =>
					q.eq("documentId", args.excludeDocumentId!),
				)
				.collect();

			const linkedTaskIds = new Set(linkedTasks.map((l) => l.taskId));
			tasks = tasks.filter((task) => !linkedTaskIds.has(task._id));
		}

		// Get task details
		const tasksWithDetails = await Promise.all(
			tasks.slice(0, 10).map(async (task) => {
				const [assignee, status, priority] = await Promise.all([
					task.assigneeId ? ctx.db.get(task.assigneeId) : null,
					ctx.db.get(task.statusId),
					ctx.db.get(task.priorityId),
				]);

				return {
					...task,
					assignee,
					status,
					priority,
				};
			}),
		);

		return tasksWithDetails;
	},
});

export const updateRelationship = mutation({
	args: {
		linkId: v.id("documentTasks"),
		relationshipType: v.union(
			v.literal("attachment"),
			v.literal("reference"),
			v.literal("deliverable"),
			v.literal("requirement"),
		),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Made public for now - remove auth check
		// const identity = await ctx.auth.getUserIdentity();
		// if (!identity) throw new Error("Not authenticated");

		await ctx.db.patch(args.linkId, {
			relationshipType: args.relationshipType,
			description: args.description,
		});
	},
});
