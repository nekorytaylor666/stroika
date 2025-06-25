import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { logPermissionChange, requirePermission } from "../permissions/utils";

export const createDepartment = mutation({
	args: {
		name: v.string(),
		displayName: v.string(),
		description: v.optional(v.string()),
		parentId: v.optional(v.id("departments")),
		headUserId: v.optional(v.id("users")),
	},
	handler: async (ctx, args) => {
		// TODO: Get current user ID from auth
		// For now, we'll skip permission check
		// await requirePermission(ctx, userId, "teams", "create");

		const now = new Date().toISOString();

		// Determine level based on parent
		let level = 0;
		if (args.parentId) {
			const parent = await ctx.db.get(args.parentId);
			if (!parent) {
				throw new Error("Parent department not found");
			}
			level = parent.level + 1;
		}

		const departmentId = await ctx.db.insert("departments", {
			name: args.name,
			displayName: args.displayName,
			description: args.description,
			parentId: args.parentId,
			level,
			headUserId: args.headUserId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		// TODO: Log the action
		// await logPermissionChange(ctx, userId, "department_created", undefined, undefined, { departmentId });

		return departmentId;
	},
});

export const updateDepartment = mutation({
	args: {
		id: v.id("departments"),
		displayName: v.optional(v.string()),
		description: v.optional(v.string()),
		headUserId: v.optional(v.id("users")),
		isActive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// TODO: Check permissions
		// await requirePermission(ctx, userId, "teams", "update");

		const department = await ctx.db.get(args.id);
		if (!department) {
			throw new Error("Department not found");
		}

		await ctx.db.patch(args.id, {
			...(args.displayName !== undefined && { displayName: args.displayName }),
			...(args.description !== undefined && { description: args.description }),
			...(args.headUserId !== undefined && { headUserId: args.headUserId }),
			...(args.isActive !== undefined && { isActive: args.isActive }),
			updatedAt: new Date().toISOString(),
		});

		return { success: true };
	},
});

export const assignUserToDepartment = mutation({
	args: {
		userId: v.id("users"),
		departmentId: v.id("departments"),
		positionId: v.optional(v.id("organizationalPositions")),
		isPrimary: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// TODO: Check permissions
		// await requirePermission(ctx, currentUserId, "users", "update");

		const now = new Date().toISOString();

		// Check if user and department exist
		const user = await ctx.db.get(args.userId);
		const department = await ctx.db.get(args.departmentId);

		if (!user) throw new Error("User not found");
		if (!department) throw new Error("Department not found");

		// If setting as primary, unset other primary assignments
		if (args.isPrimary) {
			const existingPrimary = await ctx.db
				.query("userDepartments")
				.withIndex("by_user_primary", (q) =>
					q.eq("userId", args.userId).eq("isPrimary", true),
				)
				.collect();

			for (const assignment of existingPrimary) {
				await ctx.db.patch(assignment._id, { isPrimary: false });
			}
		}

		// Check if assignment already exists
		const existing = await ctx.db
			.query("userDepartments")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("departmentId"), args.departmentId))
			.first();

		if (existing) {
			// Update existing assignment
			await ctx.db.patch(existing._id, {
				positionId: args.positionId,
				isPrimary: args.isPrimary ?? existing.isPrimary,
			});
		} else {
			// Create new assignment
			await ctx.db.insert("userDepartments", {
				userId: args.userId,
				departmentId: args.departmentId,
				positionId: args.positionId,
				isPrimary: args.isPrimary ?? false,
				startDate: now,
				createdAt: now,
			});
		}

		// TODO: Log the action
		// await logPermissionChange(ctx, currentUserId, "user_assigned_to_department", args.userId);

		return { success: true };
	},
});

export const removeUserFromDepartment = mutation({
	args: {
		userId: v.id("users"),
		departmentId: v.id("departments"),
	},
	handler: async (ctx, args) => {
		// TODO: Check permissions
		// await requirePermission(ctx, currentUserId, "users", "update");

		const assignment = await ctx.db
			.query("userDepartments")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("departmentId"), args.departmentId))
			.filter((q) => q.eq(q.field("endDate"), undefined))
			.first();

		if (!assignment) {
			throw new Error("User is not assigned to this department");
		}

		// Set end date instead of deleting
		await ctx.db.patch(assignment._id, {
			endDate: new Date().toISOString(),
		});

		// TODO: Log the action
		// await logPermissionChange(ctx, currentUserId, "user_removed_from_department", args.userId);

		return { success: true };
	},
});

export const assignRole = mutation({
	args: {
		userId: v.id("users"),
		roleId: v.id("roles"),
	},
	handler: async (ctx, args) => {
		// TODO: Check permissions
		// await requirePermission(ctx, currentUserId, "roles", "manage");

		const user = await ctx.db.get(args.userId);
		const role = await ctx.db.get(args.roleId);

		if (!user) throw new Error("User not found");
		if (!role) throw new Error("Role not found");

		await ctx.db.patch(args.userId, {
			roleId: args.roleId,
		});

		// TODO: Log the action
		// await logPermissionChange(ctx, currentUserId, "role_assigned", args.userId, args.roleId);

		return { success: true };
	},
});
