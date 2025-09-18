import { v } from "convex/values";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { createClient } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth";
import type { GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
const siteUrl = process.env.SITE_URL!;

// Re-export the old auth for backward compatibility temporarily
export { auth } from "./auth.old";

// Export Better Auth functions
export const authComponent = createClient<DataModel>(components.betterAuth);
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
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;
    
    // Get the full user data from the users table
    const user = await ctx.db.get(authUser.userId as Id<"users">);
    if (!user) return null;
    
    return {
      ...user,
      ...authUser,
    };
  },
});

// Alias for backward compatibility
export const viewer = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;
    
    // Get the full user data from the users table
    const user = await ctx.db.get(authUser.userId as Id<"users">);
    if (!user) return null;
    
    return {
      ...user,
      ...authUser,
    };
  },
});

// Alias for backward compatibility  
export const me = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) return null;
    
    // Get the full user data from the users table
    const user = await ctx.db.get(authUser.userId as Id<"users">);
    if (!user) return null;
    
    return {
      ...user,
      ...authUser,
    };
  },
});
