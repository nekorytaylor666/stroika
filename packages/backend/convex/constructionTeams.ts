import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get team members for a specific project with task statistics
export const getProjectTeamWithStats = query({
	args: { projectId: v.id("constructionProjects") },
	handler: async (ctx, args) => {
		// Get the project
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Get all team members (including lead)
		const allMemberIds = [
			...new Set([...(project.teamMemberIds || []), project.leadId]),
		];

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

		// Calculate statistics for each member
		const teamMembers = await Promise.all(
			allMemberIds.map(async (userId) => {
				const user = await ctx.db.get(userId);
				if (!user) return null;

				// Get all tasks assigned to this user
				const userTasks = projectTasks.filter(
					(task) => task.assigneeId === userId,
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

				// Get user's department/position from userDepartments table
				const userDepartment = await ctx.db
					.query("userDepartments")
					.withIndex("by_user", (q) => q.eq("userId", userId))
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
					avatarUrl: user.avatarUrl,
					isLead: user._id === project.leadId,
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
					taskStats,
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
export const addTeamMember = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Check if user already in team
		if (project.teamMemberIds?.includes(args.userId)) {
			throw new Error("User is already a team member");
		}

		// Add user to team
		await ctx.db.patch(args.projectId, {
			teamMemberIds: [...(project.teamMemberIds || []), args.userId],
		});

		return { success: true };
	},
});

// Remove member from project team
export const removeTeamMember = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Can't remove the lead
		if (project.leadId === args.userId) {
			throw new Error("Cannot remove the project lead");
		}

		// Remove user from team
		await ctx.db.patch(args.projectId, {
			teamMemberIds: (project.teamMemberIds || []).filter(
				(id) => id !== args.userId,
			),
		});

		// Unassign all tasks from this user in this project
		const userTasks = await ctx.db
			.query("issues")
			.filter((q) =>
				q.and(
					q.eq(q.field("isConstructionTask"), true),
					q.eq(q.field("projectId"), args.projectId),
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

		return { success: true, unassignedTasks: userTasks.length };
	},
});

// Get all teams (existing function remains)
export const getAll = query({
	handler: async (ctx) => {
		const teams = await ctx.db.query("constructionTeams").collect();

		// Enrich with member and project data
		const enrichedTeams = await Promise.all(
			teams.map(async (team) => {
				const members = await Promise.all(
					team.memberIds.map((id) => ctx.db.get(id)),
				);
				const projects = await Promise.all(
					team.projectIds.map((id) => ctx.db.get(id)),
				);

				return {
					...team,
					members: members.filter(Boolean),
					projects: projects.filter(Boolean),
				};
			}),
		);

		return enrichedTeams;
	},
});
