import { api } from "@stroika/backend";
import { useQuery } from "convex/react";

/**
 * Hook for checking user permissions using colon notation
 * Matches the exact database permission format (resource:action)
 */
export function usePermissions() {
	const userPermissions = useQuery(
		api.permissions.queries.getCurrentUserPermissions,
	);

	/**
	 * Check if user has a specific permission using colon notation
	 * @param permission - Permission in format "resource:action" (e.g., "documents:create")
	 * @returns boolean
	 */
	const hasPermission = (permission: string): boolean => {
		if (!userPermissions) return false;
		if (userPermissions.isOwner) return true;

		// Check exact permission
		if (userPermissions.permissions?.includes(permission)) {
			return true;
		}

		// Check for manage permission (grants all actions on resource)
		const [resource] = permission.split(":");
		const managePermission = `${resource}:manage`;
		if (userPermissions.permissions?.includes(managePermission)) {
			return true;
		}

		return false;
	};

	/**
	 * Check if user has any of the specified permissions
	 * @param permissions - Array of permissions in colon notation
	 * @returns boolean
	 */
	const hasAnyPermission = (permissions: string[]): boolean => {
		return permissions.some((permission) => hasPermission(permission));
	};

	/**
	 * Check if user has all of the specified permissions
	 * @param permissions - Array of permissions in colon notation
	 * @returns boolean
	 */
	const hasAllPermissions = (permissions: string[]): boolean => {
		return permissions.every((permission) => hasPermission(permission));
	};

	/**
	 * Check if user can perform action on resource
	 * @param resource - Resource name (e.g., "documents", "members")
	 * @param action - Action name (e.g., "create", "update", "delete")
	 * @returns boolean
	 */
	const can = (resource: string, action: string): boolean => {
		return hasPermission(`${resource}:${action}`);
	};

	return {
		// Raw permission data
		userPermissions,
		isOwner: userPermissions?.isOwner || false,
		permissions: userPermissions?.permissions || [],

		// Permission checking functions
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		can,

		// Common permission checks for convenience
		canManageMembers:
			hasPermission("members:manage") || hasPermission("members:invite"),
		canInviteMembers: hasPermission("members:invite"),
		canRemoveMembers: hasPermission("members:remove"),

		canCreateProjects: hasAnyPermission([
			"projects:create",
			"constructionProjects:create",
		]),
		canManageProjects: hasAnyPermission([
			"projects:manage",
			"constructionProjects:manage",
		]),
		canUpdateProjects: hasAnyPermission([
			"projects:update",
			"constructionProjects:update",
		]),

		canCreateDocuments: hasPermission("documents:create"),
		canManageDocuments: hasPermission("documents:manage"),
		canUpdateDocuments: hasPermission("documents:update"),
		canDeleteDocuments: hasPermission("documents:delete"),

		canManageTeams: hasPermission("teams:manage"),
		canCreateTeams: hasPermission("teams:create"),
		canUpdateTeams: hasPermission("teams:update"),

		canCreateIssues: hasPermission("issues:create"),
		canManageIssues: hasPermission("issues:manage"),
		canUpdateIssues: hasPermission("issues:update"),

		canManageRoles: hasPermission("roles:manage"),
		canCreateRoles: hasPermission("roles:create"),
		canUpdateRoles: hasPermission("roles:update"),
		canDeleteRoles: hasPermission("roles:delete"),

		// Loading state
		isLoading: userPermissions === undefined,
	};
}

/**
 * Hook for checking project-specific permissions
 * @param projectId - ID of the project
 */
export function useProjectPermissions(projectId: string) {
	const canViewProject = useQuery(
		api.permissions.queries.checkProjectPermission,
		{
			projectId: projectId as any,
			operation: "view",
		},
	);

	const canEditProject = useQuery(
		api.permissions.queries.checkProjectPermission,
		{
			projectId: projectId as any,
			operation: "edit",
		},
	);

	const canAdminProject = useQuery(
		api.permissions.queries.checkProjectPermission,
		{
			projectId: projectId as any,
			operation: "admin",
		},
	);

	return {
		canView: canViewProject,
		canEdit: canEditProject,
		canAdmin: canAdminProject,
		isLoading:
			canViewProject === undefined ||
			canEditProject === undefined ||
			canAdminProject === undefined,
	};
}

/**
 * Hook for checking specific permission using colon notation
 * @param resource - Resource name
 * @param action - Action name
 */
export function usePermission(resource: string, action: string) {
	const hasUserPermission = useQuery(
		api.permissions.queries.hasUserPermission,
		{
			resource,
			action,
		},
	);

	return {
		hasPermission: hasUserPermission,
		isLoading: hasUserPermission === undefined,
	};
}
