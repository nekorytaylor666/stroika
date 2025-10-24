import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent, createAuth, getUserId } from "../auth";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
	try {
		const authUser = await authComponent.getAuthUser(ctx);
		if (!authUser || !authUser._id) {
			return null;
		}

		return authUser;
	} catch (error) {
		console.error("Error in getCurrentUser:", error);
		return null;
	}
}

export async function getCurrentUserWithOrganization(
	ctx: QueryCtx | MutationCtx,
) {
	const user = await getCurrentUser(ctx);

	// Get Better Auth session to access active organization

	const auth = createAuth(ctx);
	const organizations = await auth.api.listOrganizations({
		headers: await authComponent.getHeaders(ctx),
	});

	return {
		user,
		organization: organizations[0],
	};
}

export async function requireOrganizationAccess(
	ctx: QueryCtx | MutationCtx,
	organizationId: string, // Better Auth uses string IDs for organizations
) {
	const user = await getCurrentUser(ctx);

	// Get Better Auth session
	const authUser = await authComponent.getAuthUser(ctx);
	if (!authUser) {
		throw new Error("Not authenticated");
	}

	// Check membership in Better Auth member table
	const membership = await ctx.db
		.query("member")
		.filter((q) =>
			q.and(
				q.eq(q.field("organizationId"), organizationId),
				q.eq(q.field("userId"), authUser.userId),
			),
		)
		.first();

	if (!membership) {
		throw new Error("Not a member of this organization");
	}

	return { user, membership };
}

export async function getCurrentUserWithPermissions(
	ctx: QueryCtx | MutationCtx,
) {
	const { user, organization, membership, role } =
		await getCurrentUserWithOrganization(ctx);

	const permissions = new Set<string>();

	// Organization owner has all permissions
	if (organization.ownerId === user._id) {
		return {
			user,
			organization,
			membership,
			role,
			isOwner: true,
			permissions: new Set(["*:*"]), // Special wildcard for owners
		};
	}

	// Get role permissions from database
	if (role) {
		const rolePermissions = await ctx.db
			.query("rolePermissions")
			.withIndex("by_role", (q) => q.eq("roleId", role._id))
			.collect();

		// Add all role permissions directly using colon notation
		for (const rolePerm of rolePermissions) {
			const permission = await ctx.db.get(rolePerm.permissionId);
			if (permission) {
				permissions.add(`${permission.resource}:${permission.action}`);
			}
		}
	}

	return {
		user,
		organization,
		membership,
		role,
		isOwner: false,
		permissions,
	};
}

// Direct permission checking using colon notation
export async function hasPermission(
	ctx: QueryCtx | MutationCtx,
	resource: string,
	action: string,
): Promise<boolean> {
	try {
		const userContext = await getCurrentUserWithPermissions(ctx);

		// Owner has all permissions
		if (userContext.isOwner) {
			return true;
		}

		const permissionKey = `${resource}:${action}`;

		// Check exact permission
		if (userContext.permissions.has(permissionKey)) {
			return true;
		}

		// Check for manage permission (grants all actions on resource)
		if (userContext.permissions.has(`${resource}:manage`)) {
			return true;
		}

		return false;
	} catch {
		return false;
	}
}

export async function requirePermission(
	ctx: QueryCtx | MutationCtx,
	resource: string,
	action: string,
): Promise<void> {
	const hasAccess = await hasPermission(ctx, resource, action);
	if (!hasAccess) {
		throw new Error(`Insufficient permissions: ${resource}:${action}`);
	}
}

// Project-specific permission checking using colon notation
export async function hasProjectPermission(
	ctx: QueryCtx | MutationCtx,
	projectId: Id<"constructionProjects">,
	operation: "view" | "edit" | "admin",
): Promise<boolean> {
	try {
		const userContext = await getCurrentUserWithPermissions(ctx);

		// Owner has all project access
		if (userContext.isOwner) {
			return true;
		}

		// Check global project permissions first
		const actionMap = {
			view: "read",
			edit: "update",
			admin: "manage",
		};

		const action = actionMap[operation];

		// Check if user has global project permissions
		if (
			userContext.permissions.has(`projects:${action}`) ||
			userContext.permissions.has(`constructionProjects:${action}`)
		) {
			return true;
		}

		// Get project details for specific access
		const project = await ctx.db.get(projectId);
		if (!project) return false;

		// Project lead has admin access
		if (project.leadId === userContext.user._id) {
			return true;
		}

		// Team members have edit access (view and edit operations)
		if (project.teamMemberIds?.includes(userContext.user._id)) {
			if (operation === "view" || operation === "edit") {
				return true;
			}
			// For admin access, need team management permissions
			if (
				operation === "admin" &&
				userContext.permissions.has("teams:manage")
			) {
				return true;
			}
		}

		// Basic view access for anyone with read permissions
		if (operation === "view" && userContext.permissions.has("projects:read")) {
			return true;
		}

		return false;
	} catch {
		return false;
	}
}

export async function hasResourcePermission(
	ctx: QueryCtx | MutationCtx,
	resourceType: "project" | "document" | "issue" | "team",
	resourceId: string,
	action: PermissionAction,
): Promise<boolean> {
	try {
		const { user, specialPermissions } =
			await getCurrentUserWithPermissions(ctx);

		// Owners and directors have access to everything
		if (specialPermissions.isOwner || specialPermissions.isDirector) {
			return true;
		}

		// Check resource-specific permissions
		const resourcePermissions = await ctx.db
			.query("resourcePermissions")
			.withIndex("by_resource_user", (q) =>
				q
					.eq("resourceType", resourceType)
					.eq("resourceId", resourceId)
					.eq("userId", user._id),
			)
			.first();

		if (
			resourcePermissions &&
			(!resourcePermissions.expiresAt ||
				resourcePermissions.expiresAt > Date.now())
		) {
			return resourcePermissions.permissions.includes(action);
		}

		// Check team-based resource permissions
		const userTeams = await ctx.db
			.query("teamMembers")
			.withIndex("by_user", (q) => q.eq("userId", user._id))
			.collect();

		for (const teamMember of userTeams) {
			const teamResourcePerms = await ctx.db
				.query("resourcePermissions")
				.withIndex("by_team", (q) => q.eq("teamId", teamMember.teamId))
				.filter((q) =>
					q.and(
						q.eq(q.field("resourceType"), resourceType),
						q.eq(q.field("resourceId"), resourceId),
					),
				)
				.first();

			if (
				teamResourcePerms &&
				(!teamResourcePerms.expiresAt ||
					teamResourcePerms.expiresAt > Date.now()) &&
				teamResourcePerms.permissions.includes(action)
			) {
				return true;
			}
		}

		return false;
	} catch {
		return false;
	}
}
