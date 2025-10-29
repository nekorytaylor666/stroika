import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { getCurrentUser } from "./helpers/getCurrentUser";

// Get all organizations for the current user
export const getUserOrganizations = query({
	handler: async (ctx) => {
		// Try to get auth user - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
			console.log("authUser", authUser);
		} catch (error) {
			// User is not authenticated via Better Auth, return empty array
			console.log("User not authenticated in getUserOrganizations");
			return [];
		}

		if (!authUser || !authUser.userId) {
			// No authenticated user found
			return [];
		}

		// Get all memberships for the user from Better Auth
		const memberships = await ctx.db
			.query("member")
			.filter((q) => q.eq(q.field("userId"), authUser.userId))
			.collect();

		// Get all organizations for those memberships
		const organizations = await Promise.all(
			memberships.map(async (membership) => {
				const org = await ctx.db
					.query("organization")
					.filter((q) => q.eq(q.field("_id"), membership.organizationId))
					.first();

				if (!org) return null;

				return {
					...org,
					membership: {
						role: membership.role,
						joinedAt: membership.createdAt,
					},
				};
			}),
		);

		return organizations.filter(Boolean);
	},
});

// Get a specific organization by ID
export const getOrganization = query({
	args: { organizationId: v.string() },
	handler: async (ctx, args) => {
		// Try to get auth user - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User is not authenticated via Better Auth
			return null;
		}

		if (!authUser || !authUser.userId) {
			return null;
		}

		// Check if user is a member
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (!membership) {
			throw new Error("Not a member of this organization");
		}

		// Get organization
		const organization = await ctx.db
			.query("organization")
			.filter((q) => q.eq(q.field("_id"), args.organizationId))
			.first();

		if (!organization) {
			throw new Error("Organization not found");
		}

		return {
			...organization,
			membership: {
				role: membership.role,
				joinedAt: membership.createdAt,
			},
		};
	},
});

// Create a new organization using Better Auth
export const createOrganization = mutation({
	args: {
		name: v.string(),
		slug: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Create organization using Better Auth API
		const response = await auth.api.createOrganization({
			body: {
				name: args.name,
				slug: args.slug || args.name.toLowerCase().replace(/\s+/g, "-"),
				metadata: args.metadata,
			},
			headers: await authComponent.getHeaders(ctx),
		});

		// Update user's currentOrganizationId in users table
		const user = await getCurrentUser(ctx);
		if (user) {
			await ctx.db.patch(user._id, {
				currentOrganizationId: response.id,
			});
		}

		return response;
	},
});

// Update organization
export const updateOrganization = mutation({
	args: {
		organizationId: v.string(),
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		metadata: v.optional(v.any()),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user has admin role
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (!membership || membership.role !== "admin") {
			throw new Error("Only admins can update organization");
		}

		// Update organization using Better Auth API
		const response = await auth.api.updateOrganization({
			body: {
				id: args.organizationId,
				data: {
					name: args.name,
					slug: args.slug,
					metadata: args.metadata,
				},
			},
			headers: await authComponent.getHeaders(ctx),
		});

		return response;
	},
});

// Switch active organization for user
export const switchOrganization = mutation({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user is a member
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (!membership) {
			throw new Error("Not a member of this organization");
		}

		// Set active organization using Better Auth API
		await auth.api.setActiveOrganization({
			body: {
				organizationId: args.organizationId,
			},
			headers: await authComponent.getHeaders(ctx),
		});

		// Update user's currentOrganizationId in users table
		const user = await getCurrentUser(ctx);
		if (user) {
			await ctx.db.patch(user._id, {
				currentOrganizationId: args.organizationId,
			});
		}

		return { success: true };
	},
});

// Get organization members
export const getOrganizationMembers = query({
	args: { organizationId: v.string() },
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user is a member
		const userMembership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (!userMembership) {
			throw new Error("Not a member of this organization");
		}

		// Get all members
		const members = await ctx.db
			.query("member")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		// Get user details for each member
		const membersWithDetails = await Promise.all(
			members.map(async (member) => {
				// Get user from Better Auth user table
				const betterAuthUser = await ctx.db
					.query("user")
					.filter((q) => q.eq(q.field("_id"), member.userId))
					.first();

				// Try to get user from users table as well
				let customUser = null;
				if (betterAuthUser) {
					customUser = await ctx.db
						.query("users")
						.withIndex("by_betterAuthId", (q) =>
							q.eq("betterAuthId", member.userId),
						)
						.first();

					if (!customUser) {
						// Fallback to email lookup
						customUser = await ctx.db
							.query("users")
							.withIndex("by_email", (q) => q.eq("email", betterAuthUser.email))
							.first();
					}
				}

				return {
					...member,
					user: betterAuthUser
						? {
								id: betterAuthUser._id,
								email: betterAuthUser.email,
								name: betterAuthUser.name,
								image: betterAuthUser.image,
								// Include custom user data if available
								customData: customUser,
							}
						: null,
				};
			}),
		);

		return membersWithDetails.filter((m) => m.user !== null);
	},
});

// Invite user to organization
export const inviteToOrganization = mutation({
	args: {
		organizationId: v.string(),
		email: v.string(),
		role: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission to invite
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (
			!membership ||
			(membership.role !== "admin" && membership.role !== "owner")
		) {
			throw new Error("Only admins and owners can invite members");
		}

		// Create invitation using Better Auth API
		const response = await auth.api.createInvitation({
			body: {
				organizationId: args.organizationId,
				email: args.email,
				role: args.role || "member",
				expiresIn: 60 * 60 * 24 * 7, // 7 days
			},
			headers: await authComponent.getHeaders(ctx),
		});

		return response;
	},
});

// Remove member from organization
export const removeMember = mutation({
	args: {
		organizationId: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission to remove
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (
			!membership ||
			(membership.role !== "admin" && membership.role !== "owner")
		) {
			throw new Error("Only admins and owners can remove members");
		}

		// Remove member using Better Auth API
		const response = await auth.api.removeMember({
			body: {
				organizationId: args.organizationId,
				userId: args.userId,
			},
			headers: await authComponent.getHeaders(ctx),
		});

		return response;
	},
});

// Update member role
export const updateMemberRole = mutation({
	args: {
		organizationId: v.string(),
		userId: v.string(),
		role: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = createAuth(ctx);
		const authUser = await authComponent.getAuthUser(ctx);

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission to update roles
		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId),
				),
			)
			.first();

		if (
			!membership ||
			(membership.role !== "admin" && membership.role !== "owner")
		) {
			throw new Error("Only admins and owners can update member roles");
		}

		// Update member role using Better Auth API
		const response = await auth.api.updateMemberRole({
			body: {
				organizationId: args.organizationId,
				userId: args.userId,
				role: args.role,
			},
			headers: await authComponent.getHeaders(ctx),
		});

		return response;
	},
});

// Get current organization (for the active user)
export const getCurrentOrganization = query({
	handler: async (ctx) => {
		// Try to get auth user - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User is not authenticated via Better Auth
			return null;
		}

		if (!authUser || !authUser.userId) {
			return null;
		}

		// Get active organization ID
		const activeOrgId = authUser.activeOrganizationId;
		if (!activeOrgId) {
			// Fallback to user's currentOrganizationId
			const user = await getCurrentUser(ctx);
			if (!user || !user.currentOrganizationId) {
				return null;
			}

			const organization = await ctx.db
				.query("organization")
				.filter((q) => q.eq(q.field("_id"), user.currentOrganizationId))
				.first();

			return organization;
		}

		// Get organization from Better Auth
		const organization = await ctx.db
			.query("organization")
			.filter((q) => q.eq(q.field("_id"), activeOrgId))
			.first();

		return organization;
	},
});

// Legacy support - redirect to Better Auth functions
export const create = createOrganization;
export const update = updateOrganization;
export const listMembers = getOrganizationMembers;
export const switchActive = switchOrganization;
