import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// These are the required exports for Better Auth component

export const createUser = internalMutation({
  args: {
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists (for migration)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingUser) {
      // Update existing user with Better Auth data
      await ctx.db.patch(existingUser._id, {
        name: args.name || existingUser.name,
        lastLogin: new Date().toISOString(),
        isActive: true,
      });
      return existingUser._id;
    }

    // Create new user with all the required fields
    const userId = await ctx.db.insert("users", {
      name: args.name || "Unknown User",
      email: args.email,
      avatarUrl: args.image || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(args.name || args.email)}`,
      status: "offline" as const,
      joinedDate: new Date().toISOString(),
      teamIds: [],
      isActive: true,
      lastLogin: new Date().toISOString(),
    });
    
    return userId;
  },
});

export const updateUser = internalMutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.email !== undefined) updates.email = args.email;
    if (args.name !== undefined) updates.name = args.name;
    if (args.image !== undefined) updates.avatarUrl = args.image;
    updates.lastLogin = new Date().toISOString();
    
    await ctx.db.patch(args.id, updates);
  },
});

export const deleteUser = internalMutation({
  args: { 
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Soft delete by marking as inactive
    await ctx.db.patch(args.id, {
      isActive: false,
    });
  },
});

export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) return null;
    
    return {
      id: user._id,
      email: user.email,
      emailVerified: true,
      name: user.name,
      image: user.avatarUrl,
    };
  },
});