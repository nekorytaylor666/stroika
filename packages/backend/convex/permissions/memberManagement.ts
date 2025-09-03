import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { auth } from "../auth";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import {
	canManageMembers,
	isAdmin,
	isDirector,
	isOrganizationOwner,
} from "./checks";

// Add a new member to the organization
export const inviteMember = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		roleId: v.id("roles"),
		teamIds: v.optional(v.array(v.id("teams"))),
		projectIds: v.optional(v.array(v.id("constructionProjects"))),
		sendInvite: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage members
		const canManage = await canManageMembers(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to invite members");
		}

		// Check if the role being assigned is director - only owner can do this
		const role = await ctx.db.get(args.roleId);
		if (!role) {
			throw new Error("Role not found");
		}

		if (role.isDirector) {
			const isOwner = await isOrganizationOwner(
				ctx,
				user._id,
				organization._id,
			);
			if (!isOwner) {
				throw new Error(
					"Only the organization owner can assign director roles",
				);
			}
		}

		// Check if user already exists
		let targetUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		// If user doesn't exist, create them
		if (!targetUser) {
			const userId = await ctx.db.insert("users", {
				email: args.email,
				name: args.name,
				avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${args.name}`,
				status: "offline",
				roleId: args.roleId,
				joinedDate: new Date().toISOString(),
				teamIds: [],
				isActive: true,
				currentOrganizationId: organization._id,
			});
			targetUser = await ctx.db.get(userId);
		}

		if (!targetUser) {
			throw new Error("Failed to create user");
		}

		// Check if user is already a member
		const existingMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", organization._id).eq("userId", targetUser._id),
			)
			.first();

		if (existingMembership) {
			if (existingMembership.isActive) {
				throw new Error("User is already a member of this organization");
			}
			// Reactivate membership
			await ctx.db.patch(existingMembership._id, {
				isActive: true,
				roleId: args.roleId,
				joinedAt: Date.now(),
				invitedBy: user._id,
			});
		} else {
			// Create new membership
			await ctx.db.insert("organizationMembers", {
				organizationId: organization._id,
				userId: targetUser._id,
				roleId: args.roleId,
				joinedAt: Date.now(),
				invitedBy: user._id,
				isActive: true,
			});
		}

		// Add to teams if specified
		if (args.teamIds) {
			for (const teamId of args.teamIds) {
				const team = await ctx.db.get(teamId);
				if (!team || team.organizationId !== organization._id) continue;

				const existingTeamMember = await ctx.db
					.query("teamMembers")
					.withIndex("by_team_user", (q) =>
						q.eq("teamId", teamId).eq("userId", targetUser._id),
					)
					.first();

				if (!existingTeamMember) {
					await ctx.db.insert("teamMembers", {
						teamId,
						userId: targetUser._id,
						joinedAt: Date.now(),
						role: undefined,
					});
				}
			}
		}

		// Grant project access if specified
		if (args.projectIds) {
			for (const projectId of args.projectIds) {
				const project = await ctx.db.get(projectId);
				if (!project || project.organizationId !== organization._id) continue;

				const existingAccess = await ctx.db
					.query("projectAccess")
					.withIndex("by_project_user", (q) =>
						q.eq("projectId", projectId).eq("userId", targetUser._id),
					)
					.first();

				if (!existingAccess) {
					await ctx.db.insert("projectAccess", {
						projectId,
						userId: targetUser._id,
						teamId: undefined,
						accessLevel: role.isDirector ? "admin" : "write",
						grantedBy: user._id,
						grantedAt: Date.now(),
						expiresAt: undefined,
					});
				}
			}
		}

		// Create invitation if needed
		if (args.sendInvite) {
			const inviteCode = Math.random().toString(36).substring(2, 15);
			await ctx.db.insert("organizationInvites", {
				organizationId: organization._id,
				email: args.email,
				inviteCode,
				roleId: args.roleId,
				invitedBy: user._id,
				expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
				status: "pending",
				createdAt: Date.now(),
				acceptedAt: undefined,
				acceptedBy: undefined,
			});
		}

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: targetUser._id,
			targetRoleId: args.roleId,
			action: "member_invited",
			details: JSON.stringify({
				email: args.email,
				roleId: args.roleId,
				teamCount: args.teamIds?.length || 0,
				projectCount: args.projectIds?.length || 0,
			}),
			createdAt: new Date().toISOString(),
		});

		return {
			success: true,
			userId: targetUser._id,
			isNewUser: !existingMembership,
		};
	},
});

// Update member role and permissions
export const updateMemberPermissions = mutation({
	args: {
		userId: v.id("users"),
		roleId: v.optional(v.id("roles")),
		customPermissions: v.optional(
			v.array(
				v.object({
					permissionId: v.id("permissions"),
					granted: v.boolean(),
					expiresAt: v.optional(v.string()),
				}),
			),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage members
		const canManage = await canManageMembers(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to update member permissions");
		}

		// Get target member
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", organization._id).eq("userId", args.userId),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Member not found in organization");
		}

		// Update role if specified
		if (args.roleId) {
			const newRole = await ctx.db.get(args.roleId);
			if (!newRole) {
				throw new Error("Role not found");
			}

			// Check if assigning director role
			if (newRole.isDirector) {
				const isOwner = await isOrganizationOwner(
					ctx,
					user._id,
					organization._id,
				);
				if (!isOwner) {
					throw new Error(
						"Only the organization owner can assign director roles",
					);
				}
			}

			await ctx.db.patch(membership._id, {
				roleId: args.roleId,
			});
		}

		// Update custom permissions if specified
		if (args.customPermissions) {
			for (const perm of args.customPermissions) {
				// Check if permission already exists for user
				const existingPerm = await ctx.db
					.query("userPermissions")
					.withIndex("by_user_permission", (q) =>
						q.eq("userId", args.userId).eq("permissionId", perm.permissionId),
					)
					.first();

				if (existingPerm) {
					// Update existing permission
					await ctx.db.patch(existingPerm._id, {
						granted: perm.granted,
						expiresAt: perm.expiresAt,
					});
				} else {
					// Create new permission override
					await ctx.db.insert("userPermissions", {
						userId: args.userId,
						permissionId: perm.permissionId,
						granted: perm.granted,
						createdAt: new Date().toISOString(),
						expiresAt: perm.expiresAt,
					});
				}
			}
		}

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: args.userId,
			targetRoleId: args.roleId,
			action: "permissions_updated",
			details: JSON.stringify({
				roleChanged: !!args.roleId,
				customPermissionsCount: args.customPermissions?.length || 0,
			}),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Remove member from organization
export const removeMember = mutation({
	args: {
		userId: v.id("users"),
		removeFromProjects: v.optional(v.boolean()),
		removeFromTeams: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage members
		const canManage = await canManageMembers(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to remove members");
		}

		// Cannot remove organization owner
		if (organization.ownerId === args.userId) {
			throw new Error("Cannot remove the organization owner");
		}

		// Cannot remove yourself
		if (user._id === args.userId) {
			throw new Error("Cannot remove yourself from the organization");
		}

		// Get membership
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", organization._id).eq("userId", args.userId),
			)
			.first();

		if (!membership) {
			throw new Error("Member not found");
		}

		// Check if removing a director (only owner can do this)
		const memberRole = await ctx.db.get(membership.roleId);
		if (memberRole && memberRole.isDirector) {
			const isOwner = await isOrganizationOwner(
				ctx,
				user._id,
				organization._id,
			);
			if (!isOwner) {
				throw new Error("Only the organization owner can remove directors");
			}
		}

		// Soft delete membership
		await ctx.db.patch(membership._id, {
			isActive: false,
		});

		// Remove from projects if specified
		if (args.removeFromProjects) {
			const projectAccesses = await ctx.db
				.query("projectAccess")
				.withIndex("by_user", (q) => q.eq("userId", args.userId))
				.collect();

			for (const access of projectAccesses) {
				const project = await ctx.db.get(access.projectId);
				if (project && project.organizationId === organization._id) {
					await ctx.db.delete(access._id);
				}
			}
		}

		// Remove from teams if specified
		if (args.removeFromTeams) {
			const teamMemberships = await ctx.db
				.query("teamMembers")
				.withIndex("by_user", (q) => q.eq("userId", args.userId))
				.collect();

			for (const tm of teamMemberships) {
				const team = await ctx.db.get(tm.teamId);
				if (team && team.organizationId === organization._id) {
					await ctx.db.delete(tm._id);
				}
			}
		}

		// Remove custom permissions
		const userPermissions = await ctx.db
			.query("userPermissions")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		for (const perm of userPermissions) {
			await ctx.db.delete(perm._id);
		}

		// Clear current organization if it matches
		const targetUser = await ctx.db.get(args.userId);
		if (targetUser && targetUser.currentOrganizationId === organization._id) {
			await ctx.db.patch(args.userId, {
				currentOrganizationId: undefined,
			});
		}

		// Log the action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: args.userId,
			targetRoleId: undefined,
			action: "member_removed",
			details: JSON.stringify({
				removedFromProjects: args.removeFromProjects,
				removedFromTeams: args.removeFromTeams,
			}),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Get members with permission details
export const getMembersWithPermissions = query({
	args: {
		includeInactive: v.optional(v.boolean()),
		roleId: v.optional(v.id("roles")),
		teamId: v.optional(v.id("teams")),
		projectId: v.optional(v.id("constructionProjects")),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Get members
		let membersQuery = ctx.db
			.query("organizationMembers")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organization._id),
			);

		if (!args.includeInactive) {
			membersQuery = membersQuery.filter((q) =>
				q.eq(q.field("isActive"), true),
			);
		}

		if (args.roleId) {
			membersQuery = membersQuery.filter((q) =>
				q.eq(q.field("roleId"), args.roleId),
			);
		}

		const members = await membersQuery.collect();

		// Filter by team if specified
		let filteredMembers = members;
		if (args.teamId) {
			const teamMembers = await ctx.db
				.query("teamMembers")
				.withIndex("by_team", (q) => q.eq("teamId", args.teamId))
				.collect();
			const teamMemberIds = new Set(teamMembers.map((tm) => tm.userId));
			filteredMembers = members.filter((m) => teamMemberIds.has(m.userId));
		}

		// Filter by project access if specified
		if (args.projectId) {
			const projectAccesses = await ctx.db
				.query("projectAccess")
				.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
				.collect();
			const projectUserIds = new Set(
				projectAccesses.filter((pa) => pa.userId).map((pa) => pa.userId!),
			);
			filteredMembers = filteredMembers.filter((m) =>
				projectUserIds.has(m.userId),
			);
		}

		// Enrich member data
		const enrichedMembers = await Promise.all(
			filteredMembers.map(async (member) => {
				const [memberUser, role, invitedBy] = await Promise.all([
					ctx.db.get(member.userId),
					ctx.db.get(member.roleId),
					member.invitedBy ? ctx.db.get(member.invitedBy) : null,
				]);

				if (!memberUser) return null;

				// Get role permissions
				const rolePermissions = role
					? await ctx.db
							.query("rolePermissions")
							.withIndex("by_role", (q) => q.eq("roleId", role._id))
							.collect()
					: [];

				const permissions = await Promise.all(
					rolePermissions.map(async (rp) => ctx.db.get(rp.permissionId)),
				);

				// Get custom permissions
				const customPermissions = await ctx.db
					.query("userPermissions")
					.withIndex("by_user", (q) => q.eq("userId", member.userId))
					.collect();

				const customPerms = await Promise.all(
					customPermissions.map(async (cp) => {
						const permission = await ctx.db.get(cp.permissionId);
						return {
							...cp,
							permission,
						};
					}),
				);

				// Get teams
				const teamMemberships = await ctx.db
					.query("teamMembers")
					.withIndex("by_user", (q) => q.eq("userId", member.userId))
					.collect();

				const teams = await Promise.all(
					teamMemberships.map(async (tm) => {
						const team = await ctx.db.get(tm.teamId);
						if (team && team.organizationId === organization._id) {
							return {
								_id: team._id,
								name: team.name,
								role: tm.role,
							};
						}
						return null;
					}),
				);

				// Get project access
				const projectAccesses = await ctx.db
					.query("projectAccess")
					.withIndex("by_user", (q) => q.eq("userId", member.userId))
					.collect();

				const projects = await Promise.all(
					projectAccesses.map(async (pa) => {
						const project = await ctx.db.get(pa.projectId);
						if (project && project.organizationId === organization._id) {
							return {
								_id: project._id,
								name: project.name,
								accessLevel: pa.accessLevel,
							};
						}
						return null;
					}),
				);

				// Check special permissions
				const isOwner = organization.ownerId === member.userId;
				const isDirectorRole = role ? role.isDirector : false;
				const canManage = isOwner || isDirectorRole || role?.name === "admin";

				return {
					_id: member._id,
					user: {
						_id: memberUser._id,
						name: memberUser.name,
						email: memberUser.email,
						avatarUrl: memberUser.avatarUrl,
						status: memberUser.status,
						position: memberUser.position,
						lastLogin: memberUser.lastLogin,
					},
					role: role
						? {
								_id: role._id,
								name: role.name,
								displayName: role.displayName,
								isDirector: role.isDirector,
								priority: role.priority,
							}
						: null,
					permissions: {
						inherited: permissions.filter(Boolean),
						custom: customPerms,
					},
					teams: teams.filter(Boolean),
					projects: projects.filter(Boolean),
					joinedAt: member.joinedAt,
					invitedBy: invitedBy
						? {
								_id: invitedBy._id,
								name: invitedBy.name,
								email: invitedBy.email,
							}
						: null,
					isActive: member.isActive,
					specialPermissions: {
						isOwner,
						isDirector: isDirectorRole,
						canManageMembers: canManage,
						canCreateProjects: isOwner || isDirectorRole,
					},
				};
			}),
		);

		return enrichedMembers.filter(Boolean);
	},
});

// Bulk update member roles
export const bulkUpdateRoles = mutation({
	args: {
		updates: v.array(
			v.object({
				userId: v.id("users"),
				roleId: v.id("roles"),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { user, organization } = await getCurrentUserWithOrganization(ctx);

		// Check if user can manage members
		const canManage = await canManageMembers(ctx, user._id, organization._id);
		if (!canManage) {
			throw new Error("Insufficient permissions to update member roles");
		}

		const results = [];

		for (const update of args.updates) {
			// Get membership
			const membership = await ctx.db
				.query("organizationMembers")
				.withIndex("by_org_user", (q) =>
					q.eq("organizationId", organization._id).eq("userId", update.userId),
				)
				.first();

			if (!membership || !membership.isActive) {
				results.push({
					userId: update.userId,
					success: false,
					error: "Member not found",
				});
				continue;
			}

			// Check if assigning director role
			const newRole = await ctx.db.get(update.roleId);
			if (!newRole) {
				results.push({
					userId: update.userId,
					success: false,
					error: "Role not found",
				});
				continue;
			}

			if (newRole.isDirector) {
				const isOwner = await isOrganizationOwner(
					ctx,
					user._id,
					organization._id,
				);
				if (!isOwner) {
					results.push({
						userId: update.userId,
						success: false,
						error: "Only owner can assign director role",
					});
					continue;
				}
			}

			// Cannot change owner's role
			if (organization.ownerId === update.userId) {
				results.push({
					userId: update.userId,
					success: false,
					error: "Cannot change owner's role",
				});
				continue;
			}

			// Update role
			await ctx.db.patch(membership._id, {
				roleId: update.roleId,
			});

			results.push({ userId: update.userId, success: true });
		}

		// Log the bulk action
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: undefined,
			targetRoleId: undefined,
			action: "bulk_role_update",
			details: JSON.stringify({
				totalUpdates: args.updates.length,
				successful: results.filter((r) => r.success).length,
			}),
			createdAt: new Date().toISOString(),
		});

		return { results };
	},
});
