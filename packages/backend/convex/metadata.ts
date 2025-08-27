import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Labels Queries and Mutations
export const getAllLabels = query({
	handler: async (ctx) => {
		return await ctx.db.query("labels").collect();
	},
});

export const getLabelById = query({
	args: { id: v.id("labels") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getLabelsByIds = query({
	args: { ids: v.array(v.id("labels")) },
	handler: async (ctx, args) => {
		const labels = await Promise.all(
			args.ids.map((id) => ctx.db.get(id))
		);
		return labels.filter((label) => label !== null);
	},
});

export const createLabel = mutation({
	args: {
		name: v.string(),
		color: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("labels", args);
	},
});

export const updateLabel = mutation({
	args: {
		id: v.id("labels"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const deleteLabel = mutation({
	args: { id: v.id("labels") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// Priorities Queries and Mutations
export const getAllPriorities = query({
	handler: async (ctx) => {
		return await ctx.db.query("priorities").order("asc").collect();
	},
});

export const getPriorityById = query({
	args: { id: v.id("priorities") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const createPriority = mutation({
	args: {
		name: v.string(),
		level: v.number(),
		iconName: v.string(),
		color: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("priorities", args);
	},
});

export const updatePriority = mutation({
	args: {
		id: v.id("priorities"),
		name: v.optional(v.string()),
		level: v.optional(v.number()),
		iconName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const deletePriority = mutation({
	args: { id: v.id("priorities") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

// Status Queries and Mutations
export const getAllStatus = query({
	handler: async (ctx) => {
		return await ctx.db.query("status").collect();
	},
});

export const getStatusById = query({
	args: { id: v.id("status") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const createStatus = mutation({
	args: {
		name: v.string(),
		color: v.string(),
		iconName: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("status", args);
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("status"),
		name: v.optional(v.string()),
		color: v.optional(v.string()),
		iconName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const deleteStatus = mutation({
	args: { id: v.id("status") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});
