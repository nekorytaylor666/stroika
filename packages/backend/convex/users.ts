import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";

// Get current authenticated user (now uses the one from auth.ts)
export { getCurrentUser, viewer, me } from "./auth";

// Queries
export const getAll = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		// Check if user is authenticated using Better Auth

		try {
			const { users } = await auth.api.listUsers({
				query: {
					limit: 100,
					offset: 0,
				},
				headers,
			});
			return users;
		} catch (error) {
			console.error("Failed to list users:", error);
			return [];
		}
	},
});

// Update current user's profile
export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Get user from Better Auth
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Get user from users table
		let user = await ctx.db
			.query("users")
			.withIndex("by_betterAuthId", (q) =>
				q.eq("betterAuthId", authUser.userId),
			)
			.first();

		if (!user && authUser.email) {
			// Fallback to email lookup
			user = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", authUser.email))
				.first();
		}

		if (!user) {
			throw new Error("User not found");
		}

		const updates: Partial<{
			name: string;
			phone: string;
		}> = {};
		if (args.name !== undefined) updates.name = args.name;
		if (args.phone !== undefined) updates.phone = args.phone;

		await ctx.db.patch(user._id, updates);

		return { success: true };
	},
});

// Alias for getAll for compatibility
export const list = query({
	handler: async (ctx) => {
		return await ctx.db.query("users").collect();
	},
});

export const getById = query({
	args: { id: v.string() },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const user = await auth.api.getUser({
			query: {
				id: args.id,
			},
			headers,
		});
		return user;
	},
});

// Alias for getById for compatibility with frontend
export const get = query({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		const user = await auth.api.getUser({
			query: {
				id: args.userId,
			},
			headers,
		});
		return user;
	},
});

// Sync Better Auth user to users table
export const syncBetterAuthUser = mutation({
	args: {},
	handler: async (ctx) => {
		// Get the Better Auth user
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("No authenticated user found");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("No authenticated user found");
		}

		// Check if user already exists in users table by betterAuthId
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_betterAuthId", (q) =>
				q.eq("betterAuthId", authUser.userId),
			)
			.first();

		if (existingUser) {
			// User already synced, update if needed
			await ctx.db.patch(existingUser._id, {
				email: authUser.email || existingUser.email,
				name: authUser.name || existingUser.name,
				avatarUrl: authUser.image || existingUser.avatarUrl,
			});
			return existingUser;
		}

		// Check if user exists by email (fallback for old users)
		const userByEmail = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", authUser.email!))
			.first();

		if (userByEmail) {
			// Update existing user with Better Auth ID
			await ctx.db.patch(userByEmail._id, {
				betterAuthId: authUser.userId,
				name: authUser.name || userByEmail.name,
				avatarUrl: authUser.image || userByEmail.avatarUrl,
			});
			return userByEmail;
		}

		// Create new user in users table
		const newUserId = await ctx.db.insert("users", {
			betterAuthId: authUser.userId,
			email: authUser.email!,
			name: authUser.name || authUser.email!.split("@")[0],
			avatarUrl: authUser.image,
			phone: null,
			isActive: true,
			createdAt: new Date().toISOString(),
			currentOrganizationId: null, // Will be set when they join an organization
		});

		return await ctx.db.get(newUserId);
	},
});

// Ensure user exists in users table (call after authentication)
export const ensureUserExists = mutation({
	args: {},
	handler: async (ctx) => {
		// Try Better Auth first
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			// User not authenticated via Better Auth
			authUser = null;
		}
		if (authUser && authUser.userId) {
			// Check if user exists in users table by betterAuthId
			const existingUser = await ctx.db
				.query("users")
				.withIndex("by_betterAuthId", (q) =>
					q.eq("betterAuthId", authUser.userId),
				)
				.first();

			if (!existingUser) {
				// Check if user exists by email (fallback for old users)
				const userByEmail = await ctx.db
					.query("users")
					.withIndex("by_email", (q) => q.eq("email", authUser.email!))
					.first();

				if (userByEmail) {
					// Update existing user with Better Auth ID
					await ctx.db.patch(userByEmail._id, {
						betterAuthId: authUser.userId,
						name: authUser.name || userByEmail.name,
						avatarUrl: authUser.image || userByEmail.avatarUrl,
					});
				} else {
					// Create the user in users table
					await ctx.db.insert("users", {
						betterAuthId: authUser.userId,
						email: authUser.email!,
						name: authUser.name || authUser.email!.split("@")[0],
						avatarUrl: authUser.image,
						phone: null,
						isActive: true,
						createdAt: new Date().toISOString(),
						currentOrganizationId: null,
					});
				}
			}
			return { success: true };
		}

		// Fallback to identity
		const identity = await ctx.auth.getUserIdentity();
		if (!identity || !identity.email) {
			throw new Error("No authenticated user found");
		}

		// Check if user exists by email
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", identity.email!))
			.first();

		if (!existingUser) {
			// Create new user
			await ctx.db.insert("users", {
				email: identity.email,
				name: identity.name || identity.email.split("@")[0],
				avatarUrl: identity.pictureUrl,
				phone: null,
				isActive: true,
				createdAt: new Date().toISOString(),
				currentOrganizationId: null,
			});
		}

		return { success: true };
	},
});

export const getByEmail = query({
	args: { email: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();
	},
});

export const getUsersWithRoles = query({
	handler: async (ctx) => {
		// Get authenticated user using Better Auth
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// Get active organization
		const user = await ctx.db
			.query("users")
			.withIndex("by_betterAuthId", (q) =>
				q.eq("betterAuthId", authUser.userId),
			)
			.first();

		const organizationId =
			authUser.activeOrganizationId || user?.currentOrganizationId;
		if (!organizationId) {
			return [];
		}

		// Get all members from organization members table (temporary compatibility)
		// TODO: Migrate to Better Auth member table once fully integrated
		const members = await ctx.db
			.query("organizationMembers")
			.withIndex("by_organization", (q) =>
				q.eq("organizationId", organizationId as Id<"organizations">),
			)
			.collect();

		// Get user details with their roles
		const usersWithRoles = await Promise.all(
			members.map(async (member) => {
				// Get user from users table directly
				const memberUser = await ctx.db.get(member.userId);
				if (!memberUser) return null;

				// Get role information
				const role = await ctx.db.get(member.roleId);

				return {
					...memberUser,
					role: role?.name || "member",
					roleName: role?.displayName || role?.name || "Member",
				};
			}),
		);

		return usersWithRoles.filter(Boolean);
	},
});

export const getByStatus = query({
	args: {
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.filter((q) => q.eq(q.field("status"), args.status))
			.collect();
	},
});

export const searchUsers = query({
	args: { searchTerm: v.string() },
	handler: async (ctx, args) => {
		const allUsers = await ctx.db.query("users").collect();
		const searchTerm = args.searchTerm.toLowerCase();

		return allUsers.filter(
			(user) =>
				user.name.toLowerCase().includes(searchTerm) ||
				user.email.toLowerCase().includes(searchTerm) ||
				user.position?.toLowerCase().includes(searchTerm),
		);
	},
});

// Mutations
export const create = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		avatarUrl: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
		),
		joinedDate: v.optional(v.string()),
		teamIds: v.optional(v.array(v.string())),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		betterAuthId: v.optional(v.string()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Check if user is authenticated and has permission
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		return await ctx.db.insert("users", {
			...args,
			isActive: args.isActive ?? true,
			createdAt: new Date().toISOString(),
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("users"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		status: v.optional(
			v.union(v.literal("online"), v.literal("offline"), v.literal("away")),
		),
		teamIds: v.optional(v.array(v.string())),
		position: v.optional(v.string()),
		workload: v.optional(v.number()),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Check if user is authenticated
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		const { id, ...updates } = args;

		// Get current user and check permissions
		const currentUser = await getCurrentUserHelper(ctx);
		if (!currentUser) {
			throw new Error("Пользователь не аутентифицирован");
		}

		// Check if user has permission to update users
		const hasPermission = await checkPermission(
			ctx,
			currentUser._id,
			"users",
			"update",
		);

		if (!hasPermission) {
			throw new Error("У вас нет прав для редактирования пользователей");
		}

		// If email is being updated, check if it's already in use
		if (updates.email) {
			const existingUser = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", updates.email))
				.first();

			if (existingUser && existingUser._id !== id) {
				throw new Error(
					"Электронная почта уже используется другим пользователем",
				);
			}
		}

		await ctx.db.patch(id, updates);
		return { success: true };
	},
});

export const updateStatus = mutation({
	args: {
		id: v.id("users"),
		status: v.union(
			v.literal("online"),
			v.literal("offline"),
			v.literal("away"),
		),
	},
	handler: async (ctx, args) => {
		// Check if user is authenticated
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		await ctx.db.patch(args.id, { status: args.status });
		return { success: true };
	},
});

export const deleteUser = mutation({
	args: { id: v.id("users") },
	handler: async (ctx, args) => {
		// Check if user is authenticated and has admin permissions
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

		if (!authUser || !authUser.userId) {
			throw new Error("Not authenticated");
		}

		// TODO: Check if user has admin permissions in their organization

		await ctx.db.delete(args.id);
		return { success: true };
	},
});

export const updateUserRole = mutation({
	args: {
		userId: v.id("users"),
		organizationId: v.string(),
		role: v.string(), // Better Auth uses string roles (owner, admin, member)
	},
	handler: async (ctx, args) => {
		// Check if user is authenticated and has permission
		let authUser;
		try {
			authUser = await authComponent.getAuthUser(ctx);
		} catch (error) {
			throw new Error("Not authenticated");
		}

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

		// Update the member's role in Better Auth member table
		const targetMembership = await ctx.db
			.query("member")
			.filter((q) =>
				q.and(
					q.eq(q.field("organizationId"), args.organizationId),
					q.eq(q.field("userId"), args.userId),
				),
			)
			.first();

		if (!targetMembership) {
			throw new Error("Member not found in organization");
		}

		await ctx.db.patch(targetMembership._id, { role: args.role });
		return { success: true };
	},
});
