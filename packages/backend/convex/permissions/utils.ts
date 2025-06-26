import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { PermissionAction, PermissionResource } from "./types";

export async function checkPermission(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	resource: PermissionResource,
	action: PermissionAction,
): Promise<boolean> {
	// Get user with role
	const user = await ctx.db.get(userId);
	if (!user || !user.isActive) {
		return false;
	}

	// Check user-specific permissions first (overrides)
	const userPermissions = await ctx.db
		.query("userPermissions")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const userPerm of userPermissions) {
		const permission = await ctx.db.get(userPerm.permissionId);
		if (
			permission &&
			permission.resource === resource &&
			permission.action === action
		) {
			// Check if permission is not expired
			if (userPerm.expiresAt && new Date(userPerm.expiresAt) < new Date()) {
				continue;
			}
			return userPerm.granted;
		}
	}

	// If no user-specific permission, check role permissions
	if (!user.roleId) {
		return false;
	}

	const rolePermissions = await ctx.db
		.query("rolePermissions")
		.withIndex("by_role", (q) => q.eq("roleId", user.roleId!))
		.collect();

	for (const rolePerm of rolePermissions) {
		const permission = await ctx.db.get(rolePerm.permissionId);
		if (
			permission &&
			permission.resource === resource &&
			permission.action === action
		) {
			return true;
		}
	}

	// Check for "manage" permission on the resource (grants all actions)
	for (const rolePerm of rolePermissions) {
		const permission = await ctx.db.get(rolePerm.permissionId);
		if (
			permission &&
			permission.resource === resource &&
			permission.action === "manage"
		) {
			return true;
		}
	}

	return false;
}

export async function getUserPermissions(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<Array<{ resource: PermissionResource; action: PermissionAction }>> {
	const user = await ctx.db.get(userId);
	if (!user || !user.isActive) {
		return [];
	}

	const permissions: Array<{
		resource: PermissionResource;
		action: PermissionAction;
	}> = [];
	const processedPermissions = new Set<string>();

	// Get user-specific permissions
	const userPermissions = await ctx.db
		.query("userPermissions")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const userPerm of userPermissions) {
		const permission = await ctx.db.get(userPerm.permissionId);
		if (permission) {
			const key = `${permission.resource}:${permission.action}`;

			// Skip expired permissions
			if (userPerm.expiresAt && new Date(userPerm.expiresAt) < new Date()) {
				continue;
			}

			if (userPerm.granted) {
				permissions.push({
					resource: permission.resource as PermissionResource,
					action: permission.action as PermissionAction,
				});
			}
			processedPermissions.add(key);
		}
	}

	// Get role permissions (if not overridden by user permissions)
	if (user.roleId) {
		const rolePermissions = await ctx.db
			.query("rolePermissions")
			.withIndex("by_role", (q) => q.eq("roleId", user.roleId!))
			.collect();

		for (const rolePerm of rolePermissions) {
			const permission = await ctx.db.get(rolePerm.permissionId);
			if (permission) {
				const key = `${permission.resource}:${permission.action}`;

				if (!processedPermissions.has(key)) {
					permissions.push({
						resource: permission.resource as PermissionResource,
						action: permission.action as PermissionAction,
					});
				}
			}
		}
	}

	return permissions;
}

export async function requirePermission(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	resource: PermissionResource,
	action: PermissionAction,
): Promise<void> {
	const hasPermission = await checkPermission(ctx, userId, resource, action);
	if (!hasPermission) {
		throw new Error(
			`Unauthorized: Missing permission for ${action} on ${resource}`,
		);
	}
}

// Helper to log permission changes
export async function logPermissionChange(
	ctx: MutationCtx,
	userId: Id<"users">,
	action: string,
	targetUserId?: Id<"users">,
	targetRoleId?: Id<"roles">,
	details?: any,
): Promise<void> {
	await ctx.db.insert("permissionAuditLog", {
		userId,
		targetUserId,
		targetRoleId,
		action,
		details: details ? JSON.stringify(details) : undefined,
		createdAt: new Date().toISOString(),
	});
}

// Mutations for managing permissions

export const updateRolePermissions = mutation({
	args: {
		roleId: v.id("roles"),
		permissionIds: v.array(v.id("permissions")),
	},
	handler: async (ctx, args) => {
		// TODO: Check if current user has permission to manage roles
		// const userId = await getCurrentUserId(ctx);
		// await requirePermission(ctx, userId, "roles", "manage");

		// Get existing role permissions
		const existingPermissions = await ctx.db
			.query("rolePermissions")
			.withIndex("by_role", (q) => q.eq("roleId", args.roleId))
			.collect();

		// Delete all existing permissions
		for (const perm of existingPermissions) {
			await ctx.db.delete(perm._id);
		}

		// Add new permissions
		for (const permissionId of args.permissionIds) {
			await ctx.db.insert("rolePermissions", {
				roleId: args.roleId,
				permissionId,
				createdAt: new Date().toISOString(),
			});
		}

		// Log the change
		// await logPermissionChange(ctx, userId, "updateRolePermissions", undefined, args.roleId, {
		// 	oldPermissions: existingPermissions.map(p => p.permissionId),
		// 	newPermissions: args.permissionIds,
		// });

		return { success: true };
	},
});

export const grantUserPermission = mutation({
	args: {
		userId: v.id("users"),
		permissionId: v.id("permissions"),
		type: v.union(v.literal("grant"), v.literal("revoke")),
		expiresAt: v.optional(v.string()),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// TODO: Check if current user has permission to manage user permissions
		// const currentUserId = await getCurrentUserId(ctx);
		// await requirePermission(ctx, currentUserId, "permissions", "manage");

		// Check if user permission already exists
		const existingUserPermissions = await ctx.db
			.query("userPermissions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		const existingPerm = existingUserPermissions.find(
			(up) => up.permissionId === args.permissionId,
		);

		if (existingPerm) {
			// Update existing permission
			await ctx.db.patch(existingPerm._id, {
				granted: args.type === "grant",
				expiresAt: args.expiresAt,
			});
		} else {
			// Create new user permission
			await ctx.db.insert("userPermissions", {
				userId: args.userId,
				permissionId: args.permissionId,
				granted: args.type === "grant",
				expiresAt: args.expiresAt,
				createdAt: new Date().toISOString(),
			});
		}

		// Log the change
		// await logPermissionChange(ctx, currentUserId, "grantUserPermission", args.userId, undefined, {
		// 	permissionId: args.permissionId,
		// 	type: args.type,
		// 	expiresAt: args.expiresAt,
		// 	reason: args.reason,
		// });

		return { success: true };
	},
});

export const revokeUserPermission = mutation({
	args: {
		userPermissionId: v.id("userPermissions"),
	},
	handler: async (ctx, args) => {
		// TODO: Check if current user has permission to manage user permissions
		// const currentUserId = await getCurrentUserId(ctx);
		// await requirePermission(ctx, currentUserId, "permissions", "manage");

		const userPermission = await ctx.db.get(args.userPermissionId);
		if (!userPermission) {
			throw new Error("User permission not found");
		}

		await ctx.db.delete(args.userPermissionId);

		// Log the change
		// await logPermissionChange(ctx, currentUserId, "revokeUserPermission", userPermission.userId, undefined, {
		// 	permissionId: userPermission.permissionId,
		// });

		return { success: true };
	},
});
