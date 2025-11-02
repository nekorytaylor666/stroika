import { type ToolCtx, createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// Define custom context type with userId and organizationId
export type AgentContext = ToolCtx & {
	userId: Id<"users">;
	organizationId: Id<"organizations">;
};

// Tool: Create Construction Project
export const createProjectTool = (
	userId: Id<"users">,
	organizationId: Id<"organizations">,
) =>
	createTool({
		description: "Create a new construction project",
		args: z.object({
			name: z.string().describe("Project name"),
			client: z.string().describe("Client name"),
			startDate: z
				.string()
				.describe("Project start date (ISO format or YYYY-MM-DD)"),
			targetDate: z.string().optional().describe("Target completion date"),
			contractValue: z
				.number()
				.optional()
				.default(0)
				.describe("Contract value in currency"),
			location: z.string().optional().default("").describe("Project location"),
			projectType: z
				.enum(["residential", "commercial", "industrial", "infrastructure"])
				.optional()
				.default("commercial")
				.describe("Type of construction project"),
			notes: z.string().optional().describe("Project notes"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			projectId: Id<"constructionProjects">;
			name: string;
			client: string;
			message: string;
		}> => {
			// Parse dates
			const parseDate = (dateString: string): string => {
				const date = new Date(dateString);
				if (Number.isNaN(date.getTime())) {
					throw new Error(`Invalid date format: ${dateString}`);
				}
				return date.toISOString();
			};

			// Get default status and priority from the database
			const statuses = await toolCtx.runQuery(api.status.getAll);
			const defaultStatus =
				statuses.find(
					(s) => s.name === "Planned" || s.name === "Not Started",
				) || statuses[0];

			const priorities = await toolCtx.runQuery(api.priorities.getAll);
			const defaultPriority =
				priorities.find((p) => p.name === "Medium") || priorities[0];

			// Use current user as default lead
			const leadId = userId;

			// Use first status as health status or create a simple default
			const healthStatus =
				statuses.find((s) => s.name === "Good") || defaultStatus;

			// Create the project using the real mutation
			const projectId = await toolCtx.runMutation(
				api.constructionProjects.create,
				{
					name: args.name,
					client: args.client,
					statusId: defaultStatus._id,
					iconName: "Building",
					percentComplete: 0,
					contractValue: args.contractValue || 0,
					startDate: parseDate(args.startDate),
					targetDate: args.targetDate ? parseDate(args.targetDate) : undefined,
					leadId: leadId,
					priorityId: defaultPriority._id,
					healthId: healthStatus._id,
					healthName: healthStatus.name,
					healthColor: healthStatus.color || "#00ff00",
					healthDescription: healthStatus.description || "Good",
					location: args.location || "",
					projectType: args.projectType || "commercial",
					notes: args.notes,
					teamMemberIds: [leadId],
				},
			);

			return {
				projectId,
				name: args.name,
				client: args.client,
				message: `Successfully created project "${args.name}" for client "${args.client}"`,
			};
		},
	});

// Tool: Create Task
export const createTaskTool = (userId: string, organizationId: string) =>
	createTool({
		description:
			"Create a new construction task, optionally linked to a project",
		args: z.object({
			title: z.string().describe("Task title"),
			description: z
				.string()
				.optional()
				.default("")
				.describe("Task description"),
			projectId: z.string().optional().describe("Project name to link task to"),
			assigneeId: z
				.string()
				.optional()
				.describe("Name of person to assign task to"),
			dueDate: z
				.string()
				.optional()
				.describe("Due date (ISO format or YYYY-MM-DD)"),
			parentTaskId: z
				.string()
				.optional()
				.describe(
					"Parent task identifier for subtasks. Use task id and not identifier. If no parent task, leave blank.",
				),
			priorityId: z.string().describe("Priority ID"),
			statusId: z.string().describe("Status ID"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			taskId: Id<"issues">;
			title: string;
			message: string;
		}> => {
			// Find parent task if specified

			// Parse due date
			const parseDate = (
				dateString: string | undefined,
			): string | undefined => {
				if (!dateString) return undefined;
				const date = new Date(dateString);
				if (Number.isNaN(date.getTime())) {
					throw new Error(`Invalid date format: ${dateString}`);
				}
				return date.toISOString();
			};

			// Create the task
			const taskId = await toolCtx.runMutation(
				api.constructionTasks.createAgentTask,
				{
					title: args.title,
					description: args.description || "",
					statusId: args.statusId,
					assigneeId: args.assigneeId,
					priorityId: args.priorityId,
					labelIds: [],
					projectId: args.projectId,
					rank: Date.now().toString(),
					dueDate: parseDate(args.dueDate),
					parentTaskId: args.parentTaskId,
					userId: userId,
					organizationId: organizationId,
				},
			);

			return {
				taskId,
				title: args.title,
				message: `Successfully created task "${args.title}" with ID ${taskId}`,
			};
		},
	});

// Tool: Update Task Status
export const updateTaskStatusTool = (
	userId: Id<"users">,
	_organizationId: Id<"organizations">,
) =>
	createTool({
		description: "Update the status of an existing task",
		args: z.object({
			taskIdentifier: z.string().describe("Task identifier (e.g., TASK-001)"),
			statusId: z.string().describe("New status id"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			taskId: Id<"issues">;
			identifier: string;
			title: string;
			newStatus: string;
			message: string;
		}> => {
			// Find task by identifier
			const task = await toolCtx.runQuery(
				api.constructionTasks.getByIdentifier,
				{
					identifier: args.taskIdentifier,
				},
			);
			if (!task) {
				throw new Error(`Task "${args.taskIdentifier}" not found`);
			}

			// Update using the real mutation
			await toolCtx.runMutation(api.constructionTasks.updateStatus, {
				id: task._id,
				statusId: args.statusId,
				userId: userId,
			});

			return {
				taskId: task._id,
				identifier: task.identifier,
				title: task.title,
				newStatus: args.statusId,
				message: `Successfully updated status of task ${args.taskIdentifier} to "${args.statusId}"`,
			};
		},
	});

// Tool: Assign Task
export const assignTaskTool = (
	_userId: Id<"users">,
	_organizationId: Id<"organizations">,
) =>
	createTool({
		description: "Assign a task to a team member",
		args: z.object({
			taskIdentifier: z.string().describe("Task identifier (e.g., TASK-001)"),
			assigneeName: z.string().describe("Name of person to assign task to"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			taskId: Id<"issues">;
			identifier: string;
			title: string;
			assignee: string;
			message: string;
		}> => {
			// Find task by identifier
			const task = await toolCtx.runQuery(
				api.constructionTasks.getByIdentifier,
				{
					identifier: args.taskIdentifier,
				},
			);
			if (!task) {
				throw new Error(`Task "${args.taskIdentifier}" not found`);
			}

			// Find assignee by name
			const users = await toolCtx.runQuery(api.users.getAll);
			const assignee = users.find((u) => u.name === args.assigneeName);
			if (!assignee) {
				throw new Error(`User "${args.assigneeName}" not found`);
			}

			// Update using the real mutation
			await toolCtx.runMutation(api.constructionTasks.updateAssignee, {
				id: task._id,
				assigneeId: assignee._id,
			});

			return {
				taskId: task._id,
				identifier: task.identifier,
				title: task.title,
				assignee: args.assigneeName,
				message: `Successfully assigned task ${args.taskIdentifier} to ${args.assigneeName}`,
			};
		},
	});

// Tool: Update Task Priority
export const updateTaskPriorityTool = (
	userId: Id<"users">,
	_organizationId: Id<"organizations">,
) =>
	createTool({
		description: "Update the priority of an existing task",
		args: z.object({
			taskIdentifier: z.string().describe("Task identifier (e.g., TASK-001)"),
			priorityName: z.string().describe("New priority name"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			taskId: Id<"issues">;
			identifier: string;
			title: string;
			newPriority: string;
			message: string;
		}> => {
			// Find task by identifier
			const task = await toolCtx.runQuery(
				api.constructionTasks.getByIdentifier,
				{
					identifier: args.taskIdentifier,
				},
			);
			if (!task) {
				throw new Error(`Task "${args.taskIdentifier}" not found`);
			}

			// Find priority by name
			const priorities = await toolCtx.runQuery(api.priorities.getAll);
			const priority = priorities.find((p) => p.name === args.priorityName);
			if (!priority) {
				throw new Error(`Priority "${args.priorityName}" not found`);
			}

			// Update using the real mutation
			await toolCtx.runMutation(api.constructionTasks.updatePriority, {
				id: task._id,
				priorityId: priority._id,
				userId: userId,
			});

			return {
				taskId: task._id,
				identifier: task.identifier,
				title: task.title,
				newPriority: args.priorityName,
				message: `Successfully updated priority of task ${args.taskIdentifier} to "${args.priorityName}"`,
			};
		},
	});

// Tool: Get Project Details
export const getProjectDetailsTool = (
	_userId: Id<"users">,
	_organizationId: Id<"organizations">,
) =>
	createTool({
		description: "Get detailed information about a project including its tasks",
		args: z.object({
			projectName: z.string().describe("Project name"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			project: {
				id: Id<"constructionProjects">;
				name: string;
				client: string;
				status: string;
				priority: string;
				lead: string;
				percentComplete: number;
				contractValue: number;
				startDate: string;
				targetDate?: string;
				location: string;
				projectType: string;
				taskCount: number;
			};
			tasks: Array<{
				identifier: string;
				title: string;
				status: string;
			}>;
		}> => {
			// Find project by name
			const projects = await toolCtx.runQuery(api.constructionProjects.getAll);
			const project = projects.find((p) => p.name === args.projectName);
			if (!project) {
				throw new Error(`Project "${args.projectName}" not found`);
			}

			// Get detailed project info
			const projectDetails = await toolCtx.runQuery(
				api.constructionProjects.getById,
				{
					id: project._id,
				},
			);

			// Get tasks for this project
			const allTasks = await toolCtx.runQuery(api.constructionTasks.getAll);
			const projectTasks = allTasks.filter((t) => t.projectId === project._id);

			return {
				project: {
					id: project._id,
					name: project.name,
					client: project.client,
					status: projectDetails.status?.name || "Unknown",
					priority: projectDetails.priority?.name || "Unknown",
					lead: projectDetails.lead?.name || "Unknown",
					percentComplete: project.percentComplete,
					contractValue: project.contractValue,
					startDate: project.startDate,
					targetDate: project.targetDate,
					location: project.location,
					projectType: project.projectType,
					taskCount: projectTasks.length,
				},
				tasks: projectTasks.map((t) => ({
					identifier: t.identifier,
					title: t.title,
					status: t.status?.name || "Unknown",
				})),
			};
		},
	});

// Tool: List Projects by Status
export const listProjectsByStatusTool = (
	_userId: Id<"users">,
	_organizationId: Id<"organizations">,
) =>
	createTool({
		description: "List all projects, optionally filtered by status",
		args: z.object({
			statusName: z.string().optional().describe("Status name to filter by"),
		}),
		handler: async (
			toolCtx: ToolCtx,
			args,
		): Promise<{
			count: number;
			projects: Array<{
				id: Id<"constructionProjects">;
				name: string;
				client: string;
				status: string;
				lead: string;
				percentComplete: number;
				contractValue: number;
			}>;
		}> => {
			// Get all projects
			let projects = await toolCtx.runQuery(api.constructionProjects.getAll);

			// Filter by status if specified
			if (args.statusName) {
				const statuses = await toolCtx.runQuery(api.status.getAll);
				const status = statuses.find((s) => s.name === args.statusName);
				if (!status) {
					throw new Error(`Status "${args.statusName}" not found`);
				}
				projects = projects.filter((p) => p.statusId === status._id);
			}

			// Get detailed info for each project
			const projectsWithDetails = await Promise.all(
				projects.map(async (project) => {
					const details = await toolCtx.runQuery(
						api.constructionProjects.getById,
						{
							id: project._id,
						},
					);
					return {
						id: project._id,
						name: project.name,
						client: project.client,
						status: details.status?.name || "Unknown",
						lead: details.lead?.name || "Unknown",
						percentComplete: project.percentComplete,
						contractValue: project.contractValue,
					};
				}),
			);

			return {
				count: projectsWithDetails.length,
				projects: projectsWithDetails,
			};
		},
	});

// Factory function to create all tools with userId and organizationId
export const createAgentTools = (userId: string, organizationId: string) => [
	createProjectTool(userId, organizationId),
	createTaskTool(userId, organizationId),
	updateTaskStatusTool(userId, organizationId),
	assignTaskTool(userId, organizationId),
	updateTaskPriorityTool(userId, organizationId),
	getProjectDetailsTool(userId, organizationId),
	listProjectsByStatusTool(userId, organizationId),
];
