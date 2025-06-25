import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Queries
export const getAll = query({
    handler: async (ctx) => {
        const tasks = await ctx.db
            .query("issues")
            .withIndex("by_construction", (q) => q.eq("isConstructionTask", true))
            .collect();

        // Populate related data
        const populatedTasks = await Promise.all(
            tasks.map(async (task) => {
                const [status, assignee, priority, labels] = await Promise.all([
                    ctx.db.get(task.statusId),
                    task.assigneeId ? ctx.db.get(task.assigneeId) : null,
                    ctx.db.get(task.priorityId),
                    Promise.all(task.labelIds.map(id => ctx.db.get(id))),
                ]);

                return {
                    ...task,
                    status,
                    assignee,
                    priority,
                    labels: labels.filter(label => label !== null),
                };
            })
        );

        return populatedTasks;
    },
});

export const getById = query({
    args: { id: v.id("issues") },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task || !task.isConstructionTask) return null;

        const [status, assignee, priority, labels] = await Promise.all([
            ctx.db.get(task.statusId),
            task.assigneeId ? ctx.db.get(task.assigneeId) : null,
            ctx.db.get(task.priorityId),
            Promise.all(task.labelIds.map(id => ctx.db.get(id))),
        ]);

        return {
            ...task,
            status,
            assignee,
            priority,
            labels: labels.filter(label => label !== null),
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
    args: { assigneeId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("issues")
            .withIndex("by_assignee", (q) => q.eq("assigneeId", args.assigneeId))
            .filter((q) => q.eq(q.field("isConstructionTask"), true))
            .collect();
    },
});

export const getByProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("issues")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .filter((q) => q.eq(q.field("isConstructionTask"), true))
            .collect();
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
        return allTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.identifier.toLowerCase().includes(searchTerm)
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

        const groupedTasks = statuses.map(status => ({
            status,
            tasks: tasks.filter(task => task.statusId === status._id),
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

        const currentDate = new Date().toISOString().split('T')[0];

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
                stats.byPriority[priority.name] = (stats.byPriority[priority.name] || 0) + 1;
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
        statusId: v.id("status"),
        assigneeId: v.optional(v.id("users")),
        priorityId: v.id("priorities"),
        labelIds: v.array(v.id("labels")),
        cycleId: v.string(),
        projectId: v.optional(v.id("projects")),
        rank: v.string(),
        dueDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const taskData = {
            ...args,
            createdAt: new Date().toISOString(),
            isConstructionTask: true,
        };

        return await ctx.db.insert("issues", taskData);
    },
});

export const update = mutation({
    args: {
        id: v.id("issues"),
        identifier: v.optional(v.string()),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        statusId: v.optional(v.id("status")),
        assigneeId: v.optional(v.id("users")),
        priorityId: v.optional(v.id("priorities")),
        labelIds: v.optional(v.array(v.id("labels"))),
        cycleId: v.optional(v.string()),
        projectId: v.optional(v.id("projects")),
        rank: v.optional(v.string()),
        dueDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
        return { success: true };
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("issues"),
        statusId: v.id("status"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { statusId: args.statusId });
        return { success: true };
    },
});

export const updateAssignee = mutation({
    args: {
        id: v.id("issues"),
        assigneeId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { assigneeId: args.assigneeId });
        return { success: true };
    },
});

export const updatePriority = mutation({
    args: {
        id: v.id("issues"),
        priorityId: v.id("priorities"),
    },
    handler: async (ctx, args) => {
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

        const updatedLabelIds = task.labelIds.filter(id => id !== args.labelId);
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
            rank: args.newRank
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