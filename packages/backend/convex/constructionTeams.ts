import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import {
	getCurrentUser,
	getCurrentUserWithOrganization,
	requireOrganizationAccess,
} from "./helpers/getCurrentUser";

// Get team members for a specific project with task statistics
export const getProjectTeamWithStats = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		// Get the project
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Get all tasks for this project
		const projectTasks = await ctx.db
			.query("issues")
			.filter((q) =>
				q.and(
					q.eq(q.field("isConstructionTask"), true),
					q.eq(q.field("projectId"), args.projectId),
				),
			)
			.collect();

		// Get statuses for task categorization
		const statuses = await ctx.db.query("status").collect();
		const statusMap = new Map(statuses.map((s) => [s._id, s]));

		// Get team members by project ID (team name = project ID)
		const users = await ctx.runQuery(
			components.betterAuth.team.getTeamMembersByTeamName,
			{
				name: args.projectId,
			},
		);

		// Calculate statistics for each member
		const teamMembers = await Promise.all(
			users.map(async (user) => {
				// Get all tasks assigned to this user
				const userTasks = projectTasks.filter(
					(task) => task.assigneeId === user._id,
				);

				// Calculate task statistics
				const taskStats = {
					total: userTasks.length,
					plan: userTasks.length, // All assigned tasks are planned
					fact: 0, // Only completed tasks count as fact
					completed: 0,
					inProgress: 0,
					todo: 0,
					overdue: 0,
				};

				// Categorize tasks by status
				for (const task of userTasks) {
					if (task.statusId) {
						const status = statusMap.get(task.statusId);
						if (status) {
							if (
								status.name === "завершено" ||
								status.name === "Done" ||
								status.name === "Completed"
							) {
								taskStats.completed++;
								taskStats.fact++; // Completed tasks count as fact
							} else if (
								status.name === "В работе" ||
								status.name === "In Progress"
							) {
								taskStats.inProgress++;
							} else {
								taskStats.todo++;
							}
						}
					} else {
						taskStats.todo++;
					}

					// Check if overdue
					if (
						task.dueDate &&
						new Date(task.dueDate) < new Date() &&
						task.statusId &&
						statusMap.get(task.statusId)?.name !== "завершено"
					) {
						taskStats.overdue++;
					}
				}

				// Calculate workload (based on in-progress and todo tasks)
				// Assuming each task represents 10% workload, capped at 100%
				const activeTaskCount = taskStats.inProgress + taskStats.todo;
				const workload = Math.min(activeTaskCount * 10, 100);

				// Determine availability based on workload and user status
				let availability: "on-site" | "office" | "remote" | "off" = "office";
				if (user.status === "offline") {
					availability = "off";
				} else if (workload > 80) {
					availability = "on-site"; // Assume busy users are on-site
				} else if (user.status === "away") {
					availability = "remote";
				}

				// Get user's department/position from userDepartments table
				const userDepartment = await ctx.db
					.query("userDepartments")
					.withIndex("by_user", (q) => q.eq("userId", user._id))
					.filter((q) => q.eq(q.field("isPrimary"), true))
					.first();

				const department = userDepartment?.departmentId
					? await ctx.db.get(userDepartment.departmentId)
					: null;
				const position = userDepartment?.positionId
					? await ctx.db.get(userDepartment.positionId)
					: null;

				return {
					_id: user._id,
					name: user.name,
					email: user.email,
					avatarUrl: user.image,
					isLead: false, // Team members are fetched from team structure, lead status handled separately
					department: department
						? {
								_id: department._id,
								name: department.displayName || department.name,
							}
						: null,
					position: position
						? {
								_id: position._id,
								name: position.displayName || position.name,
							}
						: null,
					taskStats: {
						...taskStats,
						overdue: taskStats.overdue || 0,
					},
					workload,
					availability,
					// Recent tasks (last 5)
					recentTasks: userTasks
						.sort((a, b) => b._creationTime - a._creationTime)
						.slice(0, 5)
						.map((task) => ({
							_id: task._id,
							title: task.title,
							identifier: task.identifier,
							status: task.statusId ? statusMap.get(task.statusId) : null,
							dueDate: task.dueDate,
							priority: task.priorityId,
						})),
				};
			}),
		);

		// Filter out null values and sort by total tasks
		const validMembers = teamMembers.filter(
			(m): m is NonNullable<typeof m> => m !== null,
		);
		validMembers.sort((a, b) => b.taskStats.total - a.taskStats.total);

		// Calculate overall team statistics
		const teamStats = {
			totalMembers: validMembers.length,
			totalTasks: projectTasks.length,
			assignedTasks: projectTasks.filter((t) => t.assigneeId).length,
			unassignedTasks: projectTasks.filter((t) => !t.assigneeId).length,
			plannedTasks: validMembers.reduce((sum, m) => sum + m.taskStats.plan, 0),
			completedTasks: validMembers.reduce(
				(sum, m) => sum + m.taskStats.completed,
				0,
			),
			inProgressTasks: validMembers.reduce(
				(sum, m) => sum + m.taskStats.inProgress,
				0,
			),
			todoTasks: validMembers.reduce((sum, m) => sum + m.taskStats.todo, 0),
			overdueTasks: validMembers.reduce(
				(sum, m) => sum + m.taskStats.overdue,
				0,
			),
		};

		return {
			project: {
				_id: project._id,
				name: project.name,
				client: project.client,
			},
			members: validMembers,
			teamStats,
		};
	},
});

// Add member to project team
export const addTeamMembers = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		userIds: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);
		await ctx.runMutation(components.betterAuth.team.addTeamMembersByTeamName, {
			teamName: args.projectId,
			userIds: args.userIds,
		});
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

		return { success: true };
	},
});

// Remove member from project team
export const removeTeamMember = mutation({
	args: {
		teamName: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(
			components.betterAuth.team.removeTeamMembersByTeamName,
			{
				teamName: args.teamName,
				userId: args.userId,
			},
		);

		// Unassign all tasks from this user in this project
		const userTasks = await ctx.db
			.query("issues")
			.filter((q) =>
				q.and(
					q.eq(q.field("isConstructionTask"), true),
					q.eq(q.field("projectId"), args.teamName),
					q.eq(q.field("assigneeId"), args.userId),
				),
			)
			.collect();

		// Unassign each task
		await Promise.all(
			userTasks.map((task) =>
				ctx.db.patch(task._id, { assigneeId: undefined }),
			),
		);

		return { success: true };
	},
});

// Get all teams (existing function remains)
export const getAll = query({
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		if (!user || !user.currentOrganizationId) {
			return [];
		}
	},
});

// List all construction teams for an organization
export const list = query({
	args: { organizationId: v.id("organizations") },
	handler: async (ctx, args) => {
		// Verify user has access to this organization
		await requireOrganizationAccess(ctx, args.organizationId);
		// Get all teams for the organization
		const teams = await ctx.db
			.query("constructionTeams")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		// Get team statistics
		return Promise.all(
			teams.map(async (team) => {
				// Get member count
				const memberCount = team.memberIds?.length || 0;

				// Get projects where this team is involved
				const projects =
					team.projectIds.length > 0
						? await ctx.db
								.query("constructionProjects")
								.filter((q) =>
									q.or(
										...team.projectIds.map((projectId) =>
											q.eq(q.field("_id"), projectId),
										),
										...(team.memberIds || []).map((memberId) =>
											q.eq(q.field("leadId"), memberId),
										),
									),
								)
								.collect()
						: [];

				// Get statuses to check completion
				const statuses = await ctx.db.query("status").collect();
				const completedStatus = statuses.find(
					(s) =>
						s.name.toLowerCase() === "completed" ||
						s.name.toLowerCase() === "done",
				);
				const activeProjectsCount = completedStatus
					? projects.filter((p) => p.statusId !== completedStatus._id).length
					: projects.length;

				// Get tasks for team members
				const tasks = team.memberIds
					? await ctx.db
							.query("issues")
							.filter((q) =>
								q.and(
									q.eq(q.field("isConstructionTask"), true),
									q.or(
										...team.memberIds.map((id) =>
											q.eq(q.field("assigneeId"), id),
										),
									),
								),
							)
							.collect()
					: [];

				// Get status for completed tasks
				const taskStatuses = await ctx.db.query("status").collect();
				const doneStatus = taskStatuses.find(
					(s) =>
						s.name.toLowerCase() === "done" ||
						s.name.toLowerCase() === "completed",
				);
				const completedTasksCount = doneStatus
					? tasks.filter((t) => t.statusId === doneStatus._id).length
					: 0;

				// Get department display name
				const departmentMap = {
					design: "Дизайн",
					construction: "Строительство",
					engineering: "Инженерия",
					management: "Управление",
				};
				const department = team.department
					? { name: departmentMap[team.department] }
					: null;

				return {
					...team,
					memberCount,
					activeProjectsCount,
					completedTasksCount,
					department,
				};
			}),
		);
	},
});

// Create a new construction team
export const create = mutation({
	args: {
		name: v.string(),
		departmentId: v.string(), // Will map to department enum
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		// Verify user has access to this organization
		await requireOrganizationAccess(ctx, args.organizationId);

		// Map department ID to enum value
		const departmentMap: Record<
			string,
			"design" | "construction" | "engineering" | "management"
		> = {
			design: "design",
			construction: "construction",
			engineering: "engineering",
			management: "management",
		};

		const department = departmentMap[args.departmentId] || "management";

		// Create the team
		return await ctx.db.insert("constructionTeams", {
			name: args.name,
			shortName: args.name.substring(0, 3).toUpperCase(),
			icon: "Users",
			joined: false,
			color: "#3B82F6", // Default blue color
			department,
			organizationId: args.organizationId,
			memberIds: [],
			projectIds: [],
			workload: 0,
		});
	},
});

// Get team with detailed statistics
export const getTeamWithStats = query({
	args: { teamId: v.id("constructionTeams") },
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Get department display name
		const departmentMap = {
			design: "Дизайн",
			construction: "Строительство",
			engineering: "Инженерия",
			management: "Управление",
		};
		const department = team.department
			? { name: departmentMap[team.department] }
			: null;

		// Calculate team statistics
		const memberCount = team.memberIds?.length || 0;

		// Get all projects where team members are involved
		const projects = await ctx.db.query("constructionProjects").collect();

		const teamProjects = projects.filter(
			(p) =>
				team.projectIds.includes(p._id) ||
				(team.memberIds || []).includes(p.leadId) ||
				(p.teamMemberIds || []).some((id) =>
					(team.memberIds || []).includes(id),
				),
		);

		// Get statuses to check completion
		const projectStatuses = await ctx.db.query("status").collect();
		const completedProjectStatus = projectStatuses.find(
			(s) =>
				s.name.toLowerCase() === "completed" || s.name.toLowerCase() === "done",
		);
		const activeProjectsCount = completedProjectStatus
			? teamProjects.filter((p) => p.statusId !== completedProjectStatus._id)
					.length
			: teamProjects.length;

		// Get all tasks for team members
		const tasks =
			team.memberIds && team.memberIds.length > 0
				? await ctx.db
						.query("issues")
						.filter((q) =>
							q.and(
								q.eq(q.field("isConstructionTask"), true),
								q.or(
									...team.memberIds.map((id) =>
										q.eq(q.field("assigneeId"), id),
									),
								),
							),
						)
						.collect()
				: [];

		// Get statuses
		const statuses = await ctx.db.query("status").collect();
		const statusMap = new Map(statuses.map((s) => [s._id, s]));
		const doneStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "done" || s.name.toLowerCase() === "completed",
		);

		const completedTasksCount = doneStatus
			? tasks.filter((t) => t.statusId === doneStatus._id).length
			: 0;

		const avgCompletionRate =
			tasks.length > 0
				? Math.round((completedTasksCount / tasks.length) * 100)
				: 0;

		return {
			...team,
			department,
			stats: {
				memberCount,
				activeProjectsCount,
				completedTasksCount,
				avgCompletionRate,
			},
		};
	},
});

// Get team members with their statistics
export const getTeamMembers = query({
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

		// Get all tasks for statistics
		const allTasks = await ctx.db
			.query("issues")
			.filter((q) => q.eq(q.field("isConstructionTask"), true))
			.collect();

		// Get statuses
		const statuses = await ctx.db.query("status").collect();
		const doneStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "done" || s.name.toLowerCase() === "completed",
		);
		const inProgressStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "in progress" ||
				s.name.toLowerCase() === "в работе",
		);

		return Promise.all(
			memberIds.map(async (userId) => {
				const user = await ctx.db.get(userId);
				if (!user) return null;

				// Get member's tasks
				const userTasks = allTasks.filter((t) => t.assigneeId === userId);
				const activeTasksCount = inProgressStatus
					? userTasks.filter((t) => t.statusId === inProgressStatus._id).length
					: 0;
				const completedTasksCount = doneStatus
					? userTasks.filter((t) => t.statusId === doneStatus._id).length
					: 0;

				// Get member's role in team (could be enhanced with actual roles)
				const role = "Участник команды";

				return {
					user,
					role,
					stats: {
						activeTasksCount,
						completedTasksCount,
					},
					isActive: true,
					joinedAt: team._creationTime, // Could be enhanced with actual join date
				};
			}),
		).then((members) => members.filter((m) => m !== null));
	},
});

// Add multiple members to a team
export const addMembers = mutation({
	args: {
		teamId: v.id("constructionTeams"),
		userIds: v.array(v.id("users")),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Get current members
		const currentMembers = new Set(team.memberIds || []);

		// Add new members (avoid duplicates)
		args.userIds.forEach((userId) => currentMembers.add(userId));

		// Update team
		await ctx.db.patch(args.teamId, {
			memberIds: Array.from(currentMembers),
		});

		return { success: true };
	},
});

// Remove a member from a team
export const removeMember = mutation({
	args: {
		teamId: v.id("constructionTeams"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Remove member
		const updatedMembers = (team.memberIds || []).filter(
			(id) => id !== args.userId,
		);

		// Update team
		await ctx.db.patch(args.teamId, {
			memberIds: updatedMembers,
		});

		return { success: true };
	},
});

// Get available users (not in the team)
export const getAvailableUsers = query({
	args: {
		teamId: v.id("constructionTeams"),
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Get all organization members
		const orgMembers = await ctx.db
			.query("organizationMembers")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		// Get users who are not in the team
		const teamMemberIds = new Set(team.memberIds || []);
		const availableMembers = orgMembers.filter(
			(m) => !teamMemberIds.has(m.userId),
		);

		// Get user details
		return Promise.all(
			availableMembers.map(async (member) => {
				const user = await ctx.db.get(member.userId);
				return user;
			}),
		).then((users) => users.filter((u) => u !== null));
	},
});

// Get detailed team statistics
export const getTeamStatistics = query({
	args: { teamId: v.id("constructionTeams") },
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		const memberIds = team.memberIds || [];

		// Get all tasks
		const tasks =
			memberIds.length > 0
				? await ctx.db
						.query("issues")
						.filter((q) =>
							q.and(
								q.eq(q.field("isConstructionTask"), true),
								q.or(...memberIds.map((id) => q.eq(q.field("assigneeId"), id))),
							),
						)
						.collect()
				: [];

		// Get statuses
		const statuses = await ctx.db.query("status").collect();
		const statusMap = new Map(statuses.map((s) => [s._id, s]));

		// Calculate task statistics
		const todoStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "todo" ||
				s.name.toLowerCase() === "к выполнению",
		);
		const inProgressStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "in progress" ||
				s.name.toLowerCase() === "в работе",
		);
		const doneStatus = statuses.find(
			(s) =>
				s.name.toLowerCase() === "done" ||
				s.name.toLowerCase() === "completed" ||
				s.name.toLowerCase() === "выполнено",
		);

		const todoTasks = todoStatus
			? tasks.filter((t) => t.statusId === todoStatus._id).length
			: 0;
		const inProgressTasks = inProgressStatus
			? tasks.filter((t) => t.statusId === inProgressStatus._id).length
			: 0;
		const completedTasks = doneStatus
			? tasks.filter((t) => t.statusId === doneStatus._id).length
			: 0;
		const totalTasks = tasks.length;
		const activeTasks = todoTasks + inProgressTasks;

		// Calculate overdue tasks
		const now = new Date();
		const overdueTasks = tasks.filter(
			(t) =>
				t.dueDate &&
				new Date(t.dueDate) < now &&
				t.statusId !== doneStatus?._id,
		).length;

		// Calculate monthly statistics
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const completedThisMonth = doneStatus
			? tasks.filter(
					(t) =>
						t.statusId === doneStatus._id &&
						t._creationTime &&
						new Date(t._creationTime) > thirtyDaysAgo,
				).length
			: 0;

		// Calculate member statistics
		const memberStats = await Promise.all(
			memberIds.map(async (userId) => {
				const user = await ctx.db.get(userId);
				if (!user) return null;

				const userTasks = tasks.filter((t) => t.assigneeId === userId);
				const userCompleted = doneStatus
					? userTasks.filter((t) => t.statusId === doneStatus._id).length
					: 0;
				const efficiency =
					userTasks.length > 0
						? Math.round((userCompleted / userTasks.length) * 100)
						: 0;

				return {
					userId,
					userName: user.name || "Unknown",
					completedTasks: userCompleted,
					totalTasks: userTasks.length,
					efficiency,
				};
			}),
		).then((stats) => stats.filter((s) => s !== null));

		// Sort member stats by efficiency
		memberStats.sort((a, b) => (b?.efficiency || 0) - (a?.efficiency || 0));

		// Calculate average completion time (mock data for now)
		const avgCompletionTime = 3.5;
		const tasksPerDay = totalTasks > 0 ? (completedTasks / 30).toFixed(1) : "0";
		const teamWorkload =
			memberIds.length > 0
				? Math.min(
						100,
						Math.round((activeTasks / (memberIds.length * 5)) * 100),
					)
				: 0;

		return {
			totalTasks,
			activeTasks,
			completedTasks,
			todoTasks,
			inProgressTasks,
			overdueTasks,
			completedThisMonth,
			monthlyGrowth: 15, // Mock data
			avgCompletionTime,
			tasksPerDay,
			teamWorkload,
			memberStats,
		};
	},
});

// Get activities for all team members
export const getTeamActivities = query({
	args: {
		teamId: v.id("constructionTeams"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const currentUser = await getCurrentUser(ctx);
		if (!currentUser) {
			throw new Error("Unauthorized");
		}

		// Get the team
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Verify organization access
		await requireOrganizationAccess(ctx, team.organizationId);

		// Get all team member IDs
		const memberIds = team.memberIds || [];

		if (memberIds.length === 0) {
			return [];
		}

		// Get all activities for team members
		const allActivities = await ctx.db
			.query("issueActivities")
			.order("desc")
			.collect();

		// Filter activities by team members and limit
		const teamActivities = allActivities
			.filter((activity) => memberIds.includes(activity.userId))
			.slice(0, args.limit || 50);

		// Populate activity data
		const populatedActivities = await Promise.all(
			teamActivities.map(async (activity) => {
				const [user, task] = await Promise.all([
					ctx.db.get(activity.userId),
					ctx.db.get(activity.issueId),
				]);

				// Get project info if task exists
				let project = null;
				if (task?.projectId) {
					project = await ctx.db.get(task.projectId);
				}

				return {
					...activity,
					user,
					task,
					project,
				};
			}),
		);

		return populatedActivities;
	},
});

// Get files for all team projects
export const getTeamFiles = query({
	args: {
		teamId: v.id("constructionTeams"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const currentUser = await getCurrentUser(ctx);
		if (!currentUser) {
			throw new Error("Unauthorized");
		}

		// Get the team
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Verify organization access
		await requireOrganizationAccess(ctx, team.organizationId);

		// Get all project IDs for the team
		const projectIds = team.projectIds || [];

		if (projectIds.length === 0) {
			return [];
		}

		// Get all attachments for team projects
		const allAttachments = await ctx.db
			.query("issueAttachments")
			.order("desc")
			.collect();

		// Get all issues for team projects
		const projectIssues = await ctx.db
			.query("issues")
			.filter((q) => q.eq(q.field("isConstructionTask"), true))
			.collect();

		// Filter issues by team projects
		const teamProjectIssues = projectIssues.filter(
			(issue) => issue.projectId && projectIds.includes(issue.projectId),
		);

		const teamIssueIds = teamProjectIssues.map((issue) => issue._id);

		// Filter attachments by team project issues
		const teamAttachments = allAttachments
			.filter((attachment) => teamIssueIds.includes(attachment.issueId))
			.slice(0, args.limit || 100);

		// Populate attachment data
		const populatedAttachments = await Promise.all(
			teamAttachments.map(async (attachment) => {
				const [uploader, issue] = await Promise.all([
					attachment.uploadedBy ? ctx.db.get(attachment.uploadedBy) : null,
					ctx.db.get(attachment.issueId),
				]);

				// Get project from issue
				let project = null;
				const task = issue;
				if (issue?.projectId) {
					project = await ctx.db.get(issue.projectId);
				}

				return {
					...attachment,
					uploader,
					project,
					task,
				};
			}),
		);

		return populatedAttachments;
	},
});

// Update team settings
export const update = mutation({
	args: {
		teamId: v.id("constructionTeams"),
		name: v.string(),
		department: v.union(
			v.literal("design"),
			v.literal("construction"),
			v.literal("engineering"),
			v.literal("management"),
		),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Verify user has access to this organization
		await requireOrganizationAccess(ctx, team.organizationId);

		// Update the team
		await ctx.db.patch(args.teamId, {
			name: args.name,
			department: args.department,
			shortName: args.name.substring(0, 3).toUpperCase(),
		});

		return { success: true };
	},
});

// Get projects assigned to a team
export const getTeamProjects = query({
	args: { teamId: v.id("constructionTeams") },
	handler: async (ctx, args) => {
		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
		}

		// Verify organization access
		await requireOrganizationAccess(ctx, team.organizationId);

		// Get all projects
		const allProjects = await ctx.db.query("constructionProjects").collect();

		// Filter projects where team is involved
		const teamProjects = allProjects.filter(
			(project) =>
				// Team is in project's teamIds
				team.projectIds.includes(project._id) ||
				// Team members are project lead
				(team.memberIds || []).includes(project.leadId) ||
				// Team members are in project team
				(project.teamMemberIds || []).some((memberId) =>
					(team.memberIds || []).includes(memberId),
				),
		);

		// Get statuses
		const statuses = await ctx.db.query("status").collect();
		const statusMap = new Map(statuses.map((s) => [s._id, s]));

		// Enrich projects with statistics
		const enrichedProjects = await Promise.all(
			teamProjects.map(async (project) => {
				// Get project tasks
				const projectTasks = await ctx.db
					.query("issues")
					.filter((q) =>
						q.and(
							q.eq(q.field("isConstructionTask"), true),
							q.eq(q.field("projectId"), project._id),
						),
					)
					.collect();

				// Calculate statistics
				const doneStatus = statuses.find(
					(s) =>
						s.name.toLowerCase() === "done" ||
						s.name.toLowerCase() === "completed" ||
						s.name.toLowerCase() === "выполнено",
				);

				const completedTasks = doneStatus
					? projectTasks.filter((t) => t.statusId === doneStatus._id).length
					: 0;

				const totalTasks = projectTasks.length;
				const progress =
					totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

				// Get team member count
				const allTeamMembers = [
					...new Set([project.leadId, ...(project.teamMemberIds || [])]),
				];

				return {
					_id: project._id,
					name: project.name,
					client: project.client,
					status: project.statusId ? statusMap.get(project.statusId) : null,
					dueDate: project.targetDate,
					progress,
					totalTasks,
					completedTasks,
					teamMemberCount: allTeamMembers.length,
				};
			}),
		);

		return enrichedProjects;
	},
});
