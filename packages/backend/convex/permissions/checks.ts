import { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import type { 
	PermissionAction, 
	PermissionResource, 
	PermissionScope,
	AccessLevel 
} from "./types";

// Check if user can access a project
export async function canAccessProject(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	projectId: Id<"constructionProjects">,
	requiredLevel?: AccessLevel,
): Promise<boolean> {
	// Get user and organization details
	const user = await ctx.db.get(userId);
	if (!user || !user.currentOrganizationId) return false;

	const organization = await ctx.db.get(user.currentOrganizationId);
	if (!organization) return false;

	// Check if user is organization owner
	if (organization.ownerId === userId) return true;

	// Check if user has director role
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", user.currentOrganizationId).eq("userId", userId)
		)
		.first();

	if (membership) {
		const role = await ctx.db.get(membership.roleId);
		if (role && role.isDirector) return true;
	}

	// Check project-specific access
	const projectAccess = await ctx.db
		.query("projectAccess")
		.withIndex("by_project_user", (q) =>
			q.eq("projectId", projectId).eq("userId", userId)
		)
		.first();

	if (projectAccess && (!projectAccess.expiresAt || projectAccess.expiresAt > Date.now())) {
		if (!requiredLevel) return true;
		return getAccessLevelPriority(projectAccess.accessLevel) >= getAccessLevelPriority(requiredLevel);
	}

	// Check team-based access
	const userTeams = await ctx.db
		.query("teamMembers")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const teamMember of userTeams) {
		const teamAccess = await ctx.db
			.query("teamProjectAccess")
			.withIndex("by_team_project", (q) =>
				q.eq("teamId", teamMember.teamId).eq("projectId", projectId)
			)
			.first();

		if (teamAccess && teamAccess.inheritToMembers) {
			if (!requiredLevel) return true;
			if (getAccessLevelPriority(teamAccess.accessLevel) >= getAccessLevelPriority(requiredLevel)) {
				return true;
			}
		}
	}

	// Check if user is project lead
	const project = await ctx.db.get(projectId);
	if (project) {
		if (project.leadId === userId) return true;
		if (project.teamMemberIds.includes(userId)) {
			if (!requiredLevel) return true;
			return getAccessLevelPriority("write") >= getAccessLevelPriority(requiredLevel);
		}
	}

	return false;
}

// Check if user can manage members (add, remove, change roles)
export async function canManageMembers(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<boolean> {
	const organization = await ctx.db.get(organizationId);
	if (!organization) return false;

	// Check if user is organization owner
	if (organization.ownerId === userId) return true;

	// Check if user has director role or admin role
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", organizationId).eq("userId", userId)
		)
		.first();

	if (!membership || !membership.isActive) return false;

	const role = await ctx.db.get(membership.roleId);
	if (!role) return false;

	// Directors and admins can manage members
	return role.isDirector || role.name === "admin" || role.name === "owner";
}

// Check if user can create projects
export async function canCreateProject(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<boolean> {
	const organization = await ctx.db.get(organizationId);
	if (!organization) return false;

	// Check if user is organization owner
	if (organization.ownerId === userId) return true;

	// Check if user has director role or project creation permission
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", organizationId).eq("userId", userId)
		)
		.first();

	if (!membership || !membership.isActive) return false;

	const role = await ctx.db.get(membership.roleId);
	if (!role) return false;

	// Directors can create projects
	if (role.isDirector) return true;

	// Check if role has project creation permission
	const rolePermissions = await ctx.db
		.query("rolePermissions")
		.withIndex("by_role", (q) => q.eq("roleId", role._id))
		.collect();

	for (const rolePerm of rolePermissions) {
		const permission = await ctx.db.get(rolePerm.permissionId);
		if (permission && 
			permission.resource === "constructionProjects" && 
			(permission.action === "create" || permission.action === "manage")) {
			return true;
		}
	}

	return false;
}

// Check if user can access a document
export async function canAccessDocument(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	documentId: Id<"documents">,
	requiredLevel?: "owner" | "editor" | "commenter" | "viewer",
): Promise<boolean> {
	const document = await ctx.db.get(documentId);
	if (!document) return false;

	// Document author always has access
	if (document.authorId === userId) return true;

	// Check if user has access to the project (if document is linked to a project)
	if (document.projectId) {
		const hasProjectAccess = await canAccessProject(ctx, userId, document.projectId, "read");
		if (hasProjectAccess) return true;
	}

	// Check document-specific access
	const documentAccess = await ctx.db
		.query("documentAccess")
		.withIndex("by_document_user", (q) =>
			q.eq("documentId", documentId).eq("userId", userId)
		)
		.first();

	if (documentAccess && (!documentAccess.expiresAt || documentAccess.expiresAt > Date.now())) {
		if (!requiredLevel) return true;
		return getDocumentAccessLevelPriority(documentAccess.accessLevel) >= 
			getDocumentAccessLevelPriority(requiredLevel);
	}

	// Check team-based document access
	const userTeams = await ctx.db
		.query("teamMembers")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const teamMember of userTeams) {
		const teamDocAccess = await ctx.db
			.query("documentAccess")
			.withIndex("by_team", (q) => q.eq("teamId", teamMember.teamId))
			.filter((q) => q.eq(q.field("documentId"), documentId))
			.first();

		if (teamDocAccess && (!teamDocAccess.expiresAt || teamDocAccess.expiresAt > Date.now())) {
			if (!requiredLevel) return true;
			if (getDocumentAccessLevelPriority(teamDocAccess.accessLevel) >= 
				getDocumentAccessLevelPriority(requiredLevel)) {
				return true;
			}
		}
	}

	return false;
}

// Check if user has resource permission
export async function hasResourcePermission(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	resourceType: "project" | "document" | "issue" | "team",
	resourceId: string,
	action: PermissionAction,
): Promise<boolean> {
	// Check resource-specific permissions
	const resourcePermissions = await ctx.db
		.query("resourcePermissions")
		.withIndex("by_resource_user", (q) =>
			q.eq("resourceType", resourceType)
				.eq("resourceId", resourceId)
				.eq("userId", userId)
		)
		.first();

	if (resourcePermissions && (!resourcePermissions.expiresAt || resourcePermissions.expiresAt > Date.now())) {
		return resourcePermissions.permissions.includes(action);
	}

	// Check team-based resource permissions
	const userTeams = await ctx.db
		.query("teamMembers")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const teamMember of userTeams) {
		const teamResourcePerms = await ctx.db
			.query("resourcePermissions")
			.withIndex("by_team", (q) => q.eq("teamId", teamMember.teamId))
			.filter((q) => 
				q.and(
					q.eq(q.field("resourceType"), resourceType),
					q.eq(q.field("resourceId"), resourceId)
				)
			)
			.first();

		if (teamResourcePerms && 
			(!teamResourcePerms.expiresAt || teamResourcePerms.expiresAt > Date.now()) &&
			teamResourcePerms.permissions.includes(action)) {
			return true;
		}
	}

	return false;
}

// Check if user is organization owner
export async function isOrganizationOwner(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<boolean> {
	const organization = await ctx.db.get(organizationId);
	return organization ? organization.ownerId === userId : false;
}

// Check if user is director
export async function isDirector(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<boolean> {
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", organizationId).eq("userId", userId)
		)
		.first();

	if (!membership || !membership.isActive) return false;

	const role = await ctx.db.get(membership.roleId);
	return role ? role.isDirector : false;
}

// Check if user has admin role
export async function isAdmin(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	organizationId: Id<"organizations">,
): Promise<boolean> {
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", organizationId).eq("userId", userId)
		)
		.first();

	if (!membership || !membership.isActive) return false;

	const role = await ctx.db.get(membership.roleId);
	return role ? (role.name === "admin" || role.name === "owner" || role.isDirector) : false;
}

// Get user's highest access level for a project
export async function getUserProjectAccessLevel(
	ctx: QueryCtx | MutationCtx,
	userId: Id<"users">,
	projectId: Id<"constructionProjects">,
): Promise<AccessLevel | null> {
	const user = await ctx.db.get(userId);
	if (!user || !user.currentOrganizationId) return null;

	const organization = await ctx.db.get(user.currentOrganizationId);
	if (!organization) return null;

	// Owner has full access
	if (organization.ownerId === userId) return "owner";

	// Director has admin access
	const membership = await ctx.db
		.query("organizationMembers")
		.withIndex("by_org_user", (q) =>
			q.eq("organizationId", user.currentOrganizationId).eq("userId", userId)
		)
		.first();

	if (membership) {
		const role = await ctx.db.get(membership.roleId);
		if (role && role.isDirector) return "admin";
	}

	let highestLevel: AccessLevel | null = null;

	// Check direct project access
	const projectAccess = await ctx.db
		.query("projectAccess")
		.withIndex("by_project_user", (q) =>
			q.eq("projectId", projectId).eq("userId", userId)
		)
		.first();

	if (projectAccess && (!projectAccess.expiresAt || projectAccess.expiresAt > Date.now())) {
		highestLevel = projectAccess.accessLevel as AccessLevel;
	}

	// Check team-based access
	const userTeams = await ctx.db
		.query("teamMembers")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const teamMember of userTeams) {
		const teamAccess = await ctx.db
			.query("teamProjectAccess")
			.withIndex("by_team_project", (q) =>
				q.eq("teamId", teamMember.teamId).eq("projectId", projectId)
			)
			.first();

		if (teamAccess && teamAccess.inheritToMembers) {
			if (!highestLevel || 
				getAccessLevelPriority(teamAccess.accessLevel) > getAccessLevelPriority(highestLevel)) {
				highestLevel = teamAccess.accessLevel as AccessLevel;
			}
		}
	}

	// Check if user is project lead
	const project = await ctx.db.get(projectId);
	if (project) {
		if (project.leadId === userId) {
			if (!highestLevel || getAccessLevelPriority("admin") > getAccessLevelPriority(highestLevel)) {
				highestLevel = "admin";
			}
		} else if (project.teamMemberIds.includes(userId)) {
			if (!highestLevel || getAccessLevelPriority("write") > getAccessLevelPriority(highestLevel)) {
				highestLevel = "write";
			}
		}
	}

	return highestLevel;
}

// Helper functions
function getAccessLevelPriority(level: string): number {
	const priorities: Record<string, number> = {
		owner: 4,
		admin: 3,
		write: 2,
		read: 1,
	};
	return priorities[level] || 0;
}

function getDocumentAccessLevelPriority(level: string): number {
	const priorities: Record<string, number> = {
		owner: 4,
		editor: 3,
		commenter: 2,
		viewer: 1,
	};
	return priorities[level] || 0;
}