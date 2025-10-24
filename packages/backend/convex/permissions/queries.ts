import { v } from "convex/values";
import { query } from "../_generated/server";
import {
	getCurrentUserWithOrganization,
	getCurrentUserWithPermissions,
	hasPermission,
	hasProjectPermission,
} from "../helpers/getCurrentUser";
import { isAdmin } from "./checks";

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

export const isCurrentUserAdmin = query({
	handler: async (ctx) => {
		const userWithOrg = await getCurrentUserWithOrganization(ctx);
		if (!userWithOrg.user || !userWithOrg.organization) {
			return false;
		}

		return await isAdmin(
			ctx,
			userWithOrg.user._id,
			userWithOrg.organization._id,
		);
	},
});

// Current user permissions using colon notation
export const getCurrentUserPermissions = query({
	handler: async (ctx) => {
		try {
			const userContext = await getCurrentUserWithPermissions(ctx);

			// Convert permissions set to array for easier frontend usage
			const permissions = Array.from(userContext.permissions);

			// Helper function to check permissions
			const hasPermissionCheck = (resource: string, action: string) => {
				if (userContext.isOwner) return true;
				return (
					userContext.permissions.has(`${resource}:${action}`) ||
					userContext.permissions.has(`${resource}:manage`)
				);
			};

			return {
				user: {
					_id: userContext.user._id,
					name: userContext.user.name,
					email: userContext.user.email,
				},
				role: userContext.role
					? {
							_id: userContext.role._id,
							name: userContext.role.name,
							displayName: userContext.role.displayName,
							isDirector: userContext.role.isDirector,
						}
					: null,
				isOwner: userContext.isOwner,
				permissions: permissions,
				// Common permission checks for easy frontend usage
				can: {
					// Members
					manageMembers:
						hasPermissionCheck("members", "manage") ||
						hasPermissionCheck("members", "invite"),
					inviteMembers: hasPermissionCheck("members", "invite"),
					removeMembers: hasPermissionCheck("members", "remove"),

					// Projects
					createProjects:
						hasPermissionCheck("projects", "create") ||
						hasPermissionCheck("constructionProjects", "create"),
					manageProjects:
						hasPermissionCheck("projects", "manage") ||
						hasPermissionCheck("constructionProjects", "manage"),
					updateProjects:
						hasPermissionCheck("projects", "update") ||
						hasPermissionCheck("constructionProjects", "update"),

					// Documents
					createDocuments: hasPermissionCheck("documents", "create"),
					manageDocuments: hasPermissionCheck("documents", "manage"),
					updateDocuments: hasPermissionCheck("documents", "update"),

					// Teams
					manageTeams: hasPermissionCheck("teams", "manage"),
					createTeams: hasPermissionCheck("teams", "create"),

					// Issues
					createIssues: hasPermissionCheck("issues", "create"),
					manageIssues: hasPermissionCheck("issues", "manage"),

					// Roles/Settings
					manageRoles: hasPermissionCheck("roles", "manage"),
					manageSettings:
						hasPermissionCheck("roles", "manage") ||
						hasPermissionCheck("permissions", "manage"),
				},
			};
		} catch {
			return null;
		}
	},
});

// Project permission check
export const checkProjectPermission = query({
	args: {
		projectId: v.id("constructionProjects"),
		operation: v.union(
			v.literal("view"),
			v.literal("edit"),
			v.literal("admin"),
		),
	},
	handler: async (ctx, args) => {
		return await hasProjectPermission(ctx, args.projectId, args.operation);
	},
});

// Check if current user has specific permission using colon notation
export const hasUserPermission = query({
	args: {
		resource: v.string(),
		action: v.string(),
	},
	handler: async (ctx, args) => {
		return await hasPermission(ctx, args.resource, args.action);
	},
});

// Debug query to see user permissions (helpful for development)
export const debugUserPermissions = query({
	handler: async (ctx) => {
		try {
			const { user, organization, membership, role } =
				await getCurrentUserWithOrganization(ctx);

			if (!role) {
				return {
					error: "No role assigned",
					user: { name: user.name, email: user.email },
				};
			}

			// Get all role permissions from database
			const rolePermissions = await ctx.db
				.query("rolePermissions")
				.withIndex("by_role", (q) => q.eq("roleId", role._id))
				.collect();

			const permissionDetails = await Promise.all(
				rolePermissions.map(async (rp) => {
					const permission = await ctx.db.get(rp.permissionId);
					return permission
						? {
								id: permission._id,
								resource: permission.resource,
								action: permission.action,
								scope: permission.scope,
								description: permission.description,
								colonNotation: `${permission.resource}:${permission.action}`,
							}
						: null;
				}),
			);

			const userContext = await getCurrentUserWithPermissions(ctx);

			return {
				user: { name: user.name, email: user.email },
				role: {
					name: role.name,
					displayName: role.displayName,
					isDirector: role.isDirector,
				},
				isOwner: organization.ownerId === user._id,
				databasePermissions: permissionDetails.filter(Boolean),
				finalPermissions: Array.from(userContext.permissions),
				// Test some common permissions
				permissionTests: {
					canInviteMembers: userContext.permissions.has("members:invite"),
					canManageDocuments: userContext.permissions.has("documents:manage"),
					canCreateProjects:
						userContext.permissions.has("projects:create") ||
						userContext.permissions.has("constructionProjects:create"),
					canManageTeams: userContext.permissions.has("teams:manage"),
					canUpdateIssues: userContext.permissions.has("issues:update"),
				},
			};
		} catch (error) {
			return { error: error.message };
		}
	},
});
