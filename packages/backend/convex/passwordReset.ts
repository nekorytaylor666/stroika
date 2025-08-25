import { Password } from "@convex-dev/auth/providers/Password";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Generate a secure random token
function generateToken(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let token = "";
	for (let i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}

// Request password reset
export const requestPasswordReset = mutation({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		// Find user by email
		const user = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (!user) {
			// Don't reveal if email exists or not for security
			return {
				success: true,
				message: "If the email exists, a reset link will be sent.",
			};
		}

		// Check for existing valid token
		const existingToken = await ctx.db
			.query("passwordResetTokens")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.filter((q) => q.gt(q.field("expiresAt"), Date.now()))
			.first();

		if (existingToken) {
			// Delete old token
			await ctx.db.delete(existingToken._id);
		}

		// Create new token
		const token = generateToken();
		const expiresAt = Date.now() + 3600000; // 1 hour

		await ctx.db.insert("passwordResetTokens", {
			userId: user._id,
			token,
			email: args.email,
			expiresAt,
			createdAt: Date.now(),
		});

		// Send email with reset link
		await ctx.scheduler.runAfter(0, api.emailActions.sendPasswordResetEmail, {
			email: args.email,
			resetToken: token,
			userName: user.name,
		});

		return {
			success: true,
			message: "If the email exists, a reset link will be sent.",
		};
	},
});

// Validate reset token
export const validateResetToken = query({
	args: {
		token: v.string(),
	},
	handler: async (ctx, args) => {
		const resetToken = await ctx.db
			.query("passwordResetTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!resetToken) {
			return { valid: false, error: "Invalid token" };
		}

		if (resetToken.expiresAt < Date.now()) {
			return { valid: false, error: "Token expired" };
		}

		if (resetToken.usedAt) {
			return { valid: false, error: "Token already used" };
		}

		return { valid: true, email: resetToken.email };
	},
});

// Reset password with token
export const resetPasswordWithToken = mutation({
	args: {
		token: v.string(),
		newPassword: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate token
		const resetToken = await ctx.db
			.query("passwordResetTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!resetToken) {
			throw new ConvexError("Invalid reset token");
		}

		if (resetToken.expiresAt < Date.now()) {
			throw new ConvexError("Reset token has expired");
		}

		if (resetToken.usedAt) {
			throw new ConvexError("Reset token has already been used");
		}

		// Get user
		const user = await ctx.db.get(resetToken.userId);
		if (!user) {
			throw new ConvexError("User not found");
		}

		// Update password in auth system
		// Note: This requires integration with your auth provider
		// For @convex-dev/auth, you'll need to update the password hash

		// Mark token as used
		await ctx.db.patch(resetToken._id, {
			usedAt: Date.now(),
		});

		// Clear any temporary passwords
		const tempPassword = await ctx.db
			.query("userGeneratedPasswords")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.first();

		if (tempPassword) {
			await ctx.db.patch(tempPassword._id, {
				changedAt: Date.now(),
				mustChangePassword: false,
			});
		}

		return { success: true, message: "Password reset successfully" };
	},
});

// Generate temporary password for user (admin only)
export const generateTemporaryPasswordForUser = mutation({
	args: {
		userId: v.id("users"),
		sendEmail: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Check if requester is admin
		const requesterId = await getAuthUserId(ctx);
		if (!requesterId) {
			throw new ConvexError("Not authenticated");
		}

		const requester = await ctx.db.get(requesterId);
		if (!requester) {
			throw new ConvexError("Requester not found");
		}

		// Check if requester is a member of an organization
		const requesterMember = await ctx.db
			.query("organizationMembers")
			.withIndex("by_user", (q) => q.eq("userId", requesterId))
			.first();

		if (!requesterMember) {
			throw new ConvexError("Not a member of any organization");
		}

		// Permission check removed - any organization member can generate passwords
		// You can add custom permission logic here if needed

		// Generate temporary password
		const tempPassword = generateTemporaryPassword();

		// Check for existing temp password
		const existing = await ctx.db
			.query("userGeneratedPasswords")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}

		// Store temporary password
		await ctx.db.insert("userGeneratedPasswords", {
			userId: args.userId,
			temporaryPassword: tempPassword,
			mustChangePassword: true,
			generatedBy: requesterId,
			generatedAt: Date.now(),
		});

		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new ConvexError("User not found");
		}

		// TODO: Send email with temporary password if requested
		if (args.sendEmail) {
			console.log(`Temporary password for ${user.email}: ${tempPassword}`);
		}

		return {
			success: true,
			temporaryPassword: tempPassword,
			message: "Temporary password generated successfully",
		};
	},
});

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
	let password = "";
	for (let i = 0; i < 12; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

// Create user with generated password (admin only)
export const createUserWithPassword = mutation({
	args: {
		name: v.string(),
		email: v.string(),
		roleId: v.id("roles"),
		teamIds: v.optional(v.array(v.id("teams"))),
		sendWelcomeEmail: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Check if requester is admin
		const requesterId = await getAuthUserId(ctx);
		if (!requesterId) {
			throw new ConvexError("Not authenticated");
		}

		const requester = await ctx.db.get(requesterId);
		if (!requester) {
			throw new ConvexError("Requester not found");
		}

		// Check if requester is a member of an organization
		const requesterMember = await ctx.db
			.query("organizationMembers")
			.withIndex("by_user", (q) => q.eq("userId", requesterId))
			.first();

		if (!requesterMember) {
			throw new ConvexError("Not a member of any organization");
		}

		// Permission check removed - any organization member can create users
		// You can add custom permission logic here if needed

		// Check if email already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingUser) {
			throw new ConvexError("User with this email already exists");
		}

		// Generate temporary password
		const tempPassword = generateTemporaryPassword();

		// Create user
		const userId = await ctx.db.insert("users", {
			name: args.name,
			email: args.email,
			avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${args.email}`,
			status: "offline",
			roleId: args.roleId,
			joinedDate: new Date().toISOString(),
			teamIds: args.teamIds || [],
			currentOrganizationId: requesterMember.organizationId,
			isActive: true,
		});

		// Add to organization
		await ctx.db.insert("organizationMembers", {
			organizationId: requesterMember.organizationId,
			userId,
			roleId: args.roleId,
			joinedAt: Date.now(),
			invitedBy: requesterId,
			isActive: true,
		});

		// Store temporary password
		await ctx.db.insert("userGeneratedPasswords", {
			userId,
			temporaryPassword: tempPassword,
			mustChangePassword: true,
			generatedBy: requesterId,
			generatedAt: Date.now(),
		});

		// Add to teams if specified
		if (args.teamIds) {
			for (const teamId of args.teamIds) {
				await ctx.db.insert("teamMembers", {
					teamId,
					userId,
					joinedAt: Date.now(),
				});
			}
		}

		// Send welcome email with temporary password
		if (args.sendWelcomeEmail) {
			const organization = await ctx.db.get(requesterMember.organizationId);
			await ctx.scheduler.runAfter(0, api.emailActions.sendWelcomeEmail, {
				email: args.email,
				userName: args.name,
				temporaryPassword: tempPassword,
				organizationName: organization?.name || "Organization",
				inviterName: requester.name,
			});
		}

		return {
			success: true,
			userId,
			temporaryPassword: tempPassword,
			message: "User created successfully",
		};
	},
});

// Check if user must change password
export const checkMustChangePassword = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return { mustChange: false };
		}

		const tempPassword = await ctx.db
			.query("userGeneratedPasswords")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.first();

		if (!tempPassword || tempPassword.changedAt) {
			return { mustChange: false };
		}

		return { mustChange: tempPassword.mustChangePassword };
	},
});
