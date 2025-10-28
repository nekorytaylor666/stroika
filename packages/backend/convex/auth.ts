import { createClient } from "@convex-dev/better-auth";
import type { AuthFunctions, GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { api, components } from "./_generated/api";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { ac } from "./betterAuth/permissions";
import authSchema from "./betterAuth/schema";
const siteUrl = process.env.SITE_URL!;

// Import the old auth for modification
import { admin, organization } from "better-auth/plugins";

// Helper function for backward compatibility with auth.getUserId pattern
const getUserId = async (ctx: any) => {
	const authUser = await authComponent.getAuthUser(ctx);
	if (authUser && authUser.userId) {
		return authUser.userId as Id<"users">;
	}

	// Fall back to old auth system
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return null;

	// Try to find user by email from identity
	if (identity.email) {
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q: any) =>
				q.eq("email", identity.email as string),
			)
			.first();
		return user?._id || null;
	}

	return null;
};

// Export auth with getUserId method for backward compatibility
export const auth = {
	getUserId,
};
const authFunctions: AuthFunctions = internal.auth;

// Export Better Auth functions
export const authComponent = createClient<DataModel, typeof authSchema>(
	components.betterAuth,
	{
		authFunctions,

		local: {
			schema: authSchema,
		},
		verbose: true,

		triggers: {
			user: {
				onCreate: async (ctx, doc) => {
					console.log("user created", doc);
					await ctx.db.insert("users", {
						email: doc.email || "",
						name: doc.name,
						avatarUrl: doc.image || "",
						authId: doc._id || "",
						createdAt: new Date().toISOString(),
					});
					// Note: You'll need to adapt this logic based on your actual user creation flow
					// The doc here is the Better Auth user document, not your custom users table
				},
				onUpdate: async (ctx, newDoc, oldDoc) => {
					// Both old and new documents are available so you can compare and detect
					// changes - you can ignore oldDoc if you don't need it.
					console.log("user updated", newDoc, oldDoc);
					const user = await ctx.db
						.query("users")
						.withIndex("by_betterAuthId", (q) =>
							q.eq("betterAuthId", newDoc.userId || ""),
						)
						.first();
					if (user) {
						await ctx.db.patch(user._id, {
							email: newDoc.email || user.email,
							name: newDoc.name || user.name,
							avatarUrl: newDoc.image || user.avatarUrl,
						});
					}
				},
				onDelete: async (ctx, doc) => {
					// The entire deleted document is available
					console.log("user deleted", doc);
					const user = await ctx.db
						.query("users")
						.withIndex("by_betterAuthId", (q) =>
							q.eq("betterAuthId", doc.userId || ""),
						)
						.first();
					if (user) {
						await ctx.db.delete(user._id);
					}
				},
			},
		},
	},
);
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false },
) => {
	return betterAuth({
		// disable logging when createAuth is called just to generate options.
		// this is not required, but there's a lot of noise in logs without it.

		logger: {
			disabled: optionsOnly,
		},
		session: {
			expiresIn: 60 * 60 * 24, // 1 day
		},
		trustedOrigins: [siteUrl],
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		secret: process.env.BETTER_AUTH_SECRET,
		plugins: [
			// The cross domain plugin is required for client side frameworks
			crossDomain({ siteUrl }),
			admin(),
			organization({
				ac: {
					...ac,
				},
				dynamicAccessControl: {
					enabled: true,
				},
				teams: {
					enabled: true,
					maximumTeams: 10, // Optional: limit teams per organization
					allowRemovingAllTeams: false, // Optional: prevent removing the last team
				},
				organizationHooks: {
					beforeCreateTeam: async ({ team, user, organization }) => {
						console.log("beforeCreateTeam", team, user, organization);
					},
					afterCreateTeam: async ({ team, user, organization }) => {
						console.log("afterCreateTeam", team, user, organization);
					},
					beforeAddTeamMember: async ({ team, user, organization }) => {
						console.log("beforeAddTeamMember", team, user, organization);
					},
					afterAddTeamMember: async ({ team, user, organization }) => {
						console.log("afterAddTeamMember", team, user, organization);
					},
					beforeRemoveTeamMember: async ({ team, user, organization }) => {
						console.log("beforeRemoveTeamMember", team, user, organization);
					},
				},
			}),

			// The Convex plugin is required for Convex compatibility
			convex(),
		],
	});
};
// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		// Try to get auth user first - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User is not authenticated via Better Auth
			authUser = null;
		}

		if (!authUser || !authUser.userId) {
			// Fall back to old auth system for backward compatibility
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) return null; // Return null for unauthenticated users

			// Try to find user by email from identity
			if (identity.email) {
				const user = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", identity.email as string))
					.first();
				return user; // Return null if not found
			}

			return null; // No email in identity
		}

		// Try multiple methods to get the user from the users table
		let user = await ctx.db.get(authUser.userId as Id<"users">);

		if (!user) {
			// Try to find by betterAuthId
			user = await ctx.db
				.query("users")
				.withIndex("by_betterAuthId", (q) =>
					q.eq("betterAuthId", authUser.userId),
				)
				.first();
		}

		if (!user && authUser.email) {
			// Try to find by email as fallback
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", authUser.email))
				.first();
		}

		if (!user) return null; // Return null if user not found

		return {
			...user,
			email: authUser.email || user.email,
			name: authUser.name || user.name,
			image: authUser.image || user.avatarUrl,
		};
	},
});

// Alias for backward compatibility
export const viewer = query({
	handler: async (ctx) => {
		// Try to get auth user first - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User is not authenticated via Better Auth
			authUser = null;
		}

		if (!authUser || !authUser.userId) {
			// Fall back to old auth system for backward compatibility
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) return null; // Return null instead of throwing for unauthenticated users

			// Try to find user by email from identity
			if (identity.email) {
				const user = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", identity.email as string))
					.first();
				return user; // Return null if user not found instead of throwing
			}

			return null; // No email in identity
		}

		// Try multiple methods to get the user from the users table
		let user = await ctx.db.get(authUser.userId as Id<"users">);

		if (!user) {
			// Try to find by betterAuthId
			user = await ctx.db
				.query("users")
				.withIndex("by_betterAuthId", (q) =>
					q.eq("betterAuthId", authUser.userId),
				)
				.first();
		}

		if (!user && authUser.email) {
			// Try to find by email as fallback
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", authUser.email))
				.first();
		}

		if (!user) return null; // Return null if user not found

		return {
			...user,
			email: authUser.email || user.email,
			name: authUser.name || user.name,
			image: authUser.image || user.avatarUrl,
		};
	},
});

// Alias for backward compatibility
export const me = query({
	handler: async (ctx) => {
		// Try to get auth user first - wrap in try/catch to handle unauthenticated state
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User is not authenticated via Better Auth
			authUser = null;
		}

		if (!authUser || !authUser.userId) {
			// Fall back to old auth system for backward compatibility
			const identity = await ctx.auth.getUserIdentity();
			if (!identity) return null; // Return null instead of throwing for unauthenticated users

			// Try to find user by email from identity
			if (identity.email) {
				const user = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", identity.email as string))
					.first();
				return user; // Return null if user not found instead of throwing
			}

			return null; // No email in identity
		}

		// Try multiple methods to get the user from the users table
		let user = await ctx.db.get(authUser.userId as Id<"users">);

		if (!user) {
			// Try to find by betterAuthId
			user = await ctx.db
				.query("users")
				.withIndex("by_betterAuthId", (q) =>
					q.eq("betterAuthId", authUser.userId),
				)
				.first();
		}

		if (!user && authUser.email) {
			// Try to find by email as fallback
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", authUser.email))
				.first();
		}

		if (!user) return null; // Return null if user not found

		return {
			...user,
			email: authUser.email || user.email,
			name: authUser.name || user.name,
			image: authUser.image || user.avatarUrl,
		};
	},
});
