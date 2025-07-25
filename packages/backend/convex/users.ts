import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get current authenticated user
export const viewer = query({
	handler: async (ctx) => {
		const userId = await auth.getUserId(ctx);
		if (!userId) {
			return null;
		}

		// Get user by ID
		const user = await ctx.db.get(userId);
		return user;
	},
});

// Queries
export const getAll = query({
	handler: async (ctx) => {
		return await ctx.db.query("users").collect();
	},
});

// Alias for getAll for compatibility
export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("users").collect();
	},
});

export const getById = query({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();
	},
});

export const getUsersWithRoles = query({
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();

		const usersWithRoles = await Promise.all(
			users.map(async (user) => {
				const role = user.roleId ? await ctx.db.get(user.roleId) : null;
				return {
					...user,
					role: role ? role.displayName : null,
					roleName: role ? role.name : null,
				};
			}),
		);

		return usersWithRoles;
	},
});

export const getByStatus = query({
	args: {
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("status"), args.status))
			.collect();
	},
});

export const searchUsers = query({
	args: { searchTerm: v.string() },
	handler: async (ctx, args) => {
		const allUsers = await ctx.db.query("users").collect();
		const searchTerm = args.searchTerm.toLowerCase();

		return allUsers.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm) ||
				user.email.toLowerCase().includes(searchTerm) ||
				(user.position && user.position.toLowerCase().includes(searchTerm)),
		);
	},
});

// Mutations
export const create = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		avatarUrl: v.string(),
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
		roleId: v.optional(v.id("roles")),
		joinedDate: v.string(),
		teamIds: v.array(v.string()),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		authId: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("users", {
			...args,
			isActive: args.isActive ?? true,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
		),
		roleId: v.optional(v.id("roles")),
		teamIds: v.optional(v.array(v.string())),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { id, ...updates } = args;
		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("users"),
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, { status: args.status });
		return { success: true };
	},
});

export const deleteUser = mutation({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
		return { success: true };
	},
});

export const updateUserRole = mutation({
	args: {
		userId: v.id("users"),
		roleId: v.id("roles"),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.userId, { roleId: args.roleId });
		return { success: true };
	},
});
