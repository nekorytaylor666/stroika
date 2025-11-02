import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";
import {
	canAccessProject,
	canCreateProject,
	getUserProjectAccessLevel,
} from "./permissions/checks";
import { getAccessibleProjects } from "./permissions/projectAccess";

// Queries - Get all projects the current user has access to
export const getAll = query({
	handler: async (ctx) => {
		// Check if user is authenticated
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// // Get projects accessible to the user using the permission system
		// try {
		// 	const accessibleProjects = await ctx.db
		// 		.query("constructionProjects")
		// 		.withIndex("by_organization", (q) =>
		// 			q.eq("organizationId", identity.organizationId as string),
		// 		)
		// 		.collect();

		// 	// Populate related data
		// 	const populatedProjects = await Promise.all(
		// 		accessibleProjects.map(async (project) => {
		// 			if (!project) return null;

		// 			const [status, lead, priority, monthlyRevenue] = await Promise.all([
		// 				ctx.db.get(project.statusId),
		// 				ctx.db.get(project.leadId),
		// 				ctx.db.get(project.priorityId),
		// 				ctx.db
		// 					.query("monthlyRevenue")
		// 					.withIndex("by_project", (q) =>
		// 						q.eq("constructionProjectId", project._id),
		// 					)
		// 					.collect(),
		// 			]);

		// 			return {
		// 				...project,
		// 				status,
		// 				lead,
		// 				priority,
		// 				monthlyRevenue,
		// 			};
		// 		}),
		// 	);
		const projects = await ctx.db.query("constructionProjects").collect();
		return projects;

		// return populatedProjects.filter(Boolean);
	},
});

export const getById = query({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		// // Check if user has access to this project
		// const hasAccess = await canAccessProject(ctx, user._id, args.id, "read");
		// if (!hasAccess) {
		// 	throw new Error("Insufficient permissions to view this project");
		// }

		const project = await ctx.db.get(args.id);
		if (!project) return null;

		const [status, lead, priority, monthlyRevenue, accessLevel] =
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
				// getUserProjectAccessLevel(ctx, user._id, args.id),
			]);

		return {
			...project,
			status,
			lead,
			priority,
			monthlyRevenue,
			accessLevel,
		};
	},
});

export const getProjectWithTasks = query({
	args: { id: v.string() },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		// Check if user has access to this project
		// const hasAccess = await canAccessProject(ctx, user.id, args.id, "read");
		// if (!hasAccess) {
		// 	throw new Error("Insufficient permissions to view this project");
		// }

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

		// Count tasks by status
		for (const task of tasksWithDetails) {
			if (!task.status) continue;

			const statusName = task.status.name;
			if (
				statusName === "завершено" ||
				statusName === "Завершено" ||
				statusName === "Done" ||
				statusName === "Completed" ||
				statusName === "Готово"
			) {
				taskStats.completed++;
			} else if (
				statusName === "В работе" ||
				statusName === "На проверке" ||
				statusName.includes("progress")
			) {
				taskStats.inProgress++;
			} else if (
				statusName === "К выполнению" ||
				statusName === "Todo" ||
				statusName === "Backlog" ||
				statusName === "Новая"
			) {
				taskStats.notStarted++;
			}
		}

		// Calculate percentage complete based on task stats
		const percentComplete =
			taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

		return {
			...project,
			status,
			lead,
			priority,
			monthlyRevenue,
			tasks: tasksWithDetails,
			teamMembers: teamMembers.filter(Boolean),
			taskStats,
			percentComplete,
		};
	},
});

export const getTasksForProject = query({
	args: {
		constructionProjectId: v.id("constructionProjects"),
		statusId: v.optional(v.id("status")),
		assigneeId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const { users } = await auth.api.listUsers({
			query: { limit: 100, offset: 0 },
			headers,
		});
		if (!user) throw new Error("User not found");

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
					task.assigneeId
						? users.find((user) => user.id === task.assigneeId)
						: null,
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
		statusId: v.string(),
		iconName: v.string(),
		percentComplete: v.number(),
		contractValue: v.number(),
		startDate: v.string(),
		targetDate: v.optional(v.string()),
		leadId: v.string(),
		priorityId: v.string(),
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
		teamMemberIds: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		if (!user) {
			throw new Error("User not found");
		}

		if (!organization) {
			throw new Error("Organization not found");
		}

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		const projectId = await ctx.db.insert("constructionProjects", {
			...args,
			organizationId: organization.id,
		});

		const team = await auth.api.createTeam({
			body: {
				name: projectId,
				organizationId: organization.id,
			},
			headers: await authComponent.getHeaders(ctx),
		});

		await ctx.runMutation(components.betterAuth.team.addTeamMembers, {
			teamId: team.id,
			userIds: args.teamMemberIds,
		});

		const response = await ctx.runMutation(
			api.customPermissions.createAllProjectRoles,
			{
				projectId,
			},
		);
		console.log("organization roles created", response);

		await ctx.runMutation(api.customPermissions.assignUserToRole, {
			userId: args.leadId,
			roleId: response.adminRoleId,
		});
		await ctx.runMutation(api.customPermissions.assignUserToRole, {
			userId: user._id,
			roleId: response.ownerRoleId,
		});

		await Promise.all(
			args.teamMemberIds.map((id) =>
				ctx.runMutation(api.customPermissions.assignUserToRole, {
					userId: id,
					roleId: response.memberRoleId,
				}),
			),
		);

		// // Grant the creator admin access to the project
		// await ctx.db.insert("projectAccess", {
		// 	projectId,
		// 	userId: user.id,
		// 	teamId: undefined,
		// 	accessLevel: "admin",
		// 	grantedBy: user.id,
		// 	grantedAt: Date.now(),
		// 	expiresAt: undefined,
		// });

		// // Grant the project lead admin access
		// if (args.leadId !== user.id) {
		// 	await ctx.db.insert("projectAccess", {
		// 		projectId,
		// 		userId: args.leadId,
		// 		teamId: undefined,
		// 		accessLevel: "admin",
		// 		grantedBy: user.id,
		// 		grantedAt: Date.now(),
		// 		expiresAt: undefined,
		// 	});
		// }

		// Grant team members write access
		// for (const memberId of args.teamMemberIds) {
		// 	if (memberId !== user.id && memberId !== args.leadId) {
		// 		await ctx.db.insert("projectAccess", {
		// 			projectId,
		// 			userId: memberId,
		// 			teamId: undefined,
		// 			accessLevel: "write",
		// 			grantedBy: user.id,
		// 			grantedAt: Date.now(),
		// 			expiresAt: undefined,
		// 		});
		// 	}
		// }

		return projectId;
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
		leadId: v.optional(v.string()),
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
		teamMemberIds: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const { users } = await auth.api.listUsers({
			query: { limit: 100, offset: 0 },
			headers,
		});

		const { id, ...updates } = args;

		// If lead is changed, grant them admin access
		if (updates.leadId) {
			const existingAccess = await ctx.db
				.query("projectAccess")
				.withIndex("by_project_user", (q) =>
					q.eq("projectId", id).eq("userId", updates.leadId),
				)
				.first();

			if (!existingAccess) {
				await ctx.db.insert("projectAccess", {
					projectId: id,
					userId: updates.leadId,
					teamId: undefined,
					accessLevel: "admin",
					grantedBy: user._id,
					grantedAt: Date.now(),
					expiresAt: undefined,
				});
			} else if (
				existingAccess.accessLevel !== "admin" &&
				existingAccess.accessLevel !== "owner"
			) {
				await ctx.db.patch(existingAccess._id, {
					accessLevel: "admin",
					grantedBy: user._id,
					grantedAt: Date.now(),
				});
			}
		}

		// If team members are updated, grant them write access
		if (updates.teamMemberIds) {
			for (const memberId of updates.teamMemberIds) {
				const existingAccess = await ctx.db
					.query("projectAccess")
					.withIndex("by_project_user", (q) =>
						q.eq("projectId", id).eq("userId", memberId),
					)
					.first();

				if (!existingAccess) {
					await ctx.db.insert("projectAccess", {
						projectId: id,
						userId: memberId,
						teamId: undefined,
						accessLevel: "write",
						grantedBy: user._id,
						grantedAt: Date.now(),
						expiresAt: undefined,
					});
				}
			}
		}

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
		}
		// Create new revenue entry
		return await ctx.db.insert("monthlyRevenue", args);
	},
});

export const deleteProject = mutation({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		// Check if user has admin access to delete this project
		const hasAccess = await canAccessProject(ctx, user._id, args.id, "admin");
		if (!hasAccess) {
			throw new Error("Insufficient permissions to delete this project");
		}

		// Delete all project access entries
		const projectAccesses = await ctx.db
			.query("projectAccess")
			.withIndex("by_project", (q) => q.eq("projectId", args.id))
			.collect();

		for (const access of projectAccesses) {
			await ctx.db.delete(access._id);
		}

		// Delete team project access entries
		const teamAccesses = await ctx.db
			.query("teamProjectAccess")
			.withIndex("by_project", (q) => q.eq("projectId", args.id))
			.collect();

		for (const access of teamAccesses) {
			await ctx.db.delete(access._id);
		}

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

export const getAllProjectsWithTasksForGantt = query({
	handler: async (ctx) => {
		const projects = await ctx.db.query("constructionProjects").collect();

		// Populate related data and tasks for all projects
		const populatedProjects = await Promise.all(
			projects.map(async (project) => {
				const [status, lead, priority, tasks] = await Promise.all([
					ctx.db.get(project.statusId),
					ctx.db.get(project.leadId),
					ctx.db.get(project.priorityId),
					ctx.db
						.query("issues")
						.withIndex("by_project", (q) => q.eq("projectId", project._id))
						.collect(),
				]);

				// Get task details
				const tasksWithDetails = await Promise.all(
					tasks.map(async (task) => {
						const [taskStatus, assignee] = await Promise.all([
							ctx.db.get(task.statusId),
							task.assigneeId ? ctx.db.get(task.assigneeId) : null,
						]);

						return {
							_id: task._id,
							title: task.title,
							startDate: task.createdAt,
							dueDate: task.dueDate,
							status: taskStatus,
							assignee,
						};
					}),
				);

				return {
					_id: project._id,
					name: project.name,
					startDate: project.startDate,
					targetDate: project.targetDate,
					status,
					lead,
					priority,
					tasks: tasksWithDetails,
				};
			}),
		);

		return populatedProjects;
	},
});

export const getProjectTimelineData = query({
	args: { id: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.id);
		if (!project) return null;

		// Get all tasks for this project
		const tasks = await ctx.db
			.query("issues")
			.withIndex("by_project", (q) => q.eq("projectId", project._id))
			.collect();

		// Get task statuses
		const tasksWithStatus = await Promise.all(
			tasks.map(async (task) => {
				const status = await ctx.db.get(task.statusId);
				return {
					...task,
					status,
				};
			}),
		);

		// Filter tasks with due dates
		const tasksWithDueDates = tasksWithStatus.filter((task) => task.dueDate);

		// Get completed tasks
		const completedTasks = tasksWithStatus.filter((task) => {
			if (!task.status) return false;
			const statusName = task.status.name;
			return (
				statusName === "завершено" ||
				statusName === "Завершено" ||
				statusName === "Done" ||
				statusName === "Completed" ||
				statusName === "Готово"
			);
		});

		// Get all activities for timeline history
		const taskIds = tasks.map((t) => t._id);

		// Get creation activities
		const creationActivities = await ctx.db
			.query("issueActivities")
			.withIndex("by_type", (q) => q.eq("type", "created"))
			.collect();

		// Get completion activities
		const completionActivities = await ctx.db
			.query("issueActivities")
			.withIndex("by_type", (q) => q.eq("type", "completed"))
			.collect();

		// Get status change activities for tracking when tasks moved to completed
		const statusChangeActivities = await ctx.db
			.query("issueActivities")
			.withIndex("by_type", (q) => q.eq("type", "status_changed"))
			.collect();

		// Filter for our project's tasks
		const projectCreationActivities = creationActivities.filter((a) =>
			taskIds.includes(a.issueId),
		);

		const projectCompletionActivities = completionActivities.filter((a) =>
			taskIds.includes(a.issueId),
		);

		const projectStatusChanges = statusChangeActivities.filter((a) =>
			taskIds.includes(a.issueId),
		);

		// Get all statuses to check which are completion statuses
		const statuses = await ctx.db.query("status").collect();
		const completionStatusIds = statuses
			.filter(
				(s) =>
					s.name === "завершено" ||
					s.name === "Завершено" ||
					s.name === "Done" ||
					s.name === "Completed" ||
					s.name === "Готово",
			)
			.map((s) => s._id);

		// Map tasks to their completion dates
		const taskCompletionDates = new Map();

		// First check completion activities
		for (const activity of projectCompletionActivities) {
			taskCompletionDates.set(activity.issueId, activity.createdAt);
		}

		// Then check status changes to completed status
		for (const activity of projectStatusChanges) {
			if (
				activity.metadata?.newStatusId &&
				completionStatusIds.includes(activity.metadata.newStatusId)
			) {
				// Only set if not already set by completion activity
				if (!taskCompletionDates.has(activity.issueId)) {
					taskCompletionDates.set(activity.issueId, activity.createdAt);
				}
			}
		}

		// Add completion dates to completed tasks
		const completedTasksWithDates = completedTasks.map((task) => ({
			...task,
			completedAt: taskCompletionDates.get(task._id) || null,
		}));

		// Map tasks to their creation dates
		const taskCreationDates = new Map();
		for (const activity of projectCreationActivities) {
			taskCreationDates.set(activity.issueId, activity.createdAt);
		}

		// Add creation dates to all tasks
		const tasksWithCreationDates = tasks.map((task) => ({
			...task,
			createdAt:
				taskCreationDates.get(task._id) ||
				// Fallback to task's createdAt field if available
				(task.createdAt ? new Date(task.createdAt).getTime() : null) ||
				// Otherwise use project start date
				new Date(project.startDate).getTime(),
		}));

		// Get all activities for historical data
		const allProjectActivities = [
			...projectCreationActivities,
			...projectCompletionActivities,
			...projectStatusChanges,
		].sort((a, b) => a.createdAt - b.createdAt);

		// Calculate remaining (planned but not completed) tasks
		const remainingTasks = tasksWithCreationDates.filter((task) => {
			// Check if this task is in the completed list
			return !completedTasks.some(
				(completedTask) => completedTask._id === task._id,
			);
		});

		return {
			project: {
				...project,
				taskStats: {
					total: tasks.length,
					withDueDates: tasksWithDueDates.length,
					completed: completedTasks.length,
					remaining: remainingTasks.length,
				},
			},
			tasks: tasksWithCreationDates,
			remainingTasks, // New field for non-completed tasks
			tasksWithDueDates,
			completedTasks: completedTasksWithDates,
			activities: allProjectActivities,
		};
	},
});

// Organization-level queries for overview dashboard
export const getOrganizationOverview = query({
	handler: async (ctx) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!organization) {
			throw new Error("Organization not found");
		}

		// Get all projects for the organization
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Get all tasks for all projects
		const allTasks = await Promise.all(
			projects.map(async (project) => {
				const tasks = await ctx.db
					.query("issues")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.collect();
				return { projectId: project._id, tasks };
			}),
		);

		// Get all statuses to identify completion statuses
		const statuses = await ctx.db.query("status").collect();
		const completionStatusIds = statuses
			.filter(
				(s) =>
					s.name === "завершено" ||
					s.name === "Завершено" ||
					s.name === "Done" ||
					s.name === "Completed" ||
					s.name === "Готово",
			)
			.map((s) => s._id);

		// Calculate stats for each project
		const projectsWithStats = await Promise.all(
			projects.map(async (project) => {
				const projectTasks = allTasks.find(
					(t) => t.projectId === project._id,
				)?.tasks || [];

				// Get task statuses
				const tasksWithStatus = await Promise.all(
					projectTasks.map(async (task) => {
						const status = await ctx.db.get(task.statusId);
						return { ...task, status };
					}),
				);

				// Calculate task stats
				const taskStats = {
					total: projectTasks.length,
					completed: 0,
					inProgress: 0,
					notStarted: 0,
					overdue: 0,
				};

				const now = new Date();
				for (const task of tasksWithStatus) {
					if (!task.status) continue;

					// Check if completed
					if (completionStatusIds.includes(task.statusId)) {
						taskStats.completed++;
					} else if (
						task.status.name === "В работе" ||
						task.status.name === "На проверке" ||
						task.status.name.toLowerCase().includes("progress")
					) {
						taskStats.inProgress++;
					} else {
						taskStats.notStarted++;
					}

					// Check if overdue
					if (task.dueDate && !completionStatusIds.includes(task.statusId)) {
						const dueDate = new Date(task.dueDate);
						if (dueDate < now) {
							taskStats.overdue++;
						}
					}
				}

				// Calculate project delay
				const targetDate = project.targetDate
					? new Date(project.targetDate)
					: null;
				const isDelayed =
					targetDate &&
					targetDate < now &&
					taskStats.completed < taskStats.total;

				// Get related data
				const [status, priority, lead] = await Promise.all([
					ctx.db.get(project.statusId),
					ctx.db.get(project.priorityId),
					ctx.db.get(project.leadId),
				]);

				return {
					...project,
					status,
					priority,
					lead,
					taskStats,
					percentComplete: taskStats.total > 0
						? Math.round((taskStats.completed / taskStats.total) * 100)
						: 0,
					isDelayed,
					daysDelayed: isDelayed && targetDate
						? Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
						: 0,
				};
			}),
		);

		// Calculate organization-level stats
		const orgStats = {
			totalProjects: projects.length,
			activeProjects: 0,
			completedProjects: 0,
			delayedProjects: 0,
			totalTasks: 0,
			completedTasks: 0,
			inProgressTasks: 0,
			overdueTasks: 0,
			totalContractValue: 0,
			averageProgress: 0,
			projectsAtRisk: 0,
		};

		for (const project of projectsWithStats) {
			// Count project status
			if (project.percentComplete === 100) {
				orgStats.completedProjects++;
			} else {
				orgStats.activeProjects++;
			}

			if (project.isDelayed) {
				orgStats.delayedProjects++;
			}

			// Sum task stats
			orgStats.totalTasks += project.taskStats.total;
			orgStats.completedTasks += project.taskStats.completed;
			orgStats.inProgressTasks += project.taskStats.inProgress;
			orgStats.overdueTasks += project.taskStats.overdue;

			// Sum contract value
			orgStats.totalContractValue += project.contractValue;

			// Check if at risk
			if (
				project.healthId === "at-risk" ||
				project.healthId === "off-track" ||
				project.taskStats.overdue > 0 ||
				project.isDelayed
			) {
				orgStats.projectsAtRisk++;
			}
		}

		// Calculate average progress
		if (projectsWithStats.length > 0) {
			const totalProgress = projectsWithStats.reduce(
				(sum, p) => sum + p.percentComplete,
				0,
			);
			orgStats.averageProgress = Math.round(
				totalProgress / projectsWithStats.length,
			);
		}

		return {
			orgStats,
			projects: projectsWithStats,
			organization,
		};
	},
});

export const getOrganizationMonthlyRevenue = query({
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		if (!organization) {
			throw new Error("Organization not found");
		}

		// Get all projects for the organization
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Get all monthly revenue data
		const allRevenue = await Promise.all(
			projects.map(async (project) => {
				const revenue = await ctx.db
					.query("monthlyRevenue")
					.withIndex("by_project", (q) =>
						q.eq("constructionProjectId", project._id),
					)
					.collect();
				return {
					projectId: project._id,
					projectName: project.name,
					revenue,
				};
			}),
		);

		// Group by month and aggregate
		const monthlyData = new Map();

		for (const projectRevenue of allRevenue) {
			for (const rev of projectRevenue.revenue) {
				if (!monthlyData.has(rev.month)) {
					monthlyData.set(rev.month, {
						month: rev.month,
						totalPlanned: 0,
						totalActual: 0,
						projects: [],
					});
				}

				const monthData = monthlyData.get(rev.month);
				monthData.totalPlanned += rev.planned;
				monthData.totalActual += rev.actual;
				monthData.projects.push({
					projectId: projectRevenue.projectId,
					projectName: projectRevenue.projectName,
					planned: rev.planned,
					actual: rev.actual,
				});
			}
		}

		// Convert to array and sort by month
		const sortedMonths = Array.from(monthlyData.values()).sort(
			(a, b) => a.month.localeCompare(b.month),
		);

		// Calculate cumulative totals
		let cumulativePlanned = 0;
		let cumulativeActual = 0;

		const monthlyDataWithCumulative = sortedMonths.map((month) => {
			cumulativePlanned += month.totalPlanned;
			cumulativeActual += month.totalActual;

			return {
				...month,
				cumulativePlanned,
				cumulativeActual,
				variance: month.totalActual - month.totalPlanned,
				variancePercent:
					month.totalPlanned > 0
						? ((month.totalActual - month.totalPlanned) / month.totalPlanned) *
							100
						: 0,
			};
		});

		return {
			monthlyRevenue: monthlyDataWithCumulative,
			totalPlanned: cumulativePlanned,
			totalActual: cumulativeActual,
			totalVariance: cumulativeActual - cumulativePlanned,
		};
	},
});

export const getOrganizationTimeline = query({
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		if (!organization) {
			throw new Error("Organization not found");
		}

		// Get all projects for the organization
		const projects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization.id),
			)
			.collect();

		// Get timeline data for each project
		const projectTimelines = await Promise.all(
			projects.map(async (project) => {
				// Get all tasks for this project
				const tasks = await ctx.db
					.query("issues")
					.withIndex("by_project", (q) => q.eq("projectId", project._id))
					.collect();

				// Get task details
				const tasksWithDetails = await Promise.all(
					tasks.map(async (task) => {
						const status = await ctx.db.get(task.statusId);
						return {
							...task,
							status,
							isCompleted: status
								? status.name === "завершено" ||
									status.name === "Завершено" ||
									status.name === "Done" ||
									status.name === "Completed" ||
									status.name === "Готово"
								: false,
						};
					}),
				);

				const now = new Date();
				const startDate = new Date(project.startDate);
				const targetDate = project.targetDate
					? new Date(project.targetDate)
					: null;

				// Calculate project progress
				const totalTasks = tasksWithDetails.length;
				const completedTasks = tasksWithDetails.filter((t) => t.isCompleted)
					.length;
				const percentComplete =
					totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

				// Calculate expected progress based on timeline
				let expectedProgress = 0;
				if (targetDate) {
					const totalDuration = targetDate.getTime() - startDate.getTime();
					const elapsed = now.getTime() - startDate.getTime();
					expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
				}

				// Identify delayed tasks
				const delayedTasks = tasksWithDetails.filter((task) => {
					if (task.isCompleted || !task.dueDate) return false;
					return new Date(task.dueDate) < now;
				});

				// Calculate project delay status
				let delayStatus = "on-track";
				let daysDelayed = 0;

				if (targetDate && targetDate < now && percentComplete < 100) {
					delayStatus = "delayed";
					daysDelayed = Math.floor(
						(now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
					);
				} else if (percentComplete < expectedProgress - 10) {
					// More than 10% behind expected progress
					delayStatus = "at-risk";
				}

				return {
					projectId: project._id,
					projectName: project.name,
					startDate: project.startDate,
					targetDate: project.targetDate,
					percentComplete,
					expectedProgress,
					delayStatus,
					daysDelayed,
					totalTasks,
					completedTasks,
					delayedTasks: delayedTasks.length,
					healthStatus: project.healthName,
					healthColor: project.healthColor,
				};
			}),
		);

		// Sort by delay status (delayed first, then at-risk, then on-track)
		const sortedTimelines = projectTimelines.sort((a, b) => {
			const statusOrder = { delayed: 0, "at-risk": 1, "on-track": 2 };
			return statusOrder[a.delayStatus] - statusOrder[b.delayStatus];
		});

		return {
			timelines: sortedTimelines,
			summary: {
				total: projectTimelines.length,
				onTrack: projectTimelines.filter((p) => p.delayStatus === "on-track")
					.length,
				atRisk: projectTimelines.filter((p) => p.delayStatus === "at-risk")
					.length,
				delayed: projectTimelines.filter((p) => p.delayStatus === "delayed")
					.length,
			},
		};
	},
});
