import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { PermissionAction, PermissionResource } from "./types";
import { checkPermission } from "./utils";

/**
 * Check if a user has permission based on organizational hierarchy
 * Users inherit permissions from their position in the hierarchy
 */
export async function checkHierarchicalPermission(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	targetUserId: Id<"users">,
	resource: PermissionResource,
	action: PermissionAction,
): Promise<boolean> {
	// First check direct permission
	const hasDirectPermission = await checkPermission(
		ctx,
		userId,
		resource,
		action,
	);
	if (hasDirectPermission) {
		return true;
	}

	// Get user's organizational position
	const userDepartment = await ctx.db
		.query("userDepartments")
		.withIndex("by_user_primary", (q) =>
			q.eq("userId", userId).eq("isPrimary", true),
		)
		.first();

	if (!userDepartment || !userDepartment.positionId) {
		return false;
	}

	const userPosition = await ctx.db.get(userDepartment.positionId);
	if (!userPosition) {
		return false;
	}

	// Get target user's position
	const targetDepartment = await ctx.db
		.query("userDepartments")
		.withIndex("by_user_primary", (q) =>
			q.eq("userId", targetUserId).eq("isPrimary", true),
		)
		.first();

	if (!targetDepartment || !targetDepartment.positionId) {
		// If target has no position, check if user can manage general resources
		return userPosition.canManageLevelsBelow;
	}

	const targetPosition = await ctx.db.get(targetDepartment.positionId);
	if (!targetPosition) {
		return false;
	}

	// Check if user's position is higher in hierarchy
	if (
		userPosition.level < targetPosition.level &&
		userPosition.canManageLevelsBelow
	) {
		// Also check if they're in the same department branch
		return await isInSameDepartmentBranch(
			ctx,
			userDepartment.departmentId,
			targetDepartment.departmentId,
		);
	}

	return false;
}

/**
 * Check if two departments are in the same branch of the hierarchy
 */
async function isInSameDepartmentBranch(
	ctx: QueryCtx | MutationCtx,
	dept1Id: Id<"departments">,
	dept2Id: Id<"departments">,
): Promise<boolean> {
	// Get all ancestors of both departments
	const ancestors1 = await getDepartmentAncestors(ctx, dept1Id);
	const ancestors2 = await getDepartmentAncestors(ctx, dept2Id);

	// Check if dept1 is ancestor of dept2 or vice versa
	if (ancestors1.includes(dept2Id) || ancestors2.includes(dept1Id)) {
		return true;
	}

	// Check if they share a common ancestor (same branch)
	const commonAncestors = ancestors1.filter((a) => ancestors2.includes(a));
	return commonAncestors.length > 0;
}

/**
 * Get all ancestor departments (parent, grandparent, etc.)
 */
async function getDepartmentAncestors(
	ctx: QueryCtx | MutationCtx,
	departmentId: Id<"departments">,
): Promise<Id<"departments">[]> {
	const ancestors: Id<"departments">[] = [departmentId];

	let currentDept = await ctx.db.get(departmentId);
	while (currentDept && currentDept.parentId) {
		ancestors.push(currentDept.parentId);
		currentDept = await ctx.db.get(currentDept.parentId);
	}

	return ancestors;
}

/**
 * Get all users that a given user can manage based on hierarchy
 */
export async function getManagedUsers(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
): Promise<Id<"users">[]> {
	const userDepartment = await ctx.db
		.query("userDepartments")
		.withIndex("by_user_primary", (q) =>
			q.eq("userId", userId).eq("isPrimary", true),
		)
		.first();

	if (!userDepartment || !userDepartment.positionId) {
		return [];
	}

	const userPosition = await ctx.db.get(userDepartment.positionId);
	if (!userPosition || !userPosition.canManageLevelsBelow) {
		return [];
	}

	// Get all departments under user's department
	const managedDepartments = await getSubDepartments(
		ctx,
		userDepartment.departmentId,
	);
	managedDepartments.push(userDepartment.departmentId);

	// Get all users in managed departments with lower positions
	const managedUsers: Id<"users">[] = [];

	for (const deptId of managedDepartments) {
		const deptUsers = await ctx.db
			.query("userDepartments")
			.withIndex("by_department", (q) => q.eq("departmentId", deptId))
			.collect();

		for (const deptUser of deptUsers) {
			if (deptUser.positionId) {
				const position = await ctx.db.get(deptUser.positionId);
				if (position && position.level > userPosition.level) {
					managedUsers.push(deptUser.userId);
				}
			}
		}
	}

	return [...new Set(managedUsers)]; // Remove duplicates
}

/**
 * Get all sub-departments recursively
 */
async function getSubDepartments(
	ctx: QueryCtx | MutationCtx,
	departmentId: Id<"departments">,
): Promise<Id<"departments">[]> {
	const subDepartments: Id<"departments">[] = [];

	const directSubs = await ctx.db
		.query("departments")
		.withIndex("by_parent", (q) => q.eq("parentId", departmentId))
		.collect();

	for (const sub of directSubs) {
		subDepartments.push(sub._id);
		const nestedSubs = await getSubDepartments(ctx, sub._id);
		subDepartments.push(...nestedSubs);
	}

	return subDepartments;
}
