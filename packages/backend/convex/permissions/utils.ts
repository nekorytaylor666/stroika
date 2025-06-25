import type { Id } from "../_generated/dataModel";
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
