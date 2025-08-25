import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate a random invite code
function generateInviteCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let code = "";
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

// Create an invite link
export const createInvite = mutation({
	args: {
		organizationId: v.id("organizations"),
		email: v.string(),
		roleId: v.id("roles"),
		expiresInDays: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get the user
		const authUserId = await auth.getUserId(ctx);
		if (!authUserId) {
			throw new Error("Not authenticated");
		}

		const user = await ctx.db.get(authUserId);
		if (!user) {
			throw new Error("User not found");
		}

		// Check if user has permission to invite
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check if user has admin role or invite permission
		const role = await ctx.db.get(membership.roleId);
		if (!role || (role.name !== "admin" && role.name !== "manager")) {
			throw new Error("Insufficient permissions to invite users");
		}

		// Check organization settings
		const organization = await ctx.db.get(args.organizationId);
		if (!organization) {
			throw new Error("Organization not found");
		}

		// Default to allowing invites if settings not configured
		const allowInvites = organization.settings?.allowInvites !== false;
		if (!allowInvites) {
			throw new Error(
				"Invites are disabled for this organization. Please contact your organization owner to enable invites.",
			);
		}

		// Check if email already has a pending invite
		const existingInvite = await ctx.db
			.query("organizationInvites")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("status"), "pending"),
				),
			)
			.first();

		if (existingInvite) {
			throw new Error("An invite already exists for this email");
		}

		// Check if user is already a member
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingUser) {
			const existingMembership = await ctx.db
				.query("organizationMembers")
				.withIndex("by_org_user", (q) =>
					q
						.eq("organizationId", args.organizationId)
						.eq("userId", existingUser._id),
				)
				.first();

			if (existingMembership) {
				throw new Error("User is already a member of this organization");
			}
		}

		// Generate unique invite code
		let inviteCode = generateInviteCode();
		while (
			await ctx.db
				.query("organizationInvites")
				.withIndex("by_code", (q) => q.eq("inviteCode", inviteCode))
				.first()
		) {
			inviteCode = generateInviteCode();
		}

		// Create the invite
		const expiresInDays = args.expiresInDays || 7;
		const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

		const inviteId = await ctx.db.insert("organizationInvites", {
			organizationId: args.organizationId,
			email: args.email,
			inviteCode,
			roleId: args.roleId,
			invitedBy: user._id,
			expiresAt,
			status: "pending",
			createdAt: Date.now(),
		});

		return {
			inviteId,
			inviteCode,
			inviteUrl: `/invite/${inviteCode}`,
		};
	},
});

// Get invite by code
export const getInviteByCode = query({
	args: { inviteCode: v.string() },
	handler: async (ctx, args) => {
		const invite = await ctx.db
			.query("organizationInvites")
			.withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
			.first();

		if (!invite) {
			return null;
		}

		// Check if invite is expired
		if (invite.expiresAt < Date.now()) {
			return {
				...invite,
				isExpired: true,
			};
		}

		// Get organization details
		const organization = await ctx.db.get(invite.organizationId);
		const role = await ctx.db.get(invite.roleId);
		const invitedBy = await ctx.db.get(invite.invitedBy);

		return {
			...invite,
			isExpired: false,
			organization: organization
				? {
						_id: organization._id,
						name: organization.name,
						logoUrl: organization.logoUrl,
					}
				: null,
			role: role
				? {
						_id: role._id,
						name: role.name,
						displayName: role.displayName,
					}
				: null,
			invitedByUser: invitedBy
				? {
						name: invitedBy.name,
						email: invitedBy.email,
						avatarUrl: invitedBy.avatarUrl,
					}
				: null,
		};
	},
});

// Accept invite
export const acceptInvite = mutation({
	args: { inviteCode: v.string() },
	handler: async (ctx, args) => {
		// Get the invite first to validate it exists
		const invite = await ctx.db
			.query("organizationInvites")
			.withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode))
			.first();

		if (!invite) {
			throw new Error("Invalid invite code");
		}

		// Check if invite is expired
		if (invite.expiresAt < Date.now()) {
			throw new Error("Invite has expired");
		}

		// Check if invite is already accepted
		if (invite.status !== "pending") {
			throw new Error("Invite has already been used");
		}

		// Try to get authenticated user ID first
		const authUserId = await auth.getUserId(ctx);
		let user = null;

		if (authUserId) {
			// User exists in auth system, get from users table
			user = await ctx.db.get(authUserId);
		}

		// If not found by auth ID, try by identity email
		if (!user) {
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				throw new Error("Not authenticated");
			}

			// Convex Auth provides email directly
			const userEmail = identity.email;
			if (!userEmail) {
				throw new Error("No email found in authentication identity");
			}

			// Try to find user by email
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", userEmail))
				.first();

			if (!user) {
				// Create new user
				const userId = await ctx.db.insert("users", {
					name: identity.name || userEmail.split("@")[0],
					email: userEmail,
					avatarUrl:
						identity.pictureUrl ||
						`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(identity.name || userEmail)}`,
					status: "online",
					joinedDate: new Date().toISOString(),
					teamIds: [],
					authId: identity.subject || undefined,
					tokenIdentifier: identity.tokenIdentifier || undefined,
					isActive: true,
					lastLogin: new Date().toISOString(),
				});
				user = await ctx.db.get(userId);
			}
		}

		if (!user) {
			throw new Error("Failed to get or create user");
		}

		// Check if email matches (if invite was for specific email)
		// Only check if invite has a specific email requirement
		if (
			invite.email &&
			invite.email.toLowerCase() !== user.email.toLowerCase()
		) {
			throw new Error(
				`This invite is for ${invite.email}. Please sign in with that email address.`,
			);
		}

		// Check if user is already a member
		const existingMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", invite.organizationId).eq("userId", user._id),
			)
			.first();

		if (existingMembership) {
			// If already a member but inactive, reactivate
			if (!existingMembership.isActive) {
				await ctx.db.patch(existingMembership._id, {
					isActive: true,
					joinedAt: Date.now(),
				});

				// Update invite status
				await ctx.db.patch(invite._id, {
					status: "accepted",
					acceptedAt: Date.now(),
					acceptedBy: user._id,
				});

				// Set as current organization if user doesn't have one
				if (!user.currentOrganizationId) {
					await ctx.db.patch(user._id, {
						currentOrganizationId: invite.organizationId,
					});
				}

				return {
					organizationId: invite.organizationId,
					success: true,
				};
			}
			throw new Error("You are already an active member of this organization");
		}

		// Add user to organization
		await ctx.db.insert("organizationMembers", {
			organizationId: invite.organizationId,
			userId: user._id,
			roleId: invite.roleId,
			joinedAt: Date.now(),
			invitedBy: invite.invitedBy,
			isActive: true,
		});

		// Update invite status
		await ctx.db.patch(invite._id, {
			status: "accepted",
			acceptedAt: Date.now(),
			acceptedBy: user._id,
		});

		// Set as current organization if user doesn't have one
		if (!user.currentOrganizationId) {
			await ctx.db.patch(user._id, {
				currentOrganizationId: invite.organizationId,
			});
		}

		return {
			organizationId: invite.organizationId,
			success: true,
		};
	},
});

// List organization invites
export const listInvites = query({
	args: {
		organizationId: v.id("organizations"),
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("accepted"),
				v.literal("expired"),
				v.literal("cancelled"),
			),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission to view invites
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

		// Get invites
		let invitesQuery = ctx.db
			.query("organizationInvites")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", args.organizationId),
			);

		if (args.status) {
			invitesQuery = invitesQuery.filter((q) =>
				q.eq(q.field("status"), args.status),
			);
		}

		const invites = await invitesQuery.collect();

		// Enrich invite data
		const enrichedInvites = await Promise.all(
			invites.map(async (invite) => {
				const role = await ctx.db.get(invite.roleId);
				const invitedBy = await ctx.db.get(invite.invitedBy);
				const acceptedBy = invite.acceptedBy
					? await ctx.db.get(invite.acceptedBy)
					: null;

				return {
					...invite,
					isExpired:
						invite.expiresAt < Date.now() && invite.status === "pending",
					role: role
						? {
								name: role.name,
								displayName: role.displayName,
							}
						: null,
					invitedByUser: invitedBy
						? {
								name: invitedBy.name,
								email: invitedBy.email,
								avatarUrl: invitedBy.avatarUrl,
							}
						: null,
					acceptedByUser: acceptedBy
						? {
								name: acceptedBy.name,
								email: acceptedBy.email,
								avatarUrl: acceptedBy.avatarUrl,
							}
						: null,
				};
			}),
		);

		return enrichedInvites;
	},
});

// Cancel invite
export const cancelInvite = mutation({
	args: { inviteId: v.id("organizationInvites") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const invite = await ctx.db.get(args.inviteId);
		if (!invite) {
			throw new Error("Invite not found");
		}

		// Check if user has permission to cancel invite
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
				q.eq("organizationId", invite.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Check if user has admin role
		const role = await ctx.db.get(membership.roleId);
		if (!role || (role.name !== "admin" && invite.invitedBy !== user._id)) {
			throw new Error("Insufficient permissions");
		}

		// Update invite status
		await ctx.db.patch(args.inviteId, {
			status: "cancelled",
		});

		return { success: true };
	},
});
