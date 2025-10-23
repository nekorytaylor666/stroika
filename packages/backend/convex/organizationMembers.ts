import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { getCurrentUser } from "./helpers/getCurrentUser";

// List organization members (wrapper around Better Auth members)
export const list = query({
	args: {
		organizationId: v.string(), // Better Auth uses string IDs
		includeInactive: v.optional(v.boolean()),
	},
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
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		if (!userMembership) {
			throw new Error("Not a member of this organization");
		}

		// Get all members from Better Auth
		const members = await ctx.db
			.query("member")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		// Enrich member data
		const enrichedMembers = await Promise.all(
			members.map(async (member) => {
				// Get user from Better Auth user table
				const betterAuthUser = await ctx.db
					.query("user")
					.filter((q) => q.eq(q.field("_id"), member.userId))
					.first();
				
				// Try to get user from users table as well for custom data
				let customUser = null;
				if (betterAuthUser) {
					customUser = await ctx.db
						.query("users")
						.withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", member.userId))
						.first();
					
					if (!customUser && betterAuthUser.email) {
						// Fallback to email lookup
						customUser = await ctx.db
							.query("users")
							.withIndex("by_email", (q) => q.eq("email", betterAuthUser.email))
							.first();
					}
				}

				return {
					_id: member._id,
					userId: member.userId,
					organizationId: member.organizationId,
					role: member.role,
					joinedAt: member.createdAt,
					user: betterAuthUser ? {
						_id: betterAuthUser._id,
						name: betterAuthUser.name,
						email: betterAuthUser.email,
						image: betterAuthUser.image,
						// Include custom user data if available
						avatarUrl: customUser?.avatarUrl || betterAuthUser.image,
						phone: customUser?.phone,
						position: customUser?.position,
						status: customUser?.status,
					} : null,
				};
			})
		);

		return enrichedMembers.filter((m) => m.user !== null);
	},
});

// Get member by user ID
export const getByUserId = query({
	args: {
		organizationId: v.string(),
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Check if requester is a member
		const requesterMembership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		if (!requesterMembership) {
			throw new Error("Not a member of this organization");
		}

		// Get the requested member
		const member = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), args.userId)
				)
			)
			.first();

		if (!member) {
			return null;
		}

		// Get user details
		const betterAuthUser = await ctx.db
			.query("user")
			.filter((q) => q.eq(q.field("_id"), member.userId))
			.first();
		
		let customUser = null;
		if (betterAuthUser) {
			customUser = await ctx.db
				.query("users")
				.withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", member.userId))
				.first();
		}

		return {
			...member,
			user: betterAuthUser ? {
				_id: betterAuthUser._id,
				name: betterAuthUser.name,
				email: betterAuthUser.email,
				image: betterAuthUser.image,
				customData: customUser,
			} : null,
		};
	},
});

// Get current user's membership in an organization
export const getCurrentUserMembership = query({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		return membership;
	},
});

// Check if user is admin or owner
export const isAdminOrOwner = query({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			return false;
		}

		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		if (!membership) {
			return false;
		}

		return membership.role === "admin" || membership.role === "owner";
	},
});

// Check if user is member
export const isMember = query({
	args: {
		organizationId: v.string(),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			return false;
		}

		const userIdToCheck = args.userId || authUser.userId;

		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), userIdToCheck)
				)
			)
			.first();

		return !!membership;
	},
});

// Get user's role in organization
export const getUserRole = query({
	args: {
		organizationId: v.string(),
		userId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		const userIdToCheck = args.userId || authUser.userId;

		const membership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), userIdToCheck)
				)
			)
			.first();

		if (!membership) {
			return null;
		}

		return membership.role;
	},
});

// Count organization members
export const count = query({
	args: {
		organizationId: v.string(),
	},
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
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		if (!userMembership) {
			throw new Error("Not a member of this organization");
		}

		const members = await ctx.db
			.query("member")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		return members.length;
	},
});

// Get members by role
export const getByRole = query({
	args: {
		organizationId: v.string(),
		role: v.string(),
	},
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
					q.eq(q.field("userId"), authUser.userId)
				)
			)
			.first();

		if (!userMembership) {
			throw new Error("Not a member of this organization");
		}

		const members = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("role"), args.role)
				)
			)
			.collect();

		// Enrich with user data
		const enrichedMembers = await Promise.all(
			members.map(async (member) => {
				const betterAuthUser = await ctx.db
					.query("user")
					.filter((q) => q.eq(q.field("_id"), member.userId))
					.first();

				return {
					...member,
					user: betterAuthUser,
				};
			})
		);

		return enrichedMembers;
	},
});

// Legacy support - map old function names
export const get = getByUserId;
export const checkMembership = isMember;