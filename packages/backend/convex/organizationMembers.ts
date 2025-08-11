import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get organization members
export const list = query({
	args: {
		organizationId: v.id("organizations"),
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get the user using auth.getUserId
		const authUserId = await auth.getUserId(ctx);

		if (!authUserId) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db.get(authUserId);
		if (!user) {
			throw new Error("User not found");
		}

		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Get members
		let membersQuery = ctx.db
			.query("organizationMembers")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId),
			);

		if (!args.includeInactive) {
			membersQuery = membersQuery.filter((q) =>
				q.eq(q.field("isActive"), true),
			);
		}

		const members = await membersQuery.collect();

		// Enrich member data
		const enrichedMembers = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get(member.userId);
				const role = await ctx.db.get(member.roleId);
				const invitedBy = member.invitedBy
					? await ctx.db.get(member.invitedBy)
					: null;

				// Get teams
				const teamMemberships = await ctx.db
					.query("teamMembers")
					.withIndex("by_user", (q) => q.eq("userId", member.userId))
					.collect();

				const teams = await Promise.all(
					teamMemberships.map(async (tm) => {
						const team = await ctx.db.get(tm.teamId);
						if (team && team.organizationId === args.organizationId) {
							return {
								_id: team._id,
								name: team.name,
								role: tm.role,
							};
						}
						return null;
					}),
				);

				return {
					_id: member._id,
					user: user
						? {
								_id: user._id,
								name: user.name,
								email: user.email,
								avatarUrl: user.avatarUrl,
								status: user.status,
								position: user.position,
							}
						: null,
					role: role
						? {
								_id: role._id,
								name: role.name,
								displayName: role.displayName,
							}
						: null,
					teams: teams.filter(Boolean),
					joinedAt: member.joinedAt,
					invitedBy: invitedBy
						? {
								name: invitedBy.name,
								email: invitedBy.email,
							}
						: null,
					isActive: member.isActive,
				};
			}),
		);

		return enrichedMembers.filter((m) => m.user !== null);
	},
});

// Get member details
export const getMemberDetails = query({
	args: {
		organizationId: v.id("organizations"),
		memberId: v.id("organizationMembers"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get the user using auth.getUserId
		const authUserId = await auth.getUserId(ctx);

		if (!authUserId) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db.get(authUserId);
		if (!user) {
			throw new Error("User not found");
		}

		// Check if the requester is a member of the organization
		const requesterMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!requesterMembership || !requesterMembership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Get the member details
		const member = await ctx.db.get(args.memberId);
		if (!member || member.organizationId !== args.organizationId) {
			throw new Error("Member not found");
		}

		// Get user details
		const memberUser = await ctx.db.get(member.userId);
		const role = await ctx.db.get(member.roleId);
		const invitedBy = member.invitedBy
			? await ctx.db.get(member.invitedBy)
			: null;

		// Get teams
		const teamMemberships = await ctx.db
			.query("teamMembers")
			.withIndex("by_user", (q) => q.eq("userId", member.userId))
			.collect();

		const teams = await Promise.all(
			teamMemberships.map(async (tm) => {
				const team = await ctx.db.get(tm.teamId);
				if (team && team.organizationId === args.organizationId) {
					return {
						_id: team._id,
						name: team.name,
						description: team.description,
						role: tm.role,
					};
				}
				return null;
			}),
		);

		return {
			_id: member._id,
			user: memberUser
				? {
						_id: memberUser._id,
						name: memberUser.name,
						email: memberUser.email,
						avatarUrl: memberUser.avatarUrl,
						status: memberUser.status,
						position: memberUser.position,
						lastLogin: memberUser.lastLogin,
					}
				: null,
			role: role
				? {
						_id: role._id,
						name: role.name,
						displayName: role.displayName,
					}
				: null,
			teams: teams.filter(Boolean),
			joinedAt: member.joinedAt,
			invitedBy: invitedBy
				? {
						_id: invitedBy._id,
						name: invitedBy.name,
						email: invitedBy.email,
					}
				: null,
			isActive: member.isActive,
		};
	},
});

// Update member role
export const updateRole = mutation({
	args: {
		organizationId: v.id("organizations"),
		userId: v.id("users"),
		roleId: v.id("roles"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email!))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check if user has admin role
		const role = await ctx.db.get(membership.roleId);
		if (!role || role.name !== "admin") {
			throw new Error("Insufficient permissions");
		}

		// Get target member
		const targetMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", args.userId),
			)
			.first();

		if (!targetMembership) {
			throw new Error("Member not found");
		}

		// Prevent removing the last admin
		if (role.name === "admin") {
			const adminCount = await ctx.db
				.query("organizationMembers")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", args.organizationId),
				)
				.filter((q) =>
					q.and(
						q.eq(q.field("isActive"), true),
						q.eq(q.field("roleId"), membership.roleId),
					),
				)
				.collect();

			const newRole = await ctx.db.get(args.roleId);
			if (adminCount.length === 1 && newRole?.name !== "admin") {
				throw new Error("Cannot remove the last admin");
			}
		}

		// Update member role
		await ctx.db.patch(targetMembership._id, {
			roleId: args.roleId,
		});

		// Log the change
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: args.userId,
			action: "role_changed",
			details: JSON.stringify({
				organizationId: args.organizationId,
				oldRoleId: targetMembership.roleId,
				newRoleId: args.roleId,
			}),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Remove member from organization
export const removeMember = mutation({
	args: {
		organizationId: v.id("organizations"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		// Get current user using auth helper
		const authUserId = await auth.getUserId(ctx);
		if (!authUserId) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db.get(authUserId);
		if (!user) {
			throw new Error("User not found");
		}

		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check if user has admin role
		const role = await ctx.db.get(membership.roleId);
		if (!role || role.name !== "admin") {
			throw new Error("Insufficient permissions");
		}

		// Get target member
		const targetMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", args.userId),
			)
			.first();

		if (!targetMembership) {
			throw new Error("Member not found");
		}

		// Prevent removing the organization owner
		const organization = await ctx.db.get(args.organizationId);
		if (organization && organization.ownerId === args.userId) {
			throw new Error("Cannot remove the organization owner");
		}

		// Prevent removing the last admin
		const targetRole = await ctx.db.get(targetMembership.roleId);
		if (targetRole?.name === "admin") {
			const adminCount = await ctx.db
				.query("organizationMembers")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", args.organizationId),
				)
				.filter((q) =>
					q.and(
						q.eq(q.field("isActive"), true),
						q.eq(q.field("roleId"), targetMembership.roleId),
					),
				)
				.collect();

			if (adminCount.length === 1) {
				throw new Error("Cannot remove the last admin");
			}
		}

		// Soft delete - mark as inactive
		await ctx.db.patch(targetMembership._id, {
			isActive: false,
		});

		// Remove from all teams in this organization
		const teams = await ctx.db
			.query("teams")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId),
			)
			.collect();

		for (const team of teams) {
			const teamMembership = await ctx.db
				.query("teamMembers")
				.withIndex("by_team_user", (q) =>
					q.eq("teamId", team._id).eq("userId", args.userId),
				)
				.first();

			if (teamMembership) {
				await ctx.db.delete(teamMembership._id);
			}
		}

		// If this was the user's current organization, clear it
		const targetUser = await ctx.db.get(args.userId);
		if (
			targetUser &&
			targetUser.currentOrganizationId === args.organizationId
		) {
			await ctx.db.patch(args.userId, {
				currentOrganizationId: undefined,
			});
		}

		// Log the change
		await ctx.db.insert("permissionAuditLog", {
			userId: user._id,
			targetUserId: args.userId,
			action: "member_removed",
			details: JSON.stringify({
				organizationId: args.organizationId,
			}),
			createdAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

// Leave organization
export const leaveOrganization = mutation({
	args: {
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email!))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		// Get membership
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Prevent owner from leaving
		const organization = await ctx.db.get(args.organizationId);
		if (organization && organization.ownerId === user._id) {
			throw new Error(
				"Organization owner cannot leave. Transfer ownership first.",
			);
		}

		// Prevent last admin from leaving
		const role = await ctx.db.get(membership.roleId);
		if (role?.name === "admin") {
			const adminCount = await ctx.db
				.query("organizationMembers")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", args.organizationId),
				)
				.filter((q) =>
					q.and(
						q.eq(q.field("isActive"), true),
						q.eq(q.field("roleId"), membership.roleId),
					),
				)
				.collect();

			if (adminCount.length === 1) {
				throw new Error(
					"Cannot leave as the last admin. Promote another member first.",
				);
			}
		}

		// Soft delete membership
		await ctx.db.patch(membership._id, {
			isActive: false,
		});

		// Remove from all teams
		const teams = await ctx.db
			.query("teams")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId),
			)
			.collect();

		for (const team of teams) {
			const teamMembership = await ctx.db
				.query("teamMembers")
				.withIndex("by_team_user", (q) =>
					q.eq("teamId", team._id).eq("userId", user._id),
				)
				.first();

			if (teamMembership) {
				await ctx.db.delete(teamMembership._id);
			}
		}

		// If this was the current organization, clear it
		if (user.currentOrganizationId === args.organizationId) {
			await ctx.db.patch(user._id, {
				currentOrganizationId: undefined,
			});
		}

		return { success: true };
	},
});
