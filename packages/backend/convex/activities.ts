import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Create an activity record
export const createActivity = mutation({
	args: {
		issueId: v.id("issues"),
		userId: v.id("users"),
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
				oldStatusId: v.optional(v.id("status")),
				newStatusId: v.optional(v.id("status")),
				oldAssigneeId: v.optional(v.id("users")),
				newAssigneeId: v.optional(v.id("users")),
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
