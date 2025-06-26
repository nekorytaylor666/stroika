import { v } from "convex/values";
import { query } from "../_generated/server";

export const getAllRoles = query({
	handler: async (ctx) => {
		return await ctx.db.query("roles").collect();
	},
});

export const getAllPermissions = query({
	handler: async (ctx) => {
		return await ctx.db.query("permissions").collect();
	},
});

export const getAllRolePermissions = query({
	handler: async (ctx) => {
		return await ctx.db.query("rolePermissions").collect();
	},
});

export const getAllUserPermissions = query({
	handler: async (ctx) => {
		return await ctx.db.query("userPermissions").collect();
	},
});

export const getAllOrganizationalPositions = query({
	handler: async (ctx) => {
		return await ctx.db.query("organizationalPositions").collect();
	},
});

export const getRecentAuditLog = query({
	handler: async (ctx) => {
		return await ctx.db.query("permissionAuditLog").order("desc").take(50);
	},
});

export const getUserPermissions = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		// Get user
		const user = await ctx.db.get(args.userId);
		if (!user) return { role: null, permissions: [] };

		// Get user's role permissions
		const rolePermissions = user.roleId
			? await ctx.db
					.query("rolePermissions")
					.withIndex("by_role", (q) => q.eq("roleId", user.roleId!))
					.collect()
			: [];

		// Get user's individual permissions
		const userPermissions = await ctx.db
			.query("userPermissions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		// Get role details
		const role = user.roleId ? await ctx.db.get(user.roleId) : null;

		// Get all permission details
		const permissionIds = [
			...rolePermissions.map((rp) => rp.permissionId),
			...userPermissions.map((up) => up.permissionId),
		];
		const uniquePermissionIds = [...new Set(permissionIds)];
		const permissions = await Promise.all(
			uniquePermissionIds.map((id) => ctx.db.get(id)),
		);

		return {
			role,
			rolePermissions: rolePermissions.map((rp) => ({
				...rp,
				permission: permissions.find((p) => p?._id === rp.permissionId),
			})),
			userPermissions: userPermissions.map((up) => ({
				...up,
				permission: permissions.find((p) => p?._id === up.permissionId),
			})),
		};
	},
});
