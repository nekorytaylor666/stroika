import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create a new organization
export const create = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		website: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get the user from the database
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email!))
			.first();

		if (!user) {
			throw new Error("User not found");
		}

		// Generate a unique slug from the organization name
		const baseSlug = args.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");

		let slug = baseSlug;
		let counter = 1;

		// Check if slug already exists and generate a unique one
		while (
			await ctx.db
				.query("organizations")
				.withIndex("by_slug", (q) => q.eq("slug", slug))
				.first()
		) {
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		// Create the organization
		const organizationId = await ctx.db.insert("organizations", {
			name: args.name,
			slug,
			description: args.description,
			logoUrl: args.logoUrl,
			website: args.website,
			ownerId: user._id,
			settings: {
				allowInvites: true,
				requireEmailVerification: false,
				defaultRoleId: undefined,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Create default roles for the organization
		const defaultRoles = [
			{
				name: "admin",
				displayName: "Administrator",
				description: "Full access to all organization resources",
			},
			{
				name: "manager",
				displayName: "Manager",
				description: "Can manage projects and team members",
			},
			{
				name: "member",
				displayName: "Member",
				description: "Can view and contribute to projects",
			},
			{
				name: "viewer",
				displayName: "Viewer",
				description: "Can only view organization content",
			},
		];

		let adminRole: any = null;

		for (const roleData of defaultRoles) {
			const roleId = await ctx.db.insert("roles", {
				organizationId,
				name: roleData.name,
				displayName: roleData.displayName,
				description: roleData.description,
				isSystem: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});

			if (roleData.name === "admin") {
				adminRole = await ctx.db.get(roleId);
			}
		}

		// Add the user as an organization member with admin role
		await ctx.db.insert("organizationMembers", {
			organizationId,
			userId: user._id,
			roleId: adminRole!._id,
			joinedAt: Date.now(),
			invitedBy: undefined,
			isActive: true,
		});

		// Update user's current organization
		await ctx.db.patch(user._id, {
			currentOrganizationId: organizationId,
		});

		return { organizationId, slug };
	},
});

// Get organization by ID
export const get = query({
	args: { organizationId: v.id("organizations") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const organization = await ctx.db.get(args.organizationId);
		if (!organization) {
			throw new Error("Organization not found");
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

		return organization;
	},
});

// Get organization by slug
export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const organization = await ctx.db
			.query("organizations")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.first();

		if (!organization) {
			return null;
		}

		// For public access, return limited information
		return {
			_id: organization._id,
			name: organization.name,
			description: organization.description,
			logoUrl: organization.logoUrl,
		};
	},
});

// Get user's organizations
export const getUserOrganizations = query({
	handler: async (ctx) => {
		// Try to get user by auth ID first
		const authUserId = await auth.getUserId(ctx);
		let user = null;

		if (authUserId) {
			// Try to get user by auth ID
			const userById = await ctx.db.get(authUserId);
			if (userById && "email" in userById) {
				user = userById as any;
			}
		}

		if (!user) {
			// Fall back to identity lookup
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) {
				throw new Error("Not authenticated");
			}

			// Extract email from identity
			const email =
				(typeof identity.email === "string" ? identity.email : null) ||
				(typeof identity.preferredUsername === "string"
					? identity.preferredUsername
					: null) ||
				(typeof identity.emailVerified === "string"
					? identity.emailVerified
					: null) ||
				(typeof identity.subject === "string" ? identity.subject : null);

			if (email) {
				// Get all users with this email
				const usersWithEmail = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", email))
					.collect();
				
				if (usersWithEmail.length > 0) {
					// Prefer user with currentOrganizationId set
					user = usersWithEmail.find(u => u.currentOrganizationId) || usersWithEmail[0];
				}
			}
		}

		if (!user) {
			// If user doesn't exist, return empty organizations
			// They need to be invited to an organization first
			return [];
		}

		console.log(
			"[getUserOrganizations] Looking for memberships for user:",
			user._id,
			user.email,
		);

		// Get all organization memberships
		const memberships = await ctx.db
			.query("organizationMembers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.filter((q) => q.eq(q.field("isActive"), true))
			.collect();

		console.log(
			"[getUserOrganizations] Found memberships:",
			memberships.length,
		);

		// Get organization details for each membership
		const organizations = await Promise.all(
			memberships.map(async (membership) => {
				const org = await ctx.db.get(membership.organizationId);
				const role = await ctx.db.get(membership.roleId);
				return {
					...org!,
					membership: {
						roleId: membership.roleId,
						roleName: role?.name,
						roleDisplayName: role?.displayName,
						joinedAt: membership.joinedAt,
					},
				};
			}),
		);

		return organizations;
	},
});

// Update organization
export const update = mutation({
	args: {
		organizationId: v.id("organizations"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		website: v.optional(v.string()),
		settings: v.optional(
			v.object({
				allowInvites: v.boolean(),
				requireEmailVerification: v.boolean(),
				defaultRoleId: v.optional(v.id("roles")),
			}),
		),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Check if user has permission to update organization
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

		const { organizationId, ...updateData } = args;

		// Update organization
		await ctx.db.patch(organizationId, {
			...updateData,
			updatedAt: Date.now(),
		});

		return { success: true };
	},
});

// Switch current organization
export const switchOrganization = mutation({
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

		// Check if user is a member of the organization
		const membership = await ctx.db
			.query("organizationMembers")
			.withIndex("by_org_user", (q) =>
				q.eq("organizationId", args.organizationId).eq("userId", user._id),
			)
			.first();

		if (!membership || !membership.isActive) {
			throw new Error("Not a member of this organization");
		}

		// Update user's current organization
		await ctx.db.patch(user._id, {
			currentOrganizationId: args.organizationId,
		});

		return { success: true };
	},
});
