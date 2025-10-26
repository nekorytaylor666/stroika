import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

// Query to get all subtasks of a task
export const getSubtasks = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const subtasks = await ctx.db
			.query("issues")
			.withIndex("by_parent_task", (q) => q.eq("parentTaskId", args.taskId))
			.collect();

		// Fetch additional data for each subtask
		const subtasksWithData = await Promise.all(
			subtasks.map(async (subtask) => {
				const [status, priority, assignee, labels] = await Promise.all([
					ctx.db.get(subtask.statusId),
					ctx.db.get(subtask.priorityId),
					subtask.assigneeId ? ctx.db.get(subtask.assigneeId) : null,
					Promise.all(subtask.labelIds.map((id) => ctx.db.get(id))),
				]);

				// Get subtask count for each subtask
				const childSubtasks = await ctx.db
					.query("issues")
					.withIndex("by_parent_task", (q) => q.eq("parentTaskId", subtask._id))
					.collect();

				return {
					...subtask,
					status,
					priority,
					assignee,
					labels: labels.filter(Boolean),
					subtaskCount: childSubtasks.length,
				};
			}),
		);

		return subtasksWithData;
	},
});

// Query to check if a task has subtasks
export const hasSubtasks = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const subtasks = await ctx.db
			.query("issues")
			.withIndex("by_parent_task", (q) => q.eq("parentTaskId", args.taskId))
			.first();
		return subtasks !== null;
	},
});

// Mutation to create a subtask
export const createSubtask = mutation({
	args: {
		parentTaskId: v.id("issues"),
		title: v.string(),
		description: v.string(),
		statusId: v.id("status"),
		assigneeId: v.optional(v.id("users")),
		priorityId: v.id("priorities"),
		labelIds: v.array(v.id("labels")),
		projectId: v.optional(v.id("constructionProjects")),
		dueDate: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get parent task to inherit some properties
		const parentTask = await ctx.db.get(args.parentTaskId);
		if (!parentTask) {
			throw new Error("Parent task not found");
		}

		// Generate identifier for subtask
		const allTasks = await ctx.db.query("issues").collect();
		const identifiers = allTasks.map((task) => task.identifier);

		let identifier: string;
		if (parentTask.isConstructionTask) {
			let num = Math.floor(Math.random() * 999);
			identifier = `СТРФ-${num.toString().padStart(3, "0")}`;
			while (identifiers.includes(identifier)) {
				num = Math.floor(Math.random() * 999);
				identifier = `СТРФ-${num.toString().padStart(3, "0")}`;
			}
		} else {
			let num = Math.floor(Math.random() * 999);
			identifier = `STRK-${num.toString().padStart(3, "0")}`;
			while (identifiers.includes(identifier)) {
				num = Math.floor(Math.random() * 999);
				identifier = `STRK-${num.toString().padStart(3, "0")}`;
			}
		}

		// Get the organization from parent task
		if (!parentTask.organizationId) {
			throw new Error("Parent task has no organizationId");
		}

		// Create the subtask
		const subtaskId = await ctx.db.insert("issues", {
			organizationId: parentTask.organizationId,
			identifier,
			title: args.title,
			description: args.description,
			statusId: args.statusId,
			assigneeId: args.assigneeId,
			priorityId: args.priorityId,
			labelIds: args.labelIds,
			createdAt: new Date().toISOString(),
			cycleId: parentTask.cycleId,
			projectId: args.projectId || parentTask.projectId,
			rank: `rank-${Date.now()}`,
			dueDate: args.dueDate,
			isConstructionTask: parentTask.isConstructionTask,
			parentTaskId: args.parentTaskId,
		});

		return subtaskId;
	},
});

// Mutation to convert an existing task to a subtask
export const convertToSubtask = mutation({
	args: {
		taskId: v.id("issues"),
		parentTaskId: v.id("issues"),
	},
	handler: async (ctx, args) => {
		// Prevent self-parenting
		if (args.taskId === args.parentTaskId) {
			throw new Error("A task cannot be its own parent");
		}

		// Check for circular dependencies
		const wouldCreateCircle = await checkCircularDependency(
			ctx,
			args.parentTaskId,
			args.taskId,
		);
		if (wouldCreateCircle) {
			throw new Error("This would create a circular dependency");
		}

		// Update the task to set its parent
		await ctx.db.patch(args.taskId, {
			parentTaskId: args.parentTaskId,
		});

		return true;
	},
});

// Mutation to remove subtask relationship (make it a top-level task)
export const removeFromParent = mutation({
	args: {
		taskId: v.id("issues"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.taskId, {
			parentTaskId: undefined,
		});

		return true;
	},
});

// Helper function to check for circular dependencies
async function checkCircularDependency(
	ctx: any,
	potentialParentId: string,
	childId: string,
): Promise<boolean> {
	let currentId: string | undefined = potentialParentId;
	const visited = new Set<string>();

	while (currentId) {
		// If we've seen this ID before, there's a cycle
		if (visited.has(currentId)) {
			return true;
		}

		// If the current ID is the child we're trying to add, it would create a cycle
		if (currentId === childId) {
			return true;
		}

		visited.add(currentId);

		// Get the parent of the current task
		const currentTask: Doc<"issues"> | null = await ctx.db.get(
			currentId as Id<"issues">,
		);
		currentId = currentTask?.parentTaskId;
	}

	return false;
}

// Query to get the full task hierarchy (parent and all ancestors)
export const getTaskHierarchy = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const hierarchy: Doc<"issues">[] = [];
		let currentId: Id<"issues"> | undefined = args.taskId;

		while (currentId) {
			const task: Doc<"issues"> | null = await ctx.db.get(currentId);
			if (!task) break;

			hierarchy.unshift(task); // Add to beginning to maintain parent -> child order
			currentId = task.parentTaskId;
		}

		return hierarchy;
	},
});

// Query to get task progress based on subtasks
export const getTaskProgress = query({
	args: { taskId: v.id("issues") },
	handler: async (ctx, args) => {
		const subtasks = await ctx.db
			.query("issues")
			.withIndex("by_parent_task", (q) => q.eq("parentTaskId", args.taskId))
			.collect();

		if (subtasks.length === 0) {
			return { total: 0, completed: 0, percentage: 0 };
		}

		// Get "Done" status
		const statuses = await ctx.db.query("status").collect();
		const doneStatus = statuses.find((s) => s.name === "завершено");

		const completed = subtasks.filter(
			(task) => doneStatus && task.statusId === doneStatus._id,
		).length;

		return {
			total: subtasks.length,
			completed,
			percentage: Math.round((completed / subtasks.length) * 100),
		};
	},
});
