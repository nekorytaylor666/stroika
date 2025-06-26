import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Queries
export const getAll = query({
	handler: async (ctx) => {
		const projects = await ctx.db.query("constructionProjects").collect();

		// Populate related data
		const populatedProjects = await Promise.all(
			projects.map(async (project) => {
				const [status, lead, priority, monthlyRevenue] = await Promise.all([
					ctx.db.get(project.statusId),
					ctx.db.get(project.leadId),
					ctx.db.get(project.priorityId),
					ctx.db
						.query("monthlyRevenue")
						.withIndex("by_project", (q) =>
							q.eq("constructionProjectId", project._id),
						)
						.collect(),
				]);

				return {
					...project,
					status,
					lead,
					priority,
					monthlyRevenue,
				};
			}),
		);

		return populatedProjects;
	},
});

export const getById = query({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.id);
		if (!project) return null;

		const [status, lead, priority, monthlyRevenue] = await Promise.all([
			ctx.db.get(project.statusId),
			ctx.db.get(project.leadId),
			ctx.db.get(project.priorityId),
			ctx.db
				.query("monthlyRevenue")
				.withIndex("by_project", (q) =>
					q.eq("constructionProjectId", project._id),
				)
				.collect(),
		]);

		return {
			...project,
			status,
			lead,
			priority,
			monthlyRevenue,
		};
	},
});

export const getProjectWithTasks = query({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.id);
		if (!project) return null;

		// Get all related data
		const [status, lead, priority, monthlyRevenue, tasks, teamMembers] =
			await Promise.all([
				ctx.db.get(project.statusId),
				ctx.db.get(project.leadId),
				ctx.db.get(project.priorityId),
				ctx.db
					.query("monthlyRevenue")
					.withIndex("by_project", (q) =>
						q.eq("constructionProjectId", project._id),
					)
					.collect(),
				// Get all tasks for this construction project
				ctx.db
					.query("issues")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.collect(),
				// Get team members
				Promise.all(project.teamMemberIds.map((id) => ctx.db.get(id))),
			]);

		// Get task-related data
		const tasksWithDetails = await Promise.all(
			tasks.map(async (task) => {
				const [taskStatus, assignee, taskPriority, labels] = await Promise.all([
					ctx.db.get(task.statusId),
					task.assigneeId ? ctx.db.get(task.assigneeId) : null,
					ctx.db.get(task.priorityId),
					Promise.all(task.labelIds.map((id) => ctx.db.get(id))),
				]);

				return {
					...task,
					status: taskStatus,
					assignee,
					priority: taskPriority,
					labels: labels.filter(Boolean),
				};
			}),
		);

		// Calculate task statistics
		const taskStats = {
			total: tasks.length,
			completed: 0,
			inProgress: 0,
			notStarted: 0,
		};

		// Count tasks by status (you may need to adjust based on your status names)
		for (const task of tasksWithDetails) {
			if (!task.status) continue;

			const statusName = task.status.name.toLowerCase();
			if (
				statusName.includes("done") ||
				statusName.includes("completed") ||
				statusName.includes("завершено")
			) {
				taskStats.completed++;
			} else if (
				statusName.includes("progress") ||
				statusName.includes("работе")
			) {
				taskStats.inProgress++;
			} else if (
				statusName.includes("todo") ||
				statusName.includes("backlog") ||
				statusName.includes("сделать")
			) {
				taskStats.notStarted++;
			}
		}

		return {
			...project,
			status,
			lead,
			priority,
			monthlyRevenue,
			tasks: tasksWithDetails,
			teamMembers: teamMembers.filter(Boolean),
			taskStats,
		};
	},
});

export const getTasksForProject = query({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		statusId: v.optional(v.id("status")),
		assigneeId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		let tasksQuery = ctx.db
			.query("issues")
			.withIndex("by_project", (q) =>
				q.eq("projectId", args.constructionProjectId),
			);

		// Apply filters if provided
		if (args.statusId) {
			tasksQuery = tasksQuery.filter((q) =>
				q.eq(q.field("statusId"), args.statusId),
			);
		}
		if (args.assigneeId) {
			tasksQuery = tasksQuery.filter((q) =>
				q.eq(q.field("assigneeId"), args.assigneeId),
			);
		}

		const tasks = await tasksQuery.collect();

		// Populate task details
		const tasksWithDetails = await Promise.all(
			tasks.map(async (task) => {
				const [status, assignee, priority, labels] = await Promise.all([
					ctx.db.get(task.statusId),
					task.assigneeId ? ctx.db.get(task.assigneeId) : null,
					ctx.db.get(task.priorityId),
					Promise.all(task.labelIds.map((id) => ctx.db.get(id))),
				]);

				return {
					...task,
					status,
					assignee,
					priority,
					labels: labels.filter(Boolean),
				};
			}),
		);

		return tasksWithDetails;
	},
});

export const getByStatus = query({
	args: { statusId: v.id("status") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("constructionProjects")
			.filter((q) => q.eq(q.field("statusId"), args.statusId))
			.collect();
	},
});

export const getTotalContractValue = query({
	handler: async (ctx) => {
		const projects = await ctx.db.query("constructionProjects").collect();
		return projects.reduce(
			(total, project) => total + project.contractValue,
			0,
		);
	},
});

export const getMonthlyRevenueTotal = query({
	args: { month: v.string() },
	handler: async (ctx, args) => {
		const allRevenue = await ctx.db.query("monthlyRevenue").collect();
		const monthRevenue = allRevenue.filter((rev) => rev.month === args.month);

		return monthRevenue.reduce(
			(total, rev) => ({
				planned: total.planned + rev.planned,
				actual: total.actual + rev.actual,
			}),
			{ planned: 0, actual: 0 },
		);
	},
});

// Mutations
export const create = mutation({
	args: {
		name: v.string(),
		client: v.string(),
		statusId: v.id("status"),
		iconName: v.string(),
		percentComplete: v.number(),
		contractValue: v.number(),
		startDate: v.string(),
		targetDate: v.optional(v.string()),
		leadId: v.id("users"),
		priorityId: v.id("priorities"),
		healthId: v.string(),
		healthName: v.string(),
		healthColor: v.string(),
		healthDescription: v.string(),
		location: v.string(),
		projectType: v.union(
			v.literal("residential"),
			v.literal("commercial"),
			v.literal("industrial"),
			v.literal("infrastructure"),
		),
		notes: v.optional(v.string()),
		teamMemberIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("constructionProjects", args);
	},
});

export const update = mutation({
	args: {
		id: v.id("constructionProjects"),
		name: v.optional(v.string()),
		client: v.optional(v.string()),
		statusId: v.optional(v.id("status")),
		iconName: v.optional(v.string()),
		percentComplete: v.optional(v.number()),
		contractValue: v.optional(v.number()),
		startDate: v.optional(v.string()),
		targetDate: v.optional(v.string()),
		leadId: v.optional(v.id("users")),
		priorityId: v.optional(v.id("priorities")),
		healthId: v.optional(v.string()),
		healthName: v.optional(v.string()),
		healthColor: v.optional(v.string()),
		healthDescription: v.optional(v.string()),
		location: v.optional(v.string()),
		projectType: v.optional(
			v.union(
				v.literal("residential"),
				v.literal("commercial"),
				v.literal("industrial"),
				v.literal("infrastructure"),
			),
		),
		notes: v.optional(v.string()),
		teamMemberIds: v.optional(v.array(v.id("users"))),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("constructionProjects"),
		statusId: v.id("status"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { statusId: args.statusId });
		return { success: true };
	},
});

export const updateProgress = mutation({
	args: {
		id: v.id("constructionProjects"),
		percentComplete: v.number(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { percentComplete: args.percentComplete });
		return { success: true };
	},
});

export const addMonthlyRevenue = mutation({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		month: v.string(),
		planned: v.number(),
		actual: v.number(),
	},
	handler: async (ctx, args) => {
		// Check if revenue for this month already exists
		const existing = await ctx.db
			.query("monthlyRevenue")
			.withIndex("by_project", (q) =>
				q.eq("constructionProjectId", args.constructionProjectId),
			)
			.filter((q) => q.eq(q.field("month"), args.month))
			.first();

		if (existing) {
			// Update existing revenue
			await ctx.db.patch(existing._id, {
				planned: args.planned,
				actual: args.actual,
			});
			return existing._id;
		} else {
			// Create new revenue entry
			return await ctx.db.insert("monthlyRevenue", args);
		}
	},
});

export const deleteProject = mutation({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		// Delete related monthly revenue entries
		const monthlyRevenues = await ctx.db
			.query("monthlyRevenue")
			.withIndex("by_project", (q) => q.eq("constructionProjectId", args.id))
			.collect();

		for (const revenue of monthlyRevenues) {
			await ctx.db.delete(revenue._id);
		}

		// Delete related work categories
		const workCategories = await ctx.db
			.query("workCategories")
			.withIndex("by_project", (q) => q.eq("constructionProjectId", args.id))
			.collect();

		for (const category of workCategories) {
			await ctx.db.delete(category._id);
		}

		// Delete the project
		await ctx.db.delete(args.id);
		return { success: true };
	},
});
