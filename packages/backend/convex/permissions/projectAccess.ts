import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import type { AccessLevel } from "./types";
import { checkPermission } from "./utils";

// Check if user has access to a specific project
export const checkProjectAccess = query({
	args: {
		projectId: v.id("constructionProjects"),
		requiredLevel: v.optional(
			v.union(
				v.literal("owner"),
				v.literal("admin"),
				v.literal("write"),
				v.literal("read"),
			),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization, role } =
			await getCurrentUserWithOrganization(ctx);

		// Check if user is organization owner
		if (organization.ownerId === user._id) {
			return { hasAccess: true, level: "owner" as AccessLevel };
		}

		// Check if user has director role
		if (role && role.isDirector) {
			return { hasAccess: true, level: "admin" as AccessLevel };
		}

		// Check if user has global project management permissions
		const hasGlobalAccess = await checkPermission(
			ctx,
			user._id,
			"constructionProjects",
			"manage",
		);
		if (hasGlobalAccess) {
			return { hasAccess: true, level: "admin" as AccessLevel };
		}

		// Check project-specific access
		const projectAccess = await ctx.db
			.query("projectAccess")
			.withIndex("by_project_user", (q) =>
				q.eq("projectId", args.projectId).eq("userId", user._id),
			)
			.first();

		if (
			projectAccess &&
			(!projectAccess.expiresAt || projectAccess.expiresAt > Date.now())
		) {
			const hasRequiredLevel =
				!args.requiredLevel ||
				getAccessLevelPriority(projectAccess.accessLevel) >=
					getAccessLevelPriority(args.requiredLevel);
			return {
				hasAccess: hasRequiredLevel,
				level: projectAccess.accessLevel as AccessLevel,
			};
		}

		// Check team-based access
		const userTeams = await ctx.db
			.query("teamMembers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		for (const teamMember of userTeams) {
			const teamAccess = await ctx.db
				.query("teamProjectAccess")
				.withIndex("by_team_project", (q) =>
					q.eq("teamId", teamMember.teamId).eq("projectId", args.projectId),
				)
				.first();

			if (teamAccess && teamAccess.inheritToMembers) {
				const hasRequiredLevel =
					!args.requiredLevel ||
					getAccessLevelPriority(teamAccess.accessLevel) >=
						getAccessLevelPriority(args.requiredLevel);
				if (hasRequiredLevel) {
					return {
						hasAccess: true,
						level: teamAccess.accessLevel as AccessLevel,
					};
				}
			}
		}

		// Check if user is the project lead
		const project = await ctx.db.get(args.projectId);
		if (project && project.leadId === user._id) {
			return { hasAccess: true, level: "admin" as AccessLevel };
		}

		// Check if user is in project team members
		if (project && project.teamMemberIds.includes(user._id)) {
			const hasRequiredLevel =
				!args.requiredLevel ||
				getAccessLevelPriority("write") >=
					getAccessLevelPriority(args.requiredLevel);
			return { hasAccess: hasRequiredLevel, level: "write" as AccessLevel };
		}

		return { hasAccess: false, level: null };
	},
});

// Grant access to a project for a user or team
export const grantProjectAccess = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		userId: v.optional(v.id("users")),
		teamId: v.optional(v.id("constructionTeams")),
		accessLevel: v.union(
			v.literal("owner"),
			v.literal("admin"),
			v.literal("write"),
			v.literal("read"),
		),
		expiresAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user, role, organization } =
			await getCurrentUserWithOrganization(ctx);

		// Check if user can grant access
		const canGrantAccess =
			organization.ownerId === user._id ||
			(role && role.isDirector) ||
			(await checkPermission(ctx, user._id, "constructionProjects", "manage"));

		if (!canGrantAccess) {
			// Check if user has admin access to this specific project
			const projectAccess = await ctx.db
				.query("projectAccess")
				.withIndex("by_project_user", (q) =>
					q.eq("projectId", args.projectId).eq("userId", user._id),
				)
				.first();

			if (
				!projectAccess ||
				(projectAccess.accessLevel !== "owner" &&
					projectAccess.accessLevel !== "admin")
			) {
				throw new Error("Insufficient permissions to grant project access");
			}
		}

		// Validate that either userId or teamId is provided, but not both
		if ((!args.userId && !args.teamId) || (args.userId && args.teamId)) {
			throw new Error("Must provide either userId or teamId, not both");
		}

		if (args.userId) {
			// Check if access already exists
			const existingAccess = await ctx.db
				.query("projectAccess")
				.withIndex("by_project_user", (q) =>
					q.eq("projectId", args.projectId).eq("userId", args.userId),
				)
				.first();

			if (existingAccess) {
				// Update existing access
				await ctx.db.patch(existingAccess._id, {
					accessLevel: args.accessLevel,
					grantedBy: user._id,
					grantedAt: Date.now(),
					expiresAt: args.expiresAt,
				});
			} else {
				// Create new access
				await ctx.db.insert("projectAccess", {
					projectId: args.projectId,
					userId: args.userId,
					teamId: undefined,
					accessLevel: args.accessLevel,
					grantedBy: user._id,
					grantedAt: Date.now(),
					expiresAt: args.expiresAt,
				});
			}

			// Log the action
			await ctx.db.insert("permissionAuditLog", {
				userId: user._id,
				targetUserId: args.userId,
				targetRoleId: undefined,
				action: "project_access_granted",
				details: JSON.stringify({
					projectId: args.projectId,
					accessLevel: args.accessLevel,
					expiresAt: args.expiresAt,
				}),
				createdAt: new Date().toISOString(),
			});
		}

		if (args.teamId) {
			// Check if team access already exists
			const existingAccess = await ctx.db
				.query("teamProjectAccess")
				.withIndex("by_team_project", (q) =>
					q.eq("teamId", args.teamId).eq("projectId", args.projectId),
				)
				.first();

			if (existingAccess) {
				// Update existing access
				await ctx.db.patch(existingAccess._id, {
					accessLevel: args.accessLevel as "admin" | "write" | "read",
					grantedBy: user._id,
					grantedAt: Date.now(),
				});
			} else {
				// Create new team access
				await ctx.db.insert("teamProjectAccess", {
					teamId: args.teamId,
					projectId: args.projectId,
					accessLevel: args.accessLevel as "admin" | "write" | "read",
					inheritToMembers: true,
					grantedBy: user._id,
					grantedAt: Date.now(),
				});
			}

			// Log the action
			await ctx.db.insert("permissionAuditLog", {
				userId: user._id,
				targetUserId: undefined,
				targetRoleId: undefined,
				action: "team_project_access_granted",
				details: JSON.stringify({
					projectId: args.projectId,
					teamId: args.teamId,
					accessLevel: args.accessLevel,
				}),
				createdAt: new Date().toISOString(),
			});
		}

		return { success: true };
	},
});

// Revoke project access
export const revokeProjectAccess = mutation({
	args: {
		projectId: v.id("constructionProjects"),
		userId: v.optional(v.id("users")),
		teamId: v.optional(v.id("constructionTeams")),
	},
	handler: async (ctx, args) => {
		const { user, role, organization } =
			await getCurrentUserWithOrganization(ctx);

		// Check if user can revoke access
		const canRevokeAccess =
			organization.ownerId === user._id ||
			(role && role.isDirector) ||
			(await checkPermission(ctx, user._id, "constructionProjects", "manage"));

		if (!canRevokeAccess) {
			throw new Error("Insufficient permissions to revoke project access");
		}

		if (args.userId) {
			const access = await ctx.db
				.query("projectAccess")
				.withIndex("by_project_user", (q) =>
					q.eq("projectId", args.projectId).eq("userId", args.userId),
				)
				.first();

			if (access) {
				await ctx.db.delete(access._id);

				// Log the action
				await ctx.db.insert("permissionAuditLog", {
					userId: user._id,
					targetUserId: args.userId,
					targetRoleId: undefined,
					action: "project_access_revoked",
					details: JSON.stringify({ projectId: args.projectId }),
					createdAt: new Date().toISOString(),
				});
			}
		}

		if (args.teamId) {
			const access = await ctx.db
				.query("teamProjectAccess")
				.withIndex("by_team_project", (q) =>
					q.eq("teamId", args.teamId).eq("projectId", args.projectId),
				)
				.first();

			if (access) {
				await ctx.db.delete(access._id);

				// Log the action
				await ctx.db.insert("permissionAuditLog", {
					userId: user._id,
					targetUserId: undefined,
					targetRoleId: undefined,
					action: "team_project_access_revoked",
					details: JSON.stringify({
						projectId: args.projectId,
						teamId: args.teamId,
					}),
					createdAt: new Date().toISOString(),
				});
			}
		}

		return { success: true };
	},
});

// Get all users and teams with access to a project
export const getProjectAccessList = query({
	args: {
		projectId: v.id("constructionProjects"),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);

		// Check if user has access to view project access list
		const canViewAccess = await checkProjectAccess(ctx, {
			projectId: args.projectId,
			requiredLevel: "read",
		});

		if (!canViewAccess.hasAccess) {
			throw new Error("Insufficient permissions to view project access");
		}

		// Get user access
		const userAccess = await ctx.db
			.query("projectAccess")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const userAccessWithDetails = await Promise.all(
			userAccess
				.filter((access) => access.userId)
				.map(async (access) => {
					const user = await ctx.db.get(access.userId!);
					const grantedBy = await ctx.db.get(access.grantedBy);
					return {
						_id: access._id,
						type: "user" as const,
						user,
						accessLevel: access.accessLevel,
						grantedBy,
						grantedAt: access.grantedAt,
						expiresAt: access.expiresAt,
					};
				}),
		);

		// Get team access
		const teamAccess = await ctx.db
			.query("teamProjectAccess")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		const teamAccessWithDetails = await Promise.all(
			teamAccess.map(async (access) => {
				const team = await ctx.db.get(access.teamId);
				const grantedBy = await ctx.db.get(access.grantedBy);
				return {
					_id: access._id,
					type: "team" as const,
					team,
					accessLevel: access.accessLevel,
					inheritToMembers: access.inheritToMembers,
					grantedBy,
					grantedAt: access.grantedAt,
				};
			}),
		);

		return {
			users: userAccessWithDetails,
			teams: teamAccessWithDetails,
		};
	},
});

// Helper function to compare access levels
function getAccessLevelPriority(level: string): number {
	const priorities: Record<string, number> = {
		owner: 4,
		admin: 3,
		write: 2,
		read: 1,
	};
	return priorities[level] || 0;
}

// Get all projects accessible to the current user
export const getAccessibleProjects = query({
	handler: async (ctx) => {
		const { user, organization, role } =
			await getCurrentUserWithOrganization(ctx);

		// If owner or director, return all projects
		if (organization.ownerId === user._id || (role && role.isDirector)) {
			const allProjects = await ctx.db
				.query("constructionProjects")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", organization._id),
				)
				.collect();

			return allProjects.map((project) => ({
				...project,
				accessLevel: "admin" as AccessLevel,
			}));
		}

		const accessibleProjects: Array<{
			projectId: Id<"constructionProjects">;
			accessLevel: AccessLevel;
		}> = [];

		// Get direct user access
		const userAccess = await ctx.db
			.query("projectAccess")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		for (const access of userAccess) {
			if (!access.expiresAt || access.expiresAt > Date.now()) {
				accessibleProjects.push({
					projectId: access.projectId,
					accessLevel: access.accessLevel as AccessLevel,
				});
			}
		}

		// Get team-based access
		const userTeams = await ctx.db
			.query("teamMembers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		for (const teamMember of userTeams) {
			const teamAccesses = await ctx.db
				.query("teamProjectAccess")
				.withIndex("by_team", (q) => q.eq("teamId", teamMember.teamId))
				.collect();

			for (const teamAccess of teamAccesses) {
				if (teamAccess.inheritToMembers) {
					// Check if we already have this project with a higher access level
					const existingAccess = accessibleProjects.find(
						(p) => p.projectId === teamAccess.projectId,
					);
					if (
						!existingAccess ||
						getAccessLevelPriority(teamAccess.accessLevel) >
							getAccessLevelPriority(existingAccess.accessLevel)
					) {
						if (existingAccess) {
							existingAccess.accessLevel =
								teamAccess.accessLevel as AccessLevel;
						} else {
							accessibleProjects.push({
								projectId: teamAccess.projectId,
								accessLevel: teamAccess.accessLevel as AccessLevel,
							});
						}
					}
				}
			}
		}

		// Get projects where user is lead or team member
		const allProjects = await ctx.db
			.query("constructionProjects")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization._id),
			)
			.collect();

		for (const project of allProjects) {
			if (project.leadId === user._id) {
				const existingAccess = accessibleProjects.find(
					(p) => p.projectId === project._id,
				);
				if (!existingAccess) {
					accessibleProjects.push({
						projectId: project._id,
						accessLevel: "admin",
					});
				}
			} else if (project.teamMemberIds.includes(user._id)) {
				const existingAccess = accessibleProjects.find(
					(p) => p.projectId === project._id,
				);
				if (!existingAccess) {
					accessibleProjects.push({
						projectId: project._id,
						accessLevel: "write",
					});
				}
			}
		}

		// Fetch full project details
		const projectsWithDetails = await Promise.all(
			accessibleProjects.map(async ({ projectId, accessLevel }) => {
				const project = await ctx.db.get(projectId);
				return project ? { ...project, accessLevel } : null;
			}),
		);

		return projectsWithDetails.filter(Boolean);
	},
});
