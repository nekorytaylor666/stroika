import { Password } from "@convex-dev/auth/providers/Password";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Development helper to create a test user
export const createTestUser = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingUser) {
			console.log("User already exists:", existingUser._id);
			return {
				success: false,
				message: "User already exists",
				userId: existingUser._id,
			};
		}

		// Create user in users table
		const userId = await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
			avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${args.email}`,
			status: "offline",
			joinedDate: new Date().toISOString(),
			teamIds: [],
			isActive: true,
		});

		// Create auth account
		const hashedPassword = await new Password().hashPassword(args.password);

		await ctx.db.insert("authAccounts", {
			userId,
			provider: "Password",
			providerAccountId: args.email,
			emailVerified: new Date().toISOString(),
			// Store the password hash in a way compatible with @convex-dev/auth
			providerData: {
				passwordHash: hashedPassword,
			},
		});

		// If there's an organization, add the user to it
		const firstOrg = await ctx.db.query("organizations").first();
		if (firstOrg) {
			// Get a default role
			const memberRole = await ctx.db
				.query("roles")
				.filter((q) => q.eq(q.field("name"), "member"))
				.first();

			if (memberRole) {
				await ctx.db.insert("organizationMembers", {
					organizationId: firstOrg._id,
					userId,
					roleId: memberRole._id,
					joinedAt: Date.now(),
					isActive: true,
				});

				// Update user's current organization
				await ctx.db.patch(userId, {
					currentOrganizationId: firstOrg._id,
				});
			}
		}

		return {
			success: true,
			message: "Test user created successfully",
			userId,
			email: args.email,
		};
	},
});

// Development helper to list all organizations
export const listOrganizations = mutation({
	args: {},
	handler: async (ctx) => {
		const orgs = await ctx.db.query("organizations").collect();
		return orgs.map((o) => ({
			id: o._id,
			name: o.name,
			slug: o.slug,
		}));
	},
});
