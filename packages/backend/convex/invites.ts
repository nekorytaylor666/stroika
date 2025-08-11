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

		if (!organization.settings?.allowInvites) {
			throw new Error("Invites are disabled for this organization");
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

			// Only prevent invite if membership exists AND is active
			if (existingMembership && existingMembership.isActive) {
				throw new Error("User is already an active member of this organization");
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
		// Get authenticated user ID
		const authUserId = await auth.getUserId(ctx);
		if (!authUserId) {
			throw new Error("Not authenticated");
		}
		
		// Get the auth user data to get email and name
		const authUser = await ctx.db.get(authUserId);
		if (!authUser) {
			throw new Error("Auth user not found");
		}
		
		// Extract email and name from auth user
		const userEmail = (authUser as any).email || (authUser as any).profile?.email;
		const userName = (authUser as any).name || (authUser as any).profile?.name;
		
		if (!userEmail) {
			// Fallback to identity if no email in auth user
			const identity = await ctx.auth.getUserIdentity();
			console.log("Identity for fallback:", JSON.stringify(identity, null, 2));
			throw new Error("No email found in user profile. Please ensure your account has an email address.");
		}
		
		// Try to find existing user in users table by email
		let user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", userEmail))
			.first();

		// Get the invite
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

		// Create user if doesn't exist
		if (!user) {
			// Create new user with data from auth user
			const userId = await ctx.db.insert("users", {
				name: userName || userEmail.split("@")[0],
				email: userEmail,
				avatarUrl:
					(authUser as any).avatarUrl ||
					(authUser as any).profile?.avatarUrl ||
					`https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`,
				status: "online",
				joinedDate: new Date().toISOString(),
				teamIds: [],
				authId: authUserId,
				isActive: true,
				lastLogin: new Date().toISOString(),
			});
			user = await ctx.db.get(userId);
		}

		if (!user) {
			throw new Error("Failed to create user");
		}

		// Check if email matches (if invite was for specific email)
		if (invite.email && invite.email !== user.email) {
			throw new Error("This invite is for a different email address");
		}

		// Check if user already has a membership
		const existingMembership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", invite.organizationId).eq("userId", user._id),
			)
			.first();

		if (existingMembership) {
			if (existingMembership.isActive) {
				throw new Error("You are already an active member of this organization");
			}
			// Reactivate existing inactive membership
			await ctx.db.patch(existingMembership._id, {
				isActive: true,
				roleId: invite.roleId,
				joinedAt: Date.now(),
				invitedBy: invite.invitedBy,
			});
		} else {
			// Add user to organization with new membership
			await ctx.db.insert("organizationMembers", {
				organizationId: invite.organizationId,
				userId: user._id,
				roleId: invite.roleId,
				joinedAt: Date.now(),
				invitedBy: invite.invitedBy,
				isActive: true,
			});
		}

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
