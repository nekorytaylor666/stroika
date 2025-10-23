import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { createClient } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth";
import type { GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import authSchema from "./betterAuth/schema";

const siteUrl = process.env.SITE_URL!;

// Import the old auth for modification
import { auth as oldAuth } from "./auth.old";
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
      .withIndex("by_email", (q: any) => q.eq("email", identity.email as string))
      .first();
    return user?._id || null;
  }

  return null;
};

// Export auth with getUserId method for backward compatibility
export const auth = {
  ...oldAuth,
  getUserId,
};

// Export Better Auth functions
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
);
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
    plugins: [
      // The cross domain plugin is required for client side frameworks
      crossDomain({ siteUrl }),
      admin(),
      organization({
        teams: {
          enabled: true,
          maximumTeams: 10, // Optional: limit teams per organization
          allowRemovingAllTeams: false, // Optional: prevent removing the last team
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
        .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", authUser.userId))
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
        .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", authUser.userId))
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
        .withIndex("by_betterAuthId", (q) => q.eq("betterAuthId", authUser.userId))
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
