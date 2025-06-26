import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

export const getDepartmentHierarchy = query({
	args: {},
	handler: async (ctx) => {
		const departments = await ctx.db.query("departments").collect();

		// Build hierarchy tree
		const buildTree = (parentId?: string): any[] => {
			return departments
				.filter((dept) => dept.parentId === parentId)
				.map((dept) => ({
					...dept,
					children: buildTree(dept._id),
				}));
		};

		return buildTree(undefined);
	},
});

export const getDepartmentWithUsers = query({
	args: {
		departmentId: v.id("departments"),
	},
	handler: async (ctx, args) => {
		const department = await ctx.db.get(args.departmentId);
		if (!department) {
			throw new Error("Department not found");
		}

		// Get all user assignments for this department
		const assignments = await ctx.db
			.query("userDepartments")
			.withIndex("by_department", (q) =>
				q.eq("departmentId", args.departmentId),
			)
			.filter((q) => q.eq(q.field("endDate"), undefined))
			.collect();

		// Get users and their positions
		const users = await Promise.all(
			assignments.map(async (assignment) => {
				const user = await ctx.db.get(assignment.userId);
				const position = assignment.positionId
					? await ctx.db.get(assignment.positionId)
					: null;
				const role = user?.roleId ? await ctx.db.get(user.roleId) : null;

				return {
					user,
					position,
					role,
					isPrimary: assignment.isPrimary,
					startDate: assignment.startDate,
				};
			}),
		);

		// Get sub-departments
		const subDepartments = await ctx.db
			.query("departments")
			.withIndex("by_parent", (q) => q.eq("parentId", args.departmentId))
			.collect();

		return {
			department,
			users: users.filter((u) => u.user !== null),
			subDepartments,
		};
	},
});

export const getUserHierarchy = query({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) {
			throw new Error("User not found");
		}

		// Get user's department assignments
		const assignments = await ctx.db
			.query("userDepartments")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.filter((q) => q.eq(q.field("endDate"), undefined))
			.collect();

		const departmentInfo = await Promise.all(
			assignments.map(async (assignment) => {
				const department = await ctx.db.get(assignment.departmentId);
				const position = assignment.positionId
					? await ctx.db.get(assignment.positionId)
					: null;

				// Get department hierarchy
				const hierarchy: Doc<"departments">[] = [];
				let currentDept = department;
				while (currentDept) {
					hierarchy.unshift(currentDept);
					if (currentDept.parentId) {
						currentDept = await ctx.db.get(currentDept.parentId);
					} else {
						break;
					}
				}

				return {
					department,
					position,
					isPrimary: assignment.isPrimary,
					hierarchy,
				};
			}),
		);

		// Get user's role
		const role = user.roleId ? await ctx.db.get(user.roleId) : null;

		// Get role permissions
		let permissions: any[] = [];
		if (role) {
			const rolePermissions = await ctx.db
				.query("rolePermissions")
				.withIndex("by_role", (q) => q.eq("roleId", role._id))
				.collect();

			permissions = await Promise.all(
				rolePermissions.map(async (rp) => {
					const permission = await ctx.db.get(rp.permissionId);
					return permission;
				}),
			);
		}

		return {
			user,
			role,
			departments: departmentInfo.filter((d) => d.department !== null),
			permissions: permissions.filter((p) => p !== null),
		};
	},
});

export const getOrganizationalPositions = query({
	args: {},
	handler: async (ctx) => {
		const positions = await ctx.db
			.query("organizationalPositions")
			.withIndex("by_level")
			.collect();

		return positions;
	},
});

export const getDepartmentsByLevel = query({
	args: {
		level: v.number(),
	},
	handler: async (ctx, args) => {
		const departments = await ctx.db
			.query("departments")
			.withIndex("by_level", (q) => q.eq("level", args.level))
			.collect();

		return departments;
	},
});

// New queries needed by the member management component
export const getAllDepartments = query({
	handler: async (ctx) => {
		return await ctx.db.query("departments").collect();
	},
});

export const getAllUserDepartments = query({
	handler: async (ctx) => {
		return await ctx.db.query("userDepartments").collect();
	},
});
