import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Create a new team
export const create = mutation({
	args: {
		organizationId: v.id("organizations"),
		name: v.string(),
		description: v.optional(v.string()),
		parentTeamId: v.optional(v.id("teams")),
		leaderId: v.optional(v.id("users")),
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

		// Check if user has permission to create teams
		const role = await ctx.db.get(membership.roleId);
		if (!role || (role.name !== "admin" && role.name !== "manager")) {
			throw new Error("Insufficient permissions to create teams");
		}

		// Validate parent team if provided
		if (args.parentTeamId) {
			const parentTeam = await ctx.db.get(args.parentTeamId);
			if (!parentTeam || parentTeam.organizationId !== args.organizationId) {
				throw new Error("Invalid parent team");
			}
		}

		// Validate leader if provided
		if (args.leaderId) {
			const leaderMembership = await ctx.db
				.query("organizationMembers")
				.withIndex("by_org_user", (q) =>
					q
						.eq("organizationId", args.organizationId)
						.eq("userId", args.leaderId!),
				)
				.first();

			if (!leaderMembership || !leaderMembership.isActive) {
				throw new Error("Team leader must be a member of the organization");
			}
		}

		// Create the team
		const teamId = await ctx.db.insert("teams", {
			organizationId: args.organizationId,
			name: args.name,
			description: args.description,
			parentTeamId: args.parentTeamId,
			leaderId: args.leaderId,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Add the creator as a team member
		await ctx.db.insert("teamMembers", {
			teamId,
			userId: user._id,
			joinedAt: Date.now(),
			role: "member",
		});

		// Add leader as team member if different from creator
		if (args.leaderId && args.leaderId !== user._id) {
			await ctx.db.insert("teamMembers", {
				teamId,
				userId: args.leaderId,
				joinedAt: Date.now(),
				role: "leader",
			});
		}

		return { teamId };
	},
});

// Get organization teams
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

		// Check if user is a member
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

		// Get teams
		let teamsQuery = ctx.db
			.query("teams")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId),
			);

		if (!args.includeInactive) {
			teamsQuery = teamsQuery.filter((q) => q.eq(q.field("isActive"), true));
		}

		const teams = await teamsQuery.collect();

		// Build team hierarchy and enrich data
		const enrichedTeams = await Promise.all(
			teams.map(async (team) => {
				// Get team members
				const teamMembers = await ctx.db
					.query("teamMembers")
					.withIndex("by_team", (q) => q.eq("teamId", team._id))
					.collect();

				const members = await Promise.all(
					teamMembers.map(async (tm) => {
						const member = await ctx.db.get(tm.userId);
						return member
							? {
									_id: member._id,
									name: member.name,
									email: member.email,
									avatarUrl: member.avatarUrl,
									role: tm.role,
									joinedAt: tm.joinedAt,
								}
							: null;
					}),
				);

				// Get leader details
				const leader = team.leaderId ? await ctx.db.get(team.leaderId) : null;

				// Get parent team
				const parentTeam = team.parentTeamId
					? await ctx.db.get(team.parentTeamId)
					: null;

				return {
					...team,
					members: members.filter(Boolean),
					memberCount: members.filter(Boolean).length,
					leader: leader
						? {
								_id: leader._id,
								name: leader.name,
								email: leader.email,
								avatarUrl: leader.avatarUrl,
							}
						: null,
					parentTeam: parentTeam
						? {
								_id: parentTeam._id,
								name: parentTeam.name,
							}
						: null,
				};
			}),
		);

		// Build hierarchical structure
		const rootTeams = enrichedTeams.filter((t) => !t.parentTeamId);
		const teamMap = new Map(enrichedTeams.map((t) => [t._id, t]));

		const buildHierarchy = (parentId: Id<"teams"> | undefined): any[] => {
			return enrichedTeams
				.filter((t) => t.parentTeamId === parentId)
				.map((team) => ({
					...team,
					children: buildHierarchy(team._id),
				}));
		};

		return rootTeams.map((team) => ({
			...team,
			children: buildHierarchy(team._id),
		}));
	},
});

// Update team
export const update = mutation({
	args: {
		teamId: v.id("teams"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		leaderId: v.optional(v.id("users")),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
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
				q.eq("organizationId", team.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check permissions
		const role = await ctx.db.get(membership.roleId);
		const isTeamLeader = team.leaderId === user._id;

		if (
			!role ||
			(role.name !== "admin" && role.name !== "manager" && !isTeamLeader)
		) {
			throw new Error("Insufficient permissions to update team");
		}

		// Validate new leader if provided
		if (args.leaderId !== undefined) {
			if (args.leaderId) {
				const leaderMembership = await ctx.db
					.query("organizationMembers")
					.withIndex("by_org_user", (q) =>
						q
							.eq("organizationId", team.organizationId)
							.eq("userId", args.leaderId!),
					)
					.first();

				if (!leaderMembership || !leaderMembership.isActive) {
					throw new Error("Team leader must be a member of the organization");
				}

				// Ensure leader is a team member
				const teamMembership = await ctx.db
					.query("teamMembers")
					.withIndex("by_team_user", (q) =>
						q.eq("teamId", args.teamId).eq("userId", args.leaderId!),
					)
					.first();

				if (!teamMembership) {
					// Add as team member
					await ctx.db.insert("teamMembers", {
						teamId: args.teamId,
						userId: args.leaderId,
						joinedAt: Date.now(),
						role: "leader",
					});
				} else {
					// Update role to leader
					await ctx.db.patch(teamMembership._id, {
						role: "leader",
					});
				}

				// Update previous leader's role
				if (team.leaderId && team.leaderId !== args.leaderId) {
					const prevLeaderMembership = await ctx.db
						.query("teamMembers")
						.withIndex("by_team_user", (q) =>
							q.eq("teamId", args.teamId).eq("userId", team.leaderId!),
						)
						.first();

					if (prevLeaderMembership && prevLeaderMembership.role === "leader") {
						await ctx.db.patch(prevLeaderMembership._id, {
							role: "member",
						});
					}
				}
			}
		}

		// Update team
		const { teamId, ...updateData } = args;
		await ctx.db.patch(teamId, {
			...updateData,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Add team member
export const addMember = mutation({
	args: {
		teamId: v.id("teams"),
		userId: v.id("users"),
		role: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const team = await ctx.db.get(args.teamId);
		if (!team || !team.isActive) {
			throw new Error("Team not found");
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
				q.eq("organizationId", team.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check permissions
		const role = await ctx.db.get(membership.roleId);
		const isTeamLeader = team.leaderId === user._id;

		if (
			!role ||
			(role.name !== "admin" && role.name !== "manager" && !isTeamLeader)
		) {
			throw new Error("Insufficient permissions to add team members");
		}

		// Check if user to add is organization member
		const targetMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", team.organizationId).eq("userId", args.userId),
			)
			.first();

		if (!targetMembership || !targetMembership.isActive) {
			throw new Error("User must be a member of the organization");
		}

		// Check if already a team member
		const existingMembership = await ctx.db
			.query("teamMembers")
			.withIndex("by_team_user", (q) =>
				q.eq("teamId", args.teamId).eq("userId", args.userId),
			)
			.first();

		if (existingMembership) {
			throw new Error("User is already a team member");
		}

		// Add team member
		await ctx.db.insert("teamMembers", {
			teamId: args.teamId,
			userId: args.userId,
			joinedAt: Date.now(),
			role: args.role || "member",
		});

		return { success: true };
	},
});

// Remove team member
export const removeMember = mutation({
	args: {
		teamId: v.id("teams"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
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
				q.eq("organizationId", team.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check permissions
		const role = await ctx.db.get(membership.roleId);
		const isTeamLeader = team.leaderId === user._id;
		const isSelf = args.userId === user._id;

		if (
			!role ||
			(role.name !== "admin" &&
				role.name !== "manager" &&
				!isTeamLeader &&
				!isSelf)
		) {
			throw new Error("Insufficient permissions");
		}

		// Prevent removing team leader
		if (args.userId === team.leaderId && !isSelf) {
			throw new Error("Cannot remove team leader. Assign a new leader first.");
		}

		// Find and remove team membership
		const teamMembership = await ctx.db
			.query("teamMembers")
			.withIndex("by_team_user", (q) =>
				q.eq("teamId", args.teamId).eq("userId", args.userId),
			)
			.first();

		if (!teamMembership) {
			throw new Error("User is not a team member");
		}

		await ctx.db.delete(teamMembership._id);

		// If removed user was the leader, clear the leader field
		if (team.leaderId === args.userId) {
			await ctx.db.patch(args.teamId, {
				leaderId: undefined,
				updatedAt: Date.now(),
			});
		}

		return { success: true };
	},
});

// Delete team
export const deleteTeam = mutation({
	args: {
		teamId: v.id("teams"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const team = await ctx.db.get(args.teamId);
		if (!team) {
			throw new Error("Team not found");
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
				q.eq("organizationId", team.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Only admins can delete teams
		const role = await ctx.db.get(membership.roleId);
		if (!role || role.name !== "admin") {
			throw new Error("Only administrators can delete teams");
		}

		// Check if team has child teams
		const childTeams = await ctx.db
			.query("teams")
			.withIndex("by_parent", (q) => q.eq("parentTeamId", args.teamId))
			.collect();

		if (childTeams.length > 0) {
			throw new Error(
				"Cannot delete team with sub-teams. Delete sub-teams first.",
			);
		}

		// Remove all team members
		const teamMembers = await ctx.db
			.query("teamMembers")
			.withIndex("by_team", (q) => q.eq("teamId", args.teamId))
			.collect();

		for (const member of teamMembers) {
			await ctx.db.delete(member._id);
		}

		// Soft delete the team
		await ctx.db.patch(args.teamId, {
			isActive: false,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});
