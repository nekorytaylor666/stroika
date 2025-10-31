import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { auth, authComponent, createAuth } from "./auth";
import {
	getCurrentUser,
	getCurrentUserWithOrganization,
} from "./helpers/getCurrentUser";

// Queries
export const getAll = query({
	handler: async (ctx) => {
		try {
			const { user, organization } = await getCurrentUserWithOrganization(ctx);

			const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

			// Get all construction tasks
			let tasks = await ctx.db
				.query("issues")
				.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
				.collect();

			// Filter by organization if we have one
			if (organization.id) {
				tasks = tasks.filter((task) => task.organizationId === organization.id);
			}
			const { users } = await auth.api.listUsers({
				query: { limit: 100, offset: 0 },
				headers,
			});

			// Populate related data
			const populatedTasks = await Promise.all(
				tasks.map(async (task) => {
					const [status, assignee, priority, labels, attachments, subtasks] =
						await Promise.all([
							ctx.db.get(task.statusId as Id<"status">),
							task.assigneeId
								? users.find((user) => user.id === task.assigneeId)
								: null,
							ctx.db.get(task.priorityId as Id<"priorities">),
							Promise.all(
								task.labelIds.map((id) => ctx.db.get(id as Id<"labels">)),
							),
							ctx.db
								.query("issueAttachments")
								.withIndex("by_issue", (q) => q.eq("issueId", task._id))
								.collect(),
							ctx.db
								.query("issues")
								.withIndex("by_parent_task", (q) =>
									q.eq("parentTaskId", task._id),
								)
								.collect(),
						]);

					// Get uploader info for attachments and resolve URLs
					const attachmentsWithUsers = await Promise.all(
						attachments.map(async (attachment) => {
							const [uploader, fileUrl] = await Promise.all([
								users.find((user) => user.id === attachment.uploadedBy),
								ctx.storage.getUrl(attachment.fileUrl),
							]);
							return {
								...attachment,
								fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
								uploader,
							};
						}),
					);

					return {
						...task,
						status,
						assignee,
						priority,
						labels: labels.filter((label) => label !== null),
						attachments: attachmentsWithUsers,
						subtaskCount: subtasks.length,
					};
				}),
			);

			return populatedTasks;
		} catch (error) {
			console.error("Error in getAll:", error);
			return [];
		}
	},
});

export const getByIdentifier = query({
	args: { identifier: v.string() },
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		const task = await ctx.db
			.query("issues")
			.withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), organization.id),
					q.eq(q.field("isConstructionTask"), true),
				),
			)
			.first();

		if (!task) return null;

		// Populate related data using same logic as getById
		const [status, assignee, priority, labels, attachments] = await Promise.all(
			[
				ctx.db.get(task.statusId),
				task.assigneeId ? ctx.db.get(task.assigneeId) : null,
				ctx.db.get(task.priorityId),
				Promise.all(task.labelIds.map((id) => ctx.db.get(id))),
				ctx.db
					.query("issueAttachments")
					.withIndex("by_issue", (q) => q.eq("issueId", task._id))
					.collect(),
			],
		);

		// Get uploader info for attachments and resolve URLs
		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					ctx.db.get(attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl,
					uploader,
				};
			}),
		);

		return {
			...task,
			status,
			assignee,
			priority,
			labels: labels.filter((label) => label !== null),
			attachments: attachmentsWithUsers,
		};
	},
});

export const getById = query({
	args: { id: v.id("issues") },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const task = await ctx.db.get(args.id);
		if (!task || !task.isConstructionTask) return null;

		const { users } = await auth.api.listUsers({
			query: { limit: 100, offset: 0 },
			headers,
		});
		const [status, assignee, priority, labels, attachments] = await Promise.all(
			[
				ctx.db.get(task.statusId),
				task.assigneeId
					? users.find((user) => user.id === task.assigneeId)
					: null,
				ctx.db.get(task.priorityId),
				Promise.all(task.labelIds.map((id) => ctx.db.get(id))),
				ctx.db
					.query("issueAttachments")
					.withIndex("by_issue", (q) => q.eq("issueId", task._id))
					.collect(),
			],
		);

		// Get uploader info for attachments and resolve URLs
		const attachmentsWithUsers = await Promise.all(
			attachments.map(async (attachment) => {
				const [uploader, fileUrl] = await Promise.all([
					users.find((user) => user.id === attachment.uploadedBy),
					ctx.storage.getUrl(attachment.fileUrl as any),
				]);
				return {
					...attachment,
					fileUrl: fileUrl || attachment.fileUrl, // Use the resolved URL
					uploader,
				};
			}),
		);

		return {
			...task,
			status,
			assignee,
			priority,
			labels: labels.filter((label) => label !== null),
			attachments: attachmentsWithUsers,
		};
	},
});

export const getTaskRelatedDocuments = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || !task.isConstructionTask) return null;

		// Get both linked documents and attachments
		const [linkedDocuments, attachments] = await Promise.all([
			// Get linked documents through documentTasks relationship
			ctx.db
				.query("documentTasks")
				.withIndex("by_task", (q) => q.eq("taskId", args.taskId))
				.collect()
				.then(async (links) => {
					const docsWithDetails = await Promise.all(
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
					return docsWithDetails.filter(Boolean);
				}),
			// Get direct attachments
			ctx.db
				.query("issueAttachments")
				.withIndex("by_issue", (q) => q.eq("issueId", args.taskId))
				.collect()
				.then(async (attachments) => {
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
				}),
		]);

		return {
			linkedDocuments,
			attachments,
		};
	},
});

export const getByStatus = query({
	args: { statusId: v.id("status") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("issues")
			.withIndex("by_status", (q) => q.eq("statusId", args.statusId))
			.filter((q) => q.eq(q.field("isConstructionTask"), true))
			.collect();
	},
});

export const getByAssignee = query({
	args: { assigneeId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("issues")
			.withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
			.filter((q) => q.eq(q.field("isConstructionTask"), true))
			.collect();
	},
});

export const getByProject = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.filter((q) => q.eq(q.field("isConstructionTask"), true))
			.collect();

		// Add subtask count to each task
		const tasksWithSubtaskCount = await Promise.all(
			tasks.map(async (task) => {
				const subtasks = await ctx.db
					.query("issues")
					.withIndex("by_parent_task", (q) => q.eq("parentTaskId", task._id))
					.collect();

				return {
					...task,
					subtaskCount: subtasks.length,
				};
			}),
		);

		return tasksWithSubtaskCount;
	},
});

export const searchTasks = query({
	args: { searchTerm: v.string() },
	handler: async (ctx, args) => {
		const allTasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.collect();

		const searchTerm = args.searchTerm.toLowerCase();
		return allTasks.filter(
			(task) =>
				task.title.toLowerCase().includes(searchTerm) ||
				task.description.toLowerCase().includes(searchTerm) ||
				task.identifier.toLowerCase().includes(searchTerm),
		);
	},
});

export const getTasksByStatus = query({
	handler: async (ctx) => {
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.collect();

		const statuses = await ctx.db.query("status").collect();

		const groupedTasks = statuses.map((status) => ({
			status,
			tasks: tasks.filter((task) => task.statusId === status._id),
		}));

		return groupedTasks;
	},
});

export const getTaskStats = query({
	handler: async (ctx) => {
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
			.collect();

		const stats = {
			total: tasks.length,
			byStatus: {} as Record<string, number>,
			byPriority: {} as Record<string, number>,
			completed: 0,
			overdue: 0,
		};

		const currentDate = new Date().toISOString().split("T")[0];

		for (const task of tasks) {
			// Count by status
			const status = await ctx.db.get(task.statusId);
			if (status) {
				stats.byStatus[status.name] = (stats.byStatus[status.name] || 0) + 1;
				if (status.name === "Done") stats.completed++;
			}

			// Count by priority
			const priority = await ctx.db.get(task.priorityId);
			if (priority) {
				stats.byPriority[priority.name] =
					(stats.byPriority[priority.name] || 0) + 1;
			}

			// Count overdue
			if (task.dueDate && task.dueDate < currentDate) {
				stats.overdue++;
			}
		}

		return stats;
	},
});

// Mutations
export const create = mutation({
	args: {
		identifier: v.string(),
		title: v.string(),
		description: v.string(),
		statusId: v.string(),
		assigneeId: v.optional(v.string()),
		priorityId: v.string(),
		labelIds: v.array(v.string()),
		cycleId: v.string(),
		projectId: v.optional(v.string()), // Link to construction project
		rank: v.string(),
		dueDate: v.optional(v.string()),
		parentTaskId: v.optional(v.string()), // For creating subtasks
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization)
			throw new Error("User or organization not found");

		const taskId = await ctx.db.insert("issues", {
			...args,
			organizationId: organization.id,
			createdAt: new Date().toISOString(),
			isConstructionTask: true,
		});

		// Track activity
		await ctx.runMutation(api.activities.createActivity, {
			issueId: taskId,
			userId: user._id,
			type: "created",
			newValue: args.title,
		});

		// Send notification if task is assigned
		if (args.assigneeId && args.assigneeId !== user._id) {
			await ctx.runMutation(api.issueNotifications.notifyTaskAssigned, {
				issueId: taskId,
				assigneeId: args.assigneeId,
				assignedBy: user._id,
			});
		}

		return taskId;
	},
});

export const update = mutation({
	args: {
		id: v.id("issues"),
		identifier: v.optional(v.string()),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		statusId: v.optional(v.id("status")),
		assigneeId: v.optional(v.string()),
		priorityId: v.optional(v.id("priorities")),
		labelIds: v.optional(v.array(v.id("labels"))),
		cycleId: v.optional(v.string()),
		projectId: v.optional(v.id("constructionProjects")), // Link to construction project
		rank: v.optional(v.string()),
		dueDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");

		// Get the current task to track changes
		const currentTask = await ctx.db.get(id);
		if (!currentTask) throw new Error("Task not found");

		// Track specific changes
		if (updates.statusId && updates.statusId !== currentTask.statusId) {
			const [oldStatus, newStatus] = await Promise.all([
				ctx.db.get(currentTask.statusId),
				ctx.db.get(updates.statusId),
			]);

			await ctx.runMutation(api.activities.createActivity, {
				issueId: id,
				userId: user._id,
				type: "status_changed",
				oldValue: oldStatus?.name,
				newValue: newStatus?.name,
				metadata: {
					oldStatusId: currentTask.statusId,
					newStatusId: updates.statusId,
				},
			});

			// Send notification for status change
			await ctx.runMutation(api.issueNotifications.notifyTaskStatusChanged, {
				issueId: id,
				oldStatusId: currentTask.statusId,
				newStatusId: updates.statusId,
				changedBy: user._id,
			});

			// Check if task was completed
			if (
				newStatus?.name === "завершено" ||
				newStatus?.name === "Done" ||
				newStatus?.name === "Completed"
			) {
				await ctx.runMutation(api.activities.createActivity, {
					issueId: id,
					userId: user._id,
					type: "completed",
					newValue: new Date().toISOString(),
				});
			}
		}

		if (
			updates.assigneeId !== undefined &&
			updates.assigneeId !== currentTask.assigneeId
		) {
			await ctx.runMutation(api.activities.createActivity, {
				issueId: id,
				userId: user._id,
				type: "assignee_changed",
				metadata: {
					oldAssigneeId: currentTask.assigneeId,
					newAssigneeId: updates.assigneeId,
				},
			});

			// Send notification for assignee change
			if (updates.assigneeId) {
				await ctx.runMutation(api.issueNotifications.notifyTaskAssigned, {
					issueId: id,
					assigneeId: updates.assigneeId,
					assignedBy: user._id,
				});
			}
		}

		if (updates.priorityId && updates.priorityId !== currentTask.priorityId) {
			await ctx.runMutation(api.activities.createActivity, {
				issueId: id,
				userId: user._id,
				type: "priority_changed",
				metadata: {
					oldPriorityId: currentTask.priorityId,
					newPriorityId: updates.priorityId,
				},
			});

			// Send notification for priority change
			await ctx.runMutation(api.issueNotifications.notifyTaskPriorityChanged, {
				issueId: id,
				oldPriorityId: currentTask.priorityId,
				newPriorityId: updates.priorityId,
				changedBy: user._id,
			});
		}

		if (
			updates.dueDate !== undefined &&
			updates.dueDate !== currentTask.dueDate
		) {
			await ctx.runMutation(api.activities.createActivity, {
				issueId: id,
				userId: user._id,
				type: "due_date_changed",
				oldValue: currentTask.dueDate || undefined,
				newValue: updates.dueDate || undefined,
			});
		}

		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("issues"),
		statusId: v.id("status"),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		console.log("update status", args);
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User or organization not found");
		// Get current task to track changes
		const currentTask = await ctx.db.get(args.id);
		if (!currentTask) throw new Error("Task not found");

		if (args.statusId !== currentTask.statusId) {
			const [oldStatus, newStatus] = await Promise.all([
				ctx.db.get(currentTask.statusId),
				ctx.db.get(args.statusId),
			]);

			await ctx.runMutation(api.activities.createActivity, {
				issueId: args.id,
				userId: user._id,
				type: "status_changed",
				oldValue: oldStatus?.name,
				newValue: newStatus?.name,
				metadata: {
					oldStatusId: currentTask.statusId,
					newStatusId: args.statusId,
				},
			});

			// Send notification for status change
			await ctx.runMutation(api.issueNotifications.notifyTaskStatusChanged, {
				issueId: args.id,
				oldStatusId: currentTask.statusId,
				newStatusId: args.statusId,
				changedBy: user._id,
			});

			// Check if task was completed
			if (
				newStatus?.name === "завершено" ||
				newStatus?.name === "Done" ||
				newStatus?.name === "Completed"
			) {
				await ctx.runMutation(api.activities.createActivity, {
					issueId: args.id,
					userId: user._id,
					type: "completed",
					newValue: new Date().toISOString(),
				});
			}
		}

		await ctx.db.patch(args.id, { statusId: args.statusId });
		return { success: true };
	},
});

export const updateAssignee = mutation({
	args: {
		id: v.id("issues"),
		assigneeId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get current task to check for changes
		const user = await getCurrentUser(ctx);
		if (!user) throw new Error("User not found");
		const currentTask = await ctx.db.get(args.id);
		if (!currentTask) throw new Error("Task not found");

		// Track activity
		if (args.assigneeId !== currentTask.assigneeId) {
			await ctx.runMutation(api.activities.createActivity, {
				issueId: args.id,
				userId: user._id,
				type: "assignee_changed",
				metadata: {
					oldAssigneeId: currentTask.assigneeId,
					newAssigneeId: args.assigneeId,
				},
			});

			// Send notification for assignee change
			if (args.assigneeId) {
				await ctx.runMutation(api.issueNotifications.notifyTaskAssigned, {
					issueId: args.id,
					assigneeId: args.assigneeId,
					assignedBy: user?._id,
				});
			}
		}

		await ctx.db.patch(args.id, { assigneeId: args.assigneeId });
		return { success: true };
	},
});

export const updatePriority = mutation({
	args: {
		id: v.id("issues"),
		priorityId: v.id("priorities"),
		userId: v.string(), // User making the change
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");
		// Get current task to check for changes
		const currentTask = await ctx.db.get(args.id);
		if (!currentTask) throw new Error("Task not found");

		// Track activity and send notification
		if (args.priorityId !== currentTask.priorityId) {
			await ctx.runMutation(api.activities.createActivity, {
				issueId: args.id,
				userId: user._id,
				type: "priority_changed",
				metadata: {
					oldPriorityId: currentTask.priorityId,
					newPriorityId: args.priorityId,
				},
			});

			// Send notification for priority change
			await ctx.runMutation(api.issueNotifications.notifyTaskPriorityChanged, {
				issueId: args.id,
				oldPriorityId: currentTask.priorityId,
				newPriorityId: args.priorityId,
				changedBy: user._id,
			});
		}

		await ctx.db.patch(args.id, { priorityId: args.priorityId });
		return { success: true };
	},
});

export const addLabel = mutation({
	args: {
		taskId: v.id("issues"),
		labelId: v.id("labels"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || !task.isConstructionTask) throw new Error("Task not found");

		if (!task.labelIds.includes(args.labelId)) {
			const updatedLabelIds = [...task.labelIds, args.labelId];
			await ctx.db.patch(args.taskId, { labelIds: updatedLabelIds });
		}

		return { success: true };
	},
});

export const removeLabel = mutation({
	args: {
		taskId: v.id("issues"),
		labelId: v.id("labels"),
	},
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.taskId);
		if (!task || !task.isConstructionTask) throw new Error("Task not found");

		const updatedLabelIds = task.labelIds.filter((id) => id !== args.labelId);
		await ctx.db.patch(args.taskId, { labelIds: updatedLabelIds });

		return { success: true };
	},
});

export const moveTask = mutation({
	args: {
		id: v.id("issues"),
		newStatusId: v.id("status"),
		newRank: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			statusId: args.newStatusId,
			rank: args.newRank,
		});
		return { success: true };
	},
});

export const deleteTask = mutation({
	args: { id: v.id("issues") },
	handler: async (ctx, args) => {
		const task = await ctx.db.get(args.id);
		if (!task || !task.isConstructionTask) throw new Error("Task not found");

		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// Get tasks for a specific team
export const getTeamTasks = query({
	args: { teamId: v.id("constructionTeams") },
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		const memberIds = team.memberIds || [];
		if (memberIds.length === 0) {
			return [];
		}

		// Get all tasks assigned to team members
		const tasks = await ctx.db
			.query("issues")
			.filter((q) =>
				q.and(
					q.eq(q.field("isConstructionTask"), true),
					q.eq(q.field("organizationId"), team.organizationId),
					q.or(...memberIds.map((id) => q.eq(q.field("assigneeId"), id))),
				),
			)
			.collect();

		// Populate related data
		const populatedTasks = await Promise.all(
			tasks.map(async (task) => {
				const [status, assignee, priority, project] = await Promise.all([
					ctx.db.get(task.statusId),
					task.assigneeId ? ctx.db.get(task.assigneeId) : null,
					ctx.db.get(task.priorityId),
					task.projectId ? ctx.db.get(task.projectId) : null,
				]);

				return {
					...task,
					status,
					assignee,
					priority,
					project,
				};
			}),
		);

		return populatedTasks;
	},
});
