import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import { canManageMembers, isAdmin, isOrganizationOwner } from "./checks";

// Get all roles for the organization
export const getRoles = query({
	handler: async (ctx) => {
		const { organization } = await getCurrentUserWithOrganization(ctx);

		// Get organization-specific roles
		const orgRoles = await ctx.db
			.query("roles")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.collect();

		// Get system roles (applicable to all organizations)
		const systemRoles = await ctx.db
			.query("roles")
			.withIndex("by_organization", (q) => q.eq("organizationId", undefined))
			.collect();

		// Combine and sort by priority
		const allRoles = [...systemRoles, ...orgRoles].sort((a, b) => b.priority - a.priority);

		// Get permissions for each role
		const rolesWithPermissions = await Promise.all(
			allRoles.map(async (role) => {
				const rolePermissions = await ctx.db
					.query("rolePermissions")
					.withIndex("by_role", (q) => q.eq("roleId", role._id))
					.collect();

				const permissions = await Promise.all(
					rolePermissions.map(async (rp) => ctx.db.get(rp.permissionId))
				);

				return {
					...role,
					permissions: permissions.filter(Boolean),
					memberCount: await ctx.db
						.query("organizationMembers")
						.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
						.filter((q) => q.eq(q.field("roleId"), role._id))
						.collect()
						.then(members => members.length),
				};
			})
		);

		return rolesWithPermissions;
	},
});

// Create a new role
export const createRole = mutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		isDirector: v.boolean(),
		priority: v.number(),
		permissionIds: v.array(v.id("permissions")),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage roles
		const canManage = await isAdmin(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to create roles");
		}

		// Check if role name already exists in organization
		const existingRole = await ctx.db
			.query("roles")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.filter((q) => q.eq(q.field("name"), args.name))
			.first();

		if (existingRole) {
			throw new Error("Role with this name already exists");
		}

		// Create the role
		const roleId = await ctx.db.insert("roles", {
			organizationId: organization._id,
			name: args.name,
			displayName: args.displayName,
			description: args.description,
			isSystem: false,
			isDirector: args.isDirector,
			priority: args.priority,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		// Assign permissions to the role
		for (const permissionId of args.permissionIds) {
			await ctx.db.insert("rolePermissions", {
				roleId,
				permissionId,
				createdAt: new Date().toISOString(),
			});
		}

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: undefined,
			targetRoleId: roleId,
			action: "role_created",
			details: JSON.stringify({
				name: args.name,
				isDirector: args.isDirector,
				permissionCount: args.permissionIds.length,
			}),
			createdAt: new Date().toISOString(),
		});

		return { roleId };
	},
});

// Update a role
export const updateRole = mutation({
	args: {
		roleId: v.id("roles"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		isDirector: v.optional(v.boolean()),
		priority: v.optional(v.number()),
		permissionIds: v.optional(v.array(v.id("permissions"))),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage roles
		const canManage = await isAdmin(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to update roles");
		}

		const role = await ctx.db.get(args.roleId);
		if (!role) {
			throw new Error("Role not found");
		}

		// Cannot update system roles unless you're the owner
		if (role.isSystem && !(await isOrganizationOwner(ctx, user._id, organization._id))) {
			throw new Error("Cannot modify system roles");
		}

		// Update role fields
		const updates: any = {
			updatedAt: new Date().toISOString(),
		};

		if (args.displayName !== undefined) updates.displayName = args.displayName;
		if (args.description !== undefined) updates.description = args.description;
		if (args.isDirector !== undefined) updates.isDirector = args.isDirector;
		if (args.priority !== undefined) updates.priority = args.priority;

		await ctx.db.patch(args.roleId, updates);

		// Update permissions if provided
		if (args.permissionIds) {
			// Remove existing permissions
			const existingPermissions = await ctx.db
				.query("rolePermissions")
				.withIndex("by_role", (q) => q.eq("roleId", args.roleId))
				.collect();

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
		}

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: undefined,
			targetRoleId: args.roleId,
			action: "role_updated",
			details: JSON.stringify(args),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Delete a role
export const deleteRole = mutation({
	args: {
		roleId: v.id("roles"),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Only organization owner can delete roles
		const isOwner = await isOrganizationOwner(ctx, user._id, organization._id);
		if (!isOwner) {
			throw new Error("Only organization owner can delete roles");
		}

		const role = await ctx.db.get(args.roleId);
		if (!role) {
			throw new Error("Role not found");
		}

		// Cannot delete system roles
		if (role.isSystem) {
			throw new Error("Cannot delete system roles");
		}

		// Check if any users have this role
		const usersWithRole = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
			.filter((q) => q.eq(q.field("roleId"), args.roleId))
			.collect();

		if (usersWithRole.length > 0) {
			throw new Error(`Cannot delete role: ${usersWithRole.length} users still have this role`);
		}

		// Delete role permissions
		const rolePermissions = await ctx.db
			.query("rolePermissions")
			.withIndex("by_role", (q) => q.eq("roleId", args.roleId))
			.collect();

		for (const perm of rolePermissions) {
			await ctx.db.delete(perm._id);
		}

		// Delete the role
		await ctx.db.delete(args.roleId);

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: undefined,
			targetRoleId: args.roleId,
			action: "role_deleted",
			details: JSON.stringify({ roleName: role.name }),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Assign role to user
export const assignRole = mutation({
	args: {
		userId: v.id("users"),
		roleId: v.id("roles"),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage members
		const canManage = await canManageMembers(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to assign roles");
		}

		// Get the target user's membership
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", organization._id).eq("userId", args.userId)
			)
			.first();

		if (!membership) {
			throw new Error("User is not a member of this organization");
		}

		// Check if the new role exists
		const newRole = await ctx.db.get(args.roleId);
		if (!newRole) {
			throw new Error("Role not found");
		}

		// If assigning director role, check if user is owner
		if (newRole.isDirector && !(await isOrganizationOwner(ctx, user._id, organization._id))) {
			throw new Error("Only organization owner can assign director role");
		}

		const oldRoleId = membership.roleId;

		// Update membership with new role
		await ctx.db.patch(membership._id, {
			roleId: args.roleId,
		});

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: args.userId,
			targetRoleId: args.roleId,
			action: "role_assigned",
			details: JSON.stringify({
				oldRoleId,
				newRoleId: args.roleId,
			}),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Get available permissions
export const getPermissions = query({
	handler: async (ctx) => {
		const permissions = await ctx.db.query("permissions").collect();

		// Group permissions by resource and scope
		const groupedPermissions = permissions.reduce((acc, permission) => {
			const key = `${permission.resource}_${permission.scope}`;
			if (!acc[key]) {
				acc[key] = {
					resource: permission.resource,
					scope: permission.scope,
					actions: [],
				};
			}
			acc[key].actions.push({
				_id: permission._id,
				action: permission.action,
				description: permission.description,
			});
			return acc;
		}, {} as Record<string, any>);

		return Object.values(groupedPermissions);
	},
});

// Initialize default roles and permissions
export const initializeDefaultRoles = mutation({
	handler: async (ctx) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Only organization owner can initialize roles
		const isOwner = await isOrganizationOwner(ctx, user._id, organization._id);
		if (!isOwner) {
			throw new Error("Only organization owner can initialize roles");
		}

		// Check if roles already exist
		const existingRoles = await ctx.db
			.query("roles")
			.withIndex("by_organization", (q) => q.eq("organizationId", undefined))
			.collect();

		if (existingRoles.length > 0) {
			return { message: "Roles already initialized" };
		}

		// Create default permissions
		const permissionMap: Record<string, any> = {};

		const defaultPermissions = [
			// Project permissions
			{ resource: "constructionProjects", action: "create", scope: "organization", description: "Create new projects" },
			{ resource: "constructionProjects", action: "read", scope: "organization", description: "View projects" },
			{ resource: "constructionProjects", action: "update", scope: "organization", description: "Edit projects" },
			{ resource: "constructionProjects", action: "delete", scope: "organization", description: "Delete projects" },
			{ resource: "constructionProjects", action: "manage", scope: "organization", description: "Full project management" },

			// User permissions
			{ resource: "users", action: "create", scope: "organization", description: "Create new users" },
			{ resource: "users", action: "read", scope: "organization", description: "View user profiles" },
			{ resource: "users", action: "update", scope: "organization", description: "Edit user profiles" },
			{ resource: "users", action: "delete", scope: "organization", description: "Delete users" },
			{ resource: "users", action: "manage", scope: "organization", description: "Full user management" },

			// Team permissions
			{ resource: "teams", action: "create", scope: "organization", description: "Create teams" },
			{ resource: "teams", action: "read", scope: "organization", description: "View teams" },
			{ resource: "teams", action: "update", scope: "organization", description: "Edit teams" },
			{ resource: "teams", action: "delete", scope: "organization", description: "Delete teams" },
			{ resource: "teams", action: "manage", scope: "organization", description: "Full team management" },

			// Document permissions
			{ resource: "documents", action: "create", scope: "project", description: "Create documents" },
			{ resource: "documents", action: "read", scope: "project", description: "View documents" },
			{ resource: "documents", action: "update", scope: "project", description: "Edit documents" },
			{ resource: "documents", action: "delete", scope: "project", description: "Delete documents" },
			{ resource: "documents", action: "manage", scope: "project", description: "Full document management" },

			// Issue permissions
			{ resource: "issues", action: "create", scope: "project", description: "Create tasks/issues" },
			{ resource: "issues", action: "read", scope: "project", description: "View tasks/issues" },
			{ resource: "issues", action: "update", scope: "project", description: "Edit tasks/issues" },
			{ resource: "issues", action: "delete", scope: "project", description: "Delete tasks/issues" },
			{ resource: "issues", action: "manage", scope: "project", description: "Full task management" },

			// Member permissions
			{ resource: "members", action: "invite", scope: "organization", description: "Invite new members" },
			{ resource: "members", action: "remove", scope: "organization", description: "Remove members" },
			{ resource: "members", action: "manage", scope: "organization", description: "Full member management" },

			// Role permissions
			{ resource: "roles", action: "create", scope: "organization", description: "Create roles" },
			{ resource: "roles", action: "update", scope: "organization", description: "Edit roles" },
			{ resource: "roles", action: "delete", scope: "organization", description: "Delete roles" },
			{ resource: "roles", action: "manage", scope: "organization", description: "Full role management" },
		];

		for (const perm of defaultPermissions) {
			const id = await ctx.db.insert("permissions", {
				...perm,
				createdAt: new Date().toISOString(),
			});
			permissionMap[`${perm.resource}_${perm.action}`] = id;
		}

		// Create default system roles
		const roles = [
			{
				name: "owner",
				displayName: "Owner",
				description: "Full system access with all permissions",
				isSystem: true,
				isDirector: true,
				priority: 100,
				permissions: Object.values(permissionMap), // All permissions
			},
			{
				name: "director",
				displayName: "Director",
				description: "Full access to all projects and management functions",
				isSystem: true,
				isDirector: true,
				priority: 90,
				permissions: Object.values(permissionMap), // All permissions
			},
			{
				name: "admin",
				displayName: "Administrator",
				description: "Can manage organization settings and members",
				isSystem: true,
				isDirector: false,
				priority: 80,
				permissions: [
					permissionMap.constructionProjects_manage,
					permissionMap.users_manage,
					permissionMap.teams_manage,
					permissionMap.members_manage,
					permissionMap.documents_manage,
					permissionMap.issues_manage,
				].filter(Boolean),
			},
			{
				name: "project_manager",
				displayName: "Project Manager",
				description: "Can manage assigned projects",
				isSystem: true,
				isDirector: false,
				priority: 70,
				permissions: [
					permissionMap.constructionProjects_read,
					permissionMap.constructionProjects_update,
					permissionMap.teams_read,
					permissionMap.teams_update,
					permissionMap.documents_manage,
					permissionMap.issues_manage,
				].filter(Boolean),
			},
			{
				name: "team_lead",
				displayName: "Team Lead",
				description: "Can manage team tasks and documents",
				isSystem: true,
				isDirector: false,
				priority: 60,
				permissions: [
					permissionMap.constructionProjects_read,
					permissionMap.teams_read,
					permissionMap.documents_create,
					permissionMap.documents_read,
					permissionMap.documents_update,
					permissionMap.issues_create,
					permissionMap.issues_read,
					permissionMap.issues_update,
				].filter(Boolean),
			},
			{
				name: "member",
				displayName: "Member",
				description: "Standard team member with basic access",
				isSystem: true,
				isDirector: false,
				priority: 50,
				permissions: [
					permissionMap.constructionProjects_read,
					permissionMap.teams_read,
					permissionMap.documents_read,
					permissionMap.documents_create,
					permissionMap.issues_read,
					permissionMap.issues_create,
					permissionMap.issues_update,
				].filter(Boolean),
			},
			{
				name: "viewer",
				displayName: "Viewer",
				description: "Read-only access to assigned resources",
				isSystem: true,
				isDirector: false,
				priority: 40,
				permissions: [
					permissionMap.constructionProjects_read,
					permissionMap.teams_read,
					permissionMap.documents_read,
					permissionMap.issues_read,
				].filter(Boolean),
			},
		];

		for (const roleData of roles) {
			const roleId = await ctx.db.insert("roles", {
				organizationId: undefined, // System roles
				name: roleData.name,
				displayName: roleData.displayName,
				description: roleData.description,
				isSystem: roleData.isSystem,
				isDirector: roleData.isDirector,
				priority: roleData.priority,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			// Assign permissions to role
			for (const permissionId of roleData.permissions) {
				await ctx.db.insert("rolePermissions", {
					roleId,
					permissionId,
					createdAt: new Date().toISOString(),
				});
			}
		}

		return { message: "Default roles and permissions initialized successfully" };
	},
});