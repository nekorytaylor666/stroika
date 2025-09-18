import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Re-export the old auth for backward compatibility temporarily
export { auth } from "./auth.old";

// Export Better Auth functions
export { createUser, updateUser, deleteUser, getUserByEmail } from "./betterAuth/index";

// Query functions for getting current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    // The subject is the user ID from Better Auth
    const userId = identity.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    
    if (!user) {
      return null;
    }
    
    return user;
  },
});

// Alias for backward compatibility
export const viewer = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const userId = identity.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    
    return user;
  },
});

// Alias for backward compatibility  
export const me = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const userId = identity.subject as Id<"users">;
    const user = await ctx.db.get(userId);
    
    return user;
  },
});