/**
 * Custom Permissions System
 *
 * This file defines project-level roles and permissions stored as easily digestible JSON.
 *
 * Permission Structure:
 * {
 *   "resource": ["action1", "action2", ...]
 * }
 *
 * Available Resources:
 * - constructionProject: The project itself
 * - tasks: Project tasks and issues
 * - documents: Project documents
 * - attachments: File attachments
 * - members: Project team members
 * - activities: Project activities and logs
 * - analytics: Project analytics and reports
 *
 * Available Actions:
 * - read: View/read access
 * - create: Create new items
 * - update: Edit existing items
 * - delete: Remove items
 * - manage: Full administrative control
 *
 * Project Roles:
 * - project_member: Basic member with read access and task management
 * - project_admin: Administrator with full management except project deletion
 * - project_owner: Full owner with all permissions including project deletion
 */

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./helpers/getCurrentUser";

export const createCustomRole = mutation({
	args: {
		displayName: v.string(),
		description: v.optional(v.string()),
		name: v.string(),
		permissions: v.string(),
		scope: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("project"),
			v.literal("team"),
			v.literal("resource"),
		),
		scopeId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const customRole = await ctx.db
			.query("customRoles")
			.filter((q) => q.eq(q.field("name"), args.name))
			.first();

		if (customRole) {
			throw new Error("Custom role already exists");
		}
		const duplicatePermissions = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("permissions"), JSON.stringify(args.permissions)),
					q.and(
						q.eq(q.field("scope"), args.scope),
						q.eq(q.field("scopeId"), args.scopeId),
					),
				),
			)
			.first();
		if (duplicatePermissions) {
			throw new Error("Duplicate permissions");
		}
		return await ctx.db.insert("customRoles", {
			...args,
			permissions: JSON.stringify(args.permissions),
			name: args.name,
			displayName: args.displayName,
			description: args.description,
			scope: args.scope,
			scopeId: args.scopeId,
		});
	},
});

// Create project member role with basic permissions
export const createProjectMemberRole = mutation({
	args: {
		projectId: v.string(),
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const memberPermissions = {
			constructionProject: ["read"],
			tasks: ["read", "create", "update"],
			documents: ["read", "create"],
			attachments: ["read", "create"],
			members: ["read"],
			activities: ["read", "create"],
		};

		// Check if role already exists
		const existingRole = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("name"), "project_member"),
					q.eq(q.field("scope"), "project"),
					q.eq(q.field("scopeId"), args.projectId),
				),
			)
			.first();

		if (existingRole) {
			return existingRole._id;
		}

		return await ctx.db.insert("customRoles", {
			name: "project_member",
			displayName: "Project Member",
			description:
				"Basic project member with read access and ability to create/update tasks",
			scope: "project",
			scopeId: args.projectId,
			permissions: JSON.stringify(memberPermissions),
		});
	},
});

// Create project admin role with management permissions
export const createProjectAdminRole = mutation({
	args: {
		projectId: v.string(),
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const adminPermissions = {
			constructionProject: ["read", "update", "manage"],
			tasks: ["read", "create", "update", "delete", "manage"],
			documents: ["read", "create", "update", "delete", "manage"],
			attachments: ["read", "create", "update", "delete", "manage"],
			members: ["read", "create", "update", "manage"],
			activities: ["read", "create", "update", "manage"],
			analytics: ["read", "update"],
		};

		// Check if role already exists
		const existingRole = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("name"), "project_admin"),
					q.eq(q.field("scope"), "project"),
					q.eq(q.field("scopeId"), args.projectId),
				),
			)
			.first();

		if (existingRole) {
			return existingRole._id;
		}

		return await ctx.db.insert("customRoles", {
			name: "project_admin",
			displayName: "Project Administrator",
			description:
				"Project administrator with full management permissions except project deletion",
			scope: "project",
			scopeId: args.projectId,
			permissions: JSON.stringify(adminPermissions),
		});
	},
});

// Create project owner role with full permissions
export const createProjectOwnerRole = mutation({
	args: {
		projectId: v.string(),
	},
	handler: async (ctx, args) => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		const ownerPermissions = {
			constructionProject: ["read", "update", "delete", "manage"],
			tasks: ["read", "create", "update", "delete", "manage"],
			documents: ["read", "create", "update", "delete", "manage"],
			attachments: ["read", "create", "update", "delete", "manage"],
			members: ["read", "create", "update", "delete", "manage"],
			activities: ["read", "create", "update", "delete", "manage"],
			analytics: ["read", "update", "delete", "manage"],
		};

		// Check if role already exists
		const existingRole = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("name"), "project_owner"),
					q.eq(q.field("scope"), "project"),
					q.eq(q.field("scopeId"), args.projectId),
				),
			)
			.first();

		if (existingRole) {
			return existingRole._id;
		}

		return await ctx.db.insert("customRoles", {
			name: "project_owner",
			displayName: "Project Owner",
			description:
				"Project owner with full permissions including project deletion",
			scope: "project",
			scopeId: args.projectId,
			permissions: JSON.stringify(ownerPermissions),
		});
	},
});

// Utility function to create all project roles at once
export const createAllProjectRoles = mutation({
	args: {
		projectId: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		memberRoleId: Id<"customRoles">;
		adminRoleId: Id<"customRoles">;
		ownerRoleId: Id<"customRoles">;
	}> => {
		const project = await ctx.db.get(args.projectId);
		if (!project) {
			throw new Error("Project not found");
		}

		// Create all three roles
		const memberRoleId = await ctx.runMutation(
			api.customPermissions.createProjectMemberRole,
			{
				projectId: args.projectId,
			},
		);
		const adminRoleId = await ctx.runMutation(
			api.customPermissions.createProjectAdminRole,
			{
				projectId: args.projectId,
			},
		);
		const ownerRoleId = await ctx.runMutation(
			api.customPermissions.createProjectOwnerRole,
			{
				projectId: args.projectId,
			},
		);

		return {
			memberRoleId,
			adminRoleId,
			ownerRoleId,
		};
	},
});

// Helper function to get role permissions as parsed JSON
export const getRolePermissions = query({
	args: {
		roleId: v.string(),
	},
	handler: async (ctx, args) => {
		const role = await ctx.db.get(args.roleId);
		if (!role) {
			throw new Error("Role not found");
		}

		try {
			return {
				permissions: JSON.parse(role.permissions),
			};
		} catch (error) {
			console.error("Error parsing permissions JSON:", error);
			throw new Error("Invalid permissions format");
		}
	},
});

export const assignUserToRole = mutation({
	args: {
		userId: v.string(),
		roleId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("userCustomRoles", {
			userId: args.userId,
			roleId: args.roleId,
			granted: true,
			createdAt: new Date().toISOString(),
		});
	},
});

export const assignUserToProjectRoles = mutation({
	args: {
		userId: v.string(),
		projectId: v.string(),
		type: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
	},
	handler: async (ctx, args) => {
		const role = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("name"), args.type),
					q.eq(q.field("scope"), "project"),
					q.eq(q.field("scopeId"), args.projectId),
				),
			)
			.first();

		console.log(role);
		if (!role) {
			await ctx.runMutation(api.customPermissions.createAllProjectRoles, {
				projectId: args.projectId,
			});
		}
		return await ctx.db.insert("userCustomRoles", {
			userId: args.userId,
			roleId: role?._id,
			granted: true,
			createdAt: new Date().toISOString(),
		});
	},
});

// Helper function to get all project roles for a specific project
export const getProjectRoles = query({
	args: {
		projectId: v.string(),
	},
	handler: async (ctx, args) => {
		const roles = await ctx.db
			.query("customRoles")
			.filter((q) =>
				q.and(
					q.eq(q.field("scope"), "project"),
					q.eq(q.field("scopeId"), args.projectId),
				),
			)
			.collect();

		return roles.map((role) => ({
			roleId: role._id,
			name: role.name,
			displayName: role.displayName,
			description: role.description,
			scope: role.scope,
			scopeId: role.scopeId,
			permissions: JSON.parse(role.permissions),
		}));
	},
});

/**
 * Check if a user has permission to access a specific part of a project
 *
 * This function ONLY uses customRoles and userCustomRoles tables.
 *
 * @param userId - The ID of the user to check (optional - defaults to current user)
 * @param projectId - The ID of the project (constructionProjects ID)
 * @param resource - The resource type (e.g., "tasks", "documents", "constructionProject", "attachments", "members", "activities", "analytics")
 * @param action - The action to perform (e.g., "read", "create", "update", "delete", "manage")
 * @returns Object with hasPermission boolean, reason, and role details
 */
export const hasPermissionForProject = query({
	args: {
		userId: v.optional(v.string()),
		projectId: v.string(),
		resource: v.string(),
		action: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		hasPermission: boolean;
		reason?: string;
		roleName?: string;
		roleDisplayName?: string;
	}> => {
		const { resource, action } = args;
		let { projectId } = args;

		// Get current user if userId not provided
		let userId = args.userId;
		if (!userId) {
			const currentUser = await getCurrentUser(ctx);
			if (!currentUser) {
				return {
					hasPermission: false,
					reason: "User not authenticated",
				};
			}
			userId = currentUser._id;
		}

		// 1. Get all custom roles assigned to this user
		const userCustomRoles = await ctx.db
			.query("userCustomRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("granted"), true))
			.collect();

		if (userCustomRoles.length === 0) {
			return {
				hasPermission: false,
				reason: "User has no roles assigned",
			};
		}

		// 2. Check each assigned role for project-specific permissions
		for (const userRole of userCustomRoles) {
			// Check if role has expired
			if (userRole.expiresAt) {
				const expirationDate = new Date(userRole.expiresAt).getTime();
				if (expirationDate < Date.now()) {
					continue; // Skip expired roles
				}
			}

			// Get the custom role details
			const customRole = await ctx.db.get(userRole.roleId as Id<"customRoles">);

			if (!customRole) {
				continue; // Skip if role not found
			}

			// Only check project-scoped roles for this specific project
			if (customRole.scope === "project" && customRole.scopeId === projectId) {
				try {
					// Parse the permissions JSON
					const permissions = JSON.parse(customRole.permissions) as Record<
						string,
						string[]
					>;

					// Check if the resource exists in permissions
					if (permissions[resource] && Array.isArray(permissions[resource])) {
						const allowedActions = permissions[resource];

						// Direct action match
						if (allowedActions.includes(action)) {
							return {
								hasPermission: true,
								reason: `User has '${action}' permission for '${resource}' via role '${customRole.displayName}'`,
								roleName: customRole.name,
								roleDisplayName: customRole.displayName,
							};
						}

						// Check for "manage" permission which grants all actions
						if (
							allowedActions.includes("manage") &&
							["read", "create", "update", "delete"].includes(action)
						) {
							return {
								hasPermission: true,
								reason: `User has 'manage' permission for '${resource}' which includes '${action}' via role '${customRole.displayName}'`,
								roleName: customRole.name,
								roleDisplayName: customRole.displayName,
							};
						}
					}
				} catch (error) {
					console.error(
						`Error parsing permissions for role ${customRole._id}:`,
						error,
					);
					continue;
				}
			}
		}

		return {
			hasPermission: false,
			reason: `User does not have '${action}' permission for '${resource}' on project ${projectId}`,
		};
	},
});

export const getUserPermissions = query({
	handler: async (ctx, args) => {
		const { _id: userId } = await getCurrentUser(ctx);
		// Get all custom roles assigned to this user
		const userCustomRoles = await ctx.db
			.query("userCustomRoles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.filter((q) => q.eq(q.field("granted"), true))
			.collect();

		if (userCustomRoles.length === 0) {
			return {};
		}

		// Structure to hold permissions organized by scope -> scopeId -> resource -> actions
		const permissionsStructure: Record<
			string,
			Record<string, Record<string, string[]>>
		> = {};

		// Process each assigned role
		for (const userRole of userCustomRoles) {
			// Check if role has expired
			if (userRole.expiresAt) {
				const expirationDate = new Date(userRole.expiresAt).getTime();
				if (expirationDate < Date.now()) {
					continue; // Skip expired roles
				}
			}

			// Get the custom role details
			const customRole = await ctx.db.get(userRole.roleId as Id<"customRoles">);

			if (!customRole) {
				continue; // Skip if role not found
			}

			try {
				// Parse the permissions JSON
				const permissions = JSON.parse(customRole.permissions) as Record<
					string,
					string[]
				>;

				const scope = customRole.scope;
				const scopeId = customRole.scopeId || "global";

				// Initialize scope if it doesn't exist
				if (!permissionsStructure[scope]) {
					permissionsStructure[scope] = {};
				}

				// Initialize scopeId if it doesn't exist
				if (!permissionsStructure[scope][scopeId]) {
					permissionsStructure[scope][scopeId] = {};
				}

				// Merge permissions for each resource
				for (const [resource, actions] of Object.entries(permissions)) {
					if (!permissionsStructure[scope][scopeId][resource]) {
						permissionsStructure[scope][scopeId][resource] = [];
					}

					// Merge actions, avoiding duplicates
					const existingActions =
						permissionsStructure[scope][scopeId][resource];
					const newActions = actions.filter(
						(action) => !existingActions.includes(action),
					);
					permissionsStructure[scope][scopeId][resource].push(...newActions);
				}
			} catch (error) {
				console.error(
					`Error parsing permissions for role ${customRole._id}:`,
					error,
				);
				continue;
			}
		}

		return permissionsStructure;
	},
});
// Helper function to check if a user has specific permission for a resource (legacy - kept for compatibility)
export const checkUserPermission = query({
	args: {
		userId: v.string(),
		projectId: v.string(),
		resource: v.string(),
		action: v.string(),
	},
	handler: async (ctx, args) => {
		// Delegate to the new hasPermissionForProject function
		return await ctx.runQuery(
			api.customPermissions.hasPermissionForProject,
			args,
		);
	},
});
