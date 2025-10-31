import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

// Create an activity record
export const createActivity = mutation({
	args: {
		issueId: v.string(),
		userId: v.string(),
		type: v.union(
			v.literal("status_changed"),
			v.literal("assignee_changed"),
			v.literal("priority_changed"),
			v.literal("created"),
			v.literal("completed"),
			v.literal("due_date_changed"),
			v.literal("comment_added"),
			v.literal("subtask_added"),
			v.literal("subtask_removed"),
		),
		oldValue: v.optional(v.string()),
		newValue: v.optional(v.string()),
		metadata: v.optional(
			v.object({
				oldStatusId: v.optional(v.string()),
				newStatusId: v.optional(v.id("status")),
				oldAssigneeId: v.optional(v.string()),
				newAssigneeId: v.optional(v.string()),
				oldPriorityId: v.optional(v.id("priorities")),
				newPriorityId: v.optional(v.id("priorities")),
				commentId: v.optional(v.id("issueComments")),
				subtaskId: v.optional(v.id("issues")),
			}),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("issueActivities", {
			...args,
			createdAt: Date.now(),
		});
	},
});

// Get activities for an issue
export const getIssueActivities = query({
	args: {
		issueId: v.id("issues"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const query = ctx.db
			.query("issueActivities")
			.withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
			.order("desc");

		const activities = args.limit
			? await query.take(args.limit)
			: await query.collect();

		// Populate user information
		const activitiesWithUsers = await Promise.all(
			activities.map(async (activity) => {
				const user = await ctx.db.get(activity.userId);

				// Populate metadata references
				let populatedMetadata = {};
				if (activity.metadata) {
					if (activity.metadata.oldStatusId) {
						const oldStatus = await ctx.db.get(activity.metadata.oldStatusId);
						populatedMetadata = { ...populatedMetadata, oldStatus };
					}
					if (activity.metadata.newStatusId) {
						const newStatus = await ctx.db.get(activity.metadata.newStatusId);
						populatedMetadata = { ...populatedMetadata, newStatus };
					}
					if (activity.metadata.oldAssigneeId) {
						const oldAssignee = await ctx.db.get(
							activity.metadata.oldAssigneeId,
						);
						populatedMetadata = { ...populatedMetadata, oldAssignee };
					}
					if (activity.metadata.newAssigneeId) {
						const newAssignee = await ctx.db.get(
							activity.metadata.newAssigneeId,
						);
						populatedMetadata = { ...populatedMetadata, newAssignee };
					}
				}

				return {
					...activity,
					user,
					populatedMetadata,
				};
			}),
		);

		return activitiesWithUsers;
	},
});

// Get all construction activities
export const getConstructionActivities = query({
	args: {
		limit: v.optional(v.number()),
		projectId: v.optional(v.id("constructionProjects")),
	},
	handler: async (ctx, args) => {
		// First get all construction tasks
		let constructionTaskIds: Id<"issues">[] = [];

		if (args.projectId) {
			// Get tasks for specific project
			const tasks = await ctx.db
				.query("issues")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.filter((q) => q.eq(q.field("isConstructionTask"), true))
				.collect();
			constructionTaskIds = tasks.map((t) => t._id);
		} else {
			// Get all construction tasks
			const tasks = await ctx.db
				.query("issues")
				.withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
				.collect();
			constructionTaskIds = tasks.map((t) => t._id);
		}

		// Get activities for these tasks
		if (constructionTaskIds.length === 0) {
			return [];
		}

		// Get all activities and filter in memory (Convex doesn't support OR queries well)
		const allActivities = await ctx.db
			.query("issueActivities")
			.order("desc")
			.collect();

		const activities = allActivities
			.filter((activity) => constructionTaskIds.includes(activity.issueId))
			.slice(0, args.limit || 100);

		// Populate activity data
		const populatedActivities = await Promise.all(
			activities.map(async (activity) => {
				const [user, task] = await Promise.all([
					ctx.db.get(activity.userId),
					ctx.db.get(activity.issueId),
				]);

				// Get project info if task exists
				let project = null;
				if (task?.projectId) {
					project = await ctx.db.get(task.projectId);
				}

				// Populate metadata references
				const populatedMetadata: any = {};
				if (activity.metadata) {
					const promises = [];

					if (activity.metadata.oldStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldStatusId)
								.then((s) => (populatedMetadata.oldStatus = s)),
						);
					}
					if (activity.metadata.newStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newStatusId)
								.then((s) => (populatedMetadata.newStatus = s)),
						);
					}
					if (activity.metadata.oldAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldAssigneeId)
								.then((u) => (populatedMetadata.oldAssignee = u)),
						);
					}
					if (activity.metadata.newAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newAssigneeId)
								.then((u) => (populatedMetadata.newAssignee = u)),
						);
					}
					if (activity.metadata.oldPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldPriorityId)
								.then((p) => (populatedMetadata.oldPriority = p)),
						);
					}
					if (activity.metadata.newPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newPriorityId)
								.then((p) => (populatedMetadata.newPriority = p)),
						);
					}
					if (activity.metadata.commentId) {
						promises.push(
							ctx.db
								.get(activity.metadata.commentId)
								.then((c) => (populatedMetadata.comment = c)),
						);
					}
					if (activity.metadata.subtaskId) {
						promises.push(
							ctx.db
								.get(activity.metadata.subtaskId)
								.then((s) => (populatedMetadata.subtask = s)),
						);
					}

					await Promise.all(promises);
				}

				return {
					...activity,
					user,
					task,
					project,
					populatedMetadata,
				};
			}),
		);

		return populatedActivities;
	},
});

// Get project timeline data with actual completion dates
export const getProjectTimelineWithActivities = query({
	args: {
		projectId: v.id("constructionProjects"),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get all tasks for the project
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		// Get all status change activities for these tasks
		const taskIds = tasks.map((t) => t._id);
		const activities = await ctx.db
			.query("issueActivities")
			.withIndex("by_type", (q) => q.eq("type", "status_changed"))
			.collect();

		// Filter activities for our tasks
		const relevantActivities = activities.filter((a) =>
			taskIds.includes(a.issueId),
		);

		// Get completion activities (when task was marked as done)
		const completionActivities = await Promise.all(
			relevantActivities.map(async (activity) => {
				if (activity.metadata?.newStatusId) {
					const newStatus = await ctx.db.get(activity.metadata.newStatusId);
					if (
						newStatus &&
						(newStatus.name === "завершено" ||
							newStatus.name === "Done" ||
							newStatus.name === "Completed")
					) {
						return {
							taskId: activity.issueId,
							completedAt: activity.createdAt,
							userId: activity.userId,
						};
					}
				}
				return null;
			}),
		);

		const validCompletions = completionActivities.filter(Boolean);

		// Get tasks with due dates
		const tasksWithDueDates = await Promise.all(
			tasks
				.filter((t) => t.dueDate)
				.map(async (task) => {
					const status = await ctx.db.get(task.statusId);
					return {
						...task,
						status,
						completionDate: validCompletions.find((c) => c?.taskId === task._id)
							?.completedAt,
					};
				}),
		);

		return {
			tasks: tasksWithDueDates,
			completionActivities: validCompletions,
		};
	},
});

// Get status change history for timeline
export const getStatusChangeHistory = query({
	args: {
		projectId: v.id("constructionProjects"),
		startDate: v.string(),
		endDate: v.string(),
	},
	handler: async (ctx, args) => {
		// Get all tasks for the project
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const taskIds = tasks.map((t) => t._id);

		// Get all status change activities within date range
		const startTime = new Date(args.startDate).getTime();
		const endTime = new Date(args.endDate).getTime();

		const activities = await ctx.db
			.query("issueActivities")
			.withIndex("by_type", (q) => q.eq("type", "status_changed"))
			.collect();

		const relevantActivities = activities.filter(
			(a) =>
				taskIds.includes(a.issueId) &&
				a.createdAt >= startTime &&
				a.createdAt <= endTime,
		);

		// Group by date
		const activityByDate: Record<string, any[]> = {};

		for (const activity of relevantActivities) {
			const date = new Date(activity.createdAt).toISOString().split("T")[0];
			if (!activityByDate[date]) {
				activityByDate[date] = [];
			}
			activityByDate[date].push(activity);
		}

		return activityByDate;
	},
});

// Get all activities for the organization
export const getOrganizationActivities = query({
	args: {
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;
		const offset = args.cursor || 0;

		// Get all activities
		const activities = await ctx.db
			.query("issueActivities")
			.order("desc")
			.collect();

		// Paginate
		const paginatedActivities = activities.slice(offset, offset + limit);

		// Populate activity data
		const populatedActivities = await Promise.all(
			paginatedActivities.map(async (activity) => {
				const [user, task] = await Promise.all([
					ctx.db.get(activity.userId),
					ctx.db.get(activity.issueId),
				]);

				// Get project info if task exists
				let project = null;
				if (task?.projectId) {
					project = await ctx.db.get(task.projectId);
				}

				// Populate metadata references
				const populatedMetadata: any = {};
				if (activity.metadata) {
					const promises = [];

					if (activity.metadata.oldStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldStatusId)
								.then((s) => (populatedMetadata.oldStatus = s)),
						);
					}
					if (activity.metadata.newStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newStatusId)
								.then((s) => (populatedMetadata.newStatus = s)),
						);
					}
					if (activity.metadata.oldAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldAssigneeId)
								.then((u) => (populatedMetadata.oldAssignee = u)),
						);
					}
					if (activity.metadata.newAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newAssigneeId)
								.then((u) => (populatedMetadata.newAssignee = u)),
						);
					}
					if (activity.metadata.oldPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldPriorityId)
								.then((p) => (populatedMetadata.oldPriority = p)),
						);
					}
					if (activity.metadata.newPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newPriorityId)
								.then((p) => (populatedMetadata.newPriority = p)),
						);
					}
					if (activity.metadata.commentId) {
						promises.push(
							ctx.db
								.get(activity.metadata.commentId)
								.then((c) => (populatedMetadata.comment = c)),
						);
					}
					if (activity.metadata.subtaskId) {
						promises.push(
							ctx.db
								.get(activity.metadata.subtaskId)
								.then((s) => (populatedMetadata.subtask = s)),
						);
					}

					await Promise.all(promises);
				}

				return {
					...activity,
					user,
					task,
					project,
					populatedMetadata,
				};
			}),
		);

		return {
			items: populatedActivities,
			nextCursor: offset + limit < activities.length ? offset + limit : null,
			hasMore: offset + limit < activities.length,
		};
	},
});

// Get activities for a specific user
export const getUserActivities = query({
	args: {
		userId: v.string(),
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;
		const offset = args.cursor || 0;

		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");

		// Get all activities for this user
		const activities = await ctx.db
			.query("issueActivities")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();

		// Paginate
		const paginatedActivities = activities.slice(offset, offset + limit);

		// Populate activity data
		const populatedActivities = await Promise.all(
			paginatedActivities.map(async (activity) => {
				const [task] = await Promise.all([ctx.db.get(activity.issueId)]);

				// Get project info if task exists
				let project = null;
				if (task?.projectId) {
					project = await ctx.db.get(task.projectId);
				}

				// Populate metadata references
				const populatedMetadata: any = {};
				if (activity.metadata) {
					const promises = [];

					if (activity.metadata.oldStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldStatusId)
								.then((s) => (populatedMetadata.oldStatus = s)),
						);
					}
					if (activity.metadata.newStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newStatusId)
								.then((s) => (populatedMetadata.newStatus = s)),
						);
					}
					if (activity.metadata.oldAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldAssigneeId)
								.then((u) => (populatedMetadata.oldAssignee = u)),
						);
					}
					if (activity.metadata.newAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newAssigneeId)
								.then((u) => (populatedMetadata.newAssignee = u)),
						);
					}
					if (activity.metadata.oldPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldPriorityId)
								.then((p) => (populatedMetadata.oldPriority = p)),
						);
					}
					if (activity.metadata.newPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newPriorityId)
								.then((p) => (populatedMetadata.newPriority = p)),
						);
					}
					if (activity.metadata.commentId) {
						promises.push(
							ctx.db
								.get(activity.metadata.commentId)
								.then((c) => (populatedMetadata.comment = c)),
						);
					}
					if (activity.metadata.subtaskId) {
						promises.push(
							ctx.db
								.get(activity.metadata.subtaskId)
								.then((s) => (populatedMetadata.subtask = s)),
						);
					}

					await Promise.all(promises);
				}

				return {
					...activity,
					user,
					task,
					project,
					populatedMetadata,
				};
			}),
		);

		return {
			items: populatedActivities,
			nextCursor: offset + limit < activities.length ? offset + limit : null,
			hasMore: offset + limit < activities.length,
		};
	},
});

// Get activities for a team (department)
export const getTeamActivities = query({
	args: {
		departmentId: v.id("departments"),
		limit: v.optional(v.number()),
		cursor: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const limit = args.limit || 50;
		const offset = args.cursor || 0;

		// Get all users in this department
		const userAssignments = await ctx.db
			.query("userDepartments")
			.withIndex("by_department", (q) =>
				q.eq("departmentId", args.departmentId),
			)
			.collect();

		const userIds = userAssignments.map((a) => a.userId);

		if (userIds.length === 0) {
			return {
				items: [],
				nextCursor: null,
				hasMore: false,
			};
		}

		// Get all activities and filter by users in team
		const allActivities = await ctx.db
			.query("issueActivities")
			.order("desc")
			.collect();

		const teamActivities = allActivities.filter((activity) =>
			userIds.includes(activity.userId),
		);

		// Paginate
		const paginatedActivities = teamActivities.slice(offset, offset + limit);

		// Populate activity data
		const populatedActivities = await Promise.all(
			paginatedActivities.map(async (activity) => {
				const [user, task] = await Promise.all([
					ctx.db.get(activity.userId),
					ctx.db.get(activity.issueId),
				]);

				// Get project info if task exists
				let project = null;
				if (task?.projectId) {
					project = await ctx.db.get(task.projectId);
				}

				// Populate metadata references
				const populatedMetadata: any = {};
				if (activity.metadata) {
					const promises = [];

					if (activity.metadata.oldStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldStatusId)
								.then((s) => (populatedMetadata.oldStatus = s)),
						);
					}
					if (activity.metadata.newStatusId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newStatusId)
								.then((s) => (populatedMetadata.newStatus = s)),
						);
					}
					if (activity.metadata.oldAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldAssigneeId)
								.then((u) => (populatedMetadata.oldAssignee = u)),
						);
					}
					if (activity.metadata.newAssigneeId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newAssigneeId)
								.then((u) => (populatedMetadata.newAssignee = u)),
						);
					}
					if (activity.metadata.oldPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.oldPriorityId)
								.then((p) => (populatedMetadata.oldPriority = p)),
						);
					}
					if (activity.metadata.newPriorityId) {
						promises.push(
							ctx.db
								.get(activity.metadata.newPriorityId)
								.then((p) => (populatedMetadata.newPriority = p)),
						);
					}
					if (activity.metadata.commentId) {
						promises.push(
							ctx.db
								.get(activity.metadata.commentId)
								.then((c) => (populatedMetadata.comment = c)),
						);
					}
					if (activity.metadata.subtaskId) {
						promises.push(
							ctx.db
								.get(activity.metadata.subtaskId)
								.then((s) => (populatedMetadata.subtask = s)),
						);
					}

					await Promise.all(promises);
				}

				return {
					...activity,
					user,
					task,
					project,
					populatedMetadata,
				};
			}),
		);

		return {
			items: populatedActivities,
			nextCursor:
				offset + limit < teamActivities.length ? offset + limit : null,
			hasMore: offset + limit < teamActivities.length,
		};
	},
});
