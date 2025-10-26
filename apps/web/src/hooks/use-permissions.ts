import { api } from "@stroika/backend";
import { useQuery } from "convex/react";

/**
 * Hook for checking user permissions using colon notation
 * Matches the exact database permission format (resource:action)
 */
export const usePermissions = () => {
	const userPermissions = useQuery(api.customPermissions.getUserPermissions);
	console.log(userPermissions);
	return userPermissions;
};

/**
 * Hook to get handy project-specific permission booleans for fast checks.
 * Returns flags like canManageProject, canReadDocuments, canManageTasks, etc.
 */
export const useProjectPermissions = (projectId: string) => {
	const userPermissions = useQuery(api.customPermissions.getUserPermissions);

	// Permissions not yet loaded
	if (!userPermissions || !userPermissions.project) {
		return null;
	}
	const projectPerms = userPermissions.project?.[projectId];

	if (!projectPerms) {
		return null;
	}

	// Helper to check if user has specific action for resource
	const hasAction = (resource: string, action: string) => {
		const actions = projectPerms[resource];
		return Array.isArray(actions) && actions.includes(action);
	};

	// Most common permission checks (expand as needed)
	const canManageProject =
		hasAction("constructionProject", "manage") ||
		hasAction("projects", "manage");
	const canReadProject = hasAction("constructionProject", "read");
	const canUpdateProject = hasAction("constructionProject", "update");
	const canDeleteProject = hasAction("constructionProject", "delete");

	const canReadDocuments = hasAction("documents", "read");
	const canCreateDocuments = hasAction("documents", "create");
	const canUpdateDocuments = hasAction("documents", "update");
	const canDeleteDocuments = hasAction("documents", "delete");
	const canManageDocuments = hasAction("documents", "manage");

	const canReadTasks = hasAction("tasks", "read");
	const canCreateTasks = hasAction("tasks", "create");
	const canUpdateTasks = hasAction("tasks", "update");
	const canDeleteTasks = hasAction("tasks", "delete");
	const canManageTasks = hasAction("tasks", "manage");

	const canReadMembers = hasAction("members", "read");
	const canManageMembers = hasAction("members", "manage");

	const canReadAnalytics = hasAction("analytics", "read");
	const canManageAnalytics = hasAction("analytics", "manage");

	const canReadActivities = hasAction("activities", "read");
	const canManageActivities = hasAction("activities", "manage");

	const canReadAttachments = hasAction("attachments", "read");
	const canManageAttachments = hasAction("attachments", "manage");

	// Return all raw and handy values
	return {
		projectPermissions: projectPerms, // the whole permission structure for this project
		canManageProject,
		canReadProject,
		canUpdateProject,
		canDeleteProject,
		canReadDocuments,
		canCreateDocuments,
		canUpdateDocuments,
		canDeleteDocuments,
		canManageDocuments,
		canReadTasks,
		canCreateTasks,
		canUpdateTasks,
		canDeleteTasks,
		canManageTasks,
		canReadMembers,
		canManageMembers,
		canReadAnalytics,
		canManageAnalytics,
		canReadActivities,
		canManageActivities,
		canReadAttachments,
		canManageAttachments,
	};
};

// ext function usePermissions() {
// 	const userPermissions = useQuery(
// 		api.permissions.queries.getCurrentUserPermissions,
// 	);

// 	/**
// 	 * Check if user has a specific permission using colon notation
// 	 * @param permission - Permission in format "resource:action" (e.g., "documents:create")
// 	 * @returns boolean
// 	 */
// 	const hasPermission = (permission: string): boolean => {
// 		if (!userPermissions) return false;
// 		if (userPermissions.isOwner) return true;

// 		// Check exact permission
// 		if (userPermissions.permissions?.includes(permission)) {
// 			return true;
// 		}

// 		// Check for manage permission (grants all actions on resource)
// 		const [resource] = permission.split(":");
// 		const managePermission = `${resource}:manage`;
// 		if (userPermissions.permissions?.includes(managePermission)) {
// 			return true;
// 		}

// 		return false;
// 	};

// 	/**
// 	 * Check if user has any of the specified permissions
// 	 * @param permissions - Array of permissions in colon notation
// 	 * @returns boolean
// 	 */
// 	const hasAnyPermission = (permissions: string[]): boolean => {
// 		return permissions.some((permission) => hasPermission(permission));
// 	};

// 	/**
// 	 * Check if user has all of the specified permissions
// 	 * @param permissions - Array of permissions in colon notation
// 	 * @returns boolean
// 	 */
// 	const hasAllPermissions = (permissions: string[]): boolean => {
// 		return permissions.every((permission) => hasPermission(permission));
// 	};

// 	/**
// 	 * Check if user can perform action on resource
// 	 * @param resource - Resource name (e.g., "documents", "members")
// 	 * @param action - Action name (e.g., "create", "update", "delete")
// 	 * @returns boolean
// 	 */
// 	const can = (resource: string, action: string): boolean => {
// 		return hasPermission(`${resource}:${action}`);
// 	};

// 	return {
// 		// Raw permission data
// 		userPermissions,
// 		isOwner: userPermissions?.isOwner || false,
// 		permissions: userPermissions?.permissions || [],

// 		// Permission checking functions
// 		hasPermission,
// 		hasAnyPermission,
// 		hasAllPermissions,
// 		can,

// 		// Common permission checks for convenience
// 		canManageMembers:
// 			hasPermission("members:manage") || hasPermission("members:invite"),
// 		canInviteMembers: hasPermission("members:invite"),
// 		canRemoveMembers: hasPermission("members:remove"),

// 		canCreateProjects: hasAnyPermission([
// 			"projects:create",
// 			"constructionProjects:create",
// 		]),
// 		canManageProjects: hasAnyPermission([
// 			"projects:manage",
// 			"constructionProjects:manage",
// 		]),
// 		canUpdateProjects: hasAnyPermission([
// 			"projects:update",
// 			"constructionProjects:update",
// 		]),

// 		canCreateDocuments: hasPermission("documents:create"),
// 		canManageDocuments: hasPermission("documents:manage"),
// 		canUpdateDocuments: hasPermission("documents:update"),
// 		canDeleteDocuments: hasPermission("documents:delete"),

// 		canManageTeams: hasPermission("teams:manage"),
// 		canCreateTeams: hasPermission("teams:create"),
// 		canUpdateTeams: hasPermission("teams:update"),

// 		canCreateIssues: hasPermission("issues:create"),
// 		canManageIssues: hasPermission("issues:manage"),
// 		canUpdateIssues: hasPermission("issues:update"),

// 		canManageRoles: hasPermission("roles:manage"),
// 		canCreateRoles: hasPermission("roles:create"),
// 		canUpdateRoles: hasPermission("roles:update"),
// 		canDeleteRoles: hasPermission("roles:delete"),

// 		canUpdateUsers: hasPermission("users:update"),
// 		canManageUsers: hasPermission("users:manage"),

// 		// Loading state
// 		isLoading: userPermissions === undefined,
// 	};
// }
/**
 * Hook for checking project-specific permissions
 * @param projectId - ID of the project
 */

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

/**
 * Hook for checking project-level resource permissions using custom roles
 * This uses the new customRoles and userCustomRoles system
 *
 * @param projectId - ID of the construction project
 * @param resource - Resource type (e.g., "tasks", "documents", "constructionProject", "attachments", "members", "activities", "analytics")
 * @param action - Action to perform (e.g., "read", "create", "update", "delete", "manage")
 *
 * @example
 * const taskPermission = useProjectResourcePermission(projectId, "tasks", "update");
 * if (taskPermission.hasPermission) {
 *   // User can update tasks
 * }
 */
export function useProjectResourcePermission(
	projectId: string | undefined,
	resource: string,
	action: string,
) {
	const result = useQuery(
		api.customPermissions.hasPermissionForProject,
		projectId
			? {
					userId: "", // Will be filled by the backend with current user
					projectId,
					resource,
					action,
				}
			: "skip",
	);

	return {
		hasPermission: result?.hasPermission || false,
		reason: result?.reason,
		roleName: result?.roleName,
		roleDisplayName: result?.roleDisplayName,
		isLoading: result === undefined && projectId !== undefined,
	};
}

/**
 * Hook for checking multiple project resource permissions at once
 * Useful for checking if user can perform various actions on a project
 *
 * @param projectId - ID of the construction project
 *
 * @example
 * const permissions = useProjectResourcePermissions(projectId);
 * if (permissions.canUpdateTasks) {
 *   // Show edit button
 * }
 */
export function useProjectResourcePermissions(projectId: string | undefined) {
	// Check common permissions
	const canReadProject = useProjectResourcePermission(
		projectId,
		"constructionProject",
		"read",
	);
	const canUpdateProject = useProjectResourcePermission(
		projectId,
		"constructionProject",
		"update",
	);
	const canManageProject = useProjectResourcePermission(
		projectId,
		"constructionProject",
		"manage",
	);
	const canDeleteProject = useProjectResourcePermission(
		projectId,
		"constructionProject",
		"delete",
	);

	const canReadTasks = useProjectResourcePermission(projectId, "tasks", "read");
	const canCreateTasks = useProjectResourcePermission(
		projectId,
		"tasks",
		"create",
	);
	const canUpdateTasks = useProjectResourcePermission(
		projectId,
		"tasks",
		"update",
	);
	const canDeleteTasks = useProjectResourcePermission(
		projectId,
		"tasks",
		"delete",
	);

	const canReadDocuments = useProjectResourcePermission(
		projectId,
		"documents",
		"read",
	);
	const canCreateDocuments = useProjectResourcePermission(
		projectId,
		"documents",
		"create",
	);
	const canUpdateDocuments = useProjectResourcePermission(
		projectId,
		"documents",
		"update",
	);
	const canDeleteDocuments = useProjectResourcePermission(
		projectId,
		"documents",
		"delete",
	);

	const canReadMembers = useProjectResourcePermission(
		projectId,
		"members",
		"read",
	);
	const canManageMembers = useProjectResourcePermission(
		projectId,
		"members",
		"manage",
	);

	const canReadAttachments = useProjectResourcePermission(
		projectId,
		"attachments",
		"read",
	);
	const canCreateAttachments = useProjectResourcePermission(
		projectId,
		"attachments",
		"create",
	);

	const canReadActivities = useProjectResourcePermission(
		projectId,
		"activities",
		"read",
	);

	const canReadAnalytics = useProjectResourcePermission(
		projectId,
		"analytics",
		"read",
	);

	const isLoading =
		canReadProject.isLoading ||
		canUpdateProject.isLoading ||
		canManageProject.isLoading;

	return {
		// Project permissions
		canReadProject: canReadProject.hasPermission,
		canUpdateProject: canUpdateProject.hasPermission,
		canManageProject: canManageProject.hasPermission,
		canDeleteProject: canDeleteProject.hasPermission,

		// Task permissions
		canReadTasks: canReadTasks.hasPermission,
		canCreateTasks: canCreateTasks.hasPermission,
		canUpdateTasks: canUpdateTasks.hasPermission,
		canDeleteTasks: canDeleteTasks.hasPermission,

		// Document permissions
		canReadDocuments: canReadDocuments.hasPermission,
		canCreateDocuments: canCreateDocuments.hasPermission,
		canUpdateDocuments: canUpdateDocuments.hasPermission,
		canDeleteDocuments: canDeleteDocuments.hasPermission,

		// Member permissions
		canReadMembers: canReadMembers.hasPermission,
		canManageMembers: canManageMembers.hasPermission,

		// Attachment permissions
		canReadAttachments: canReadAttachments.hasPermission,
		canCreateAttachments: canCreateAttachments.hasPermission,

		// Activity permissions
		canReadActivities: canReadActivities.hasPermission,

		// Analytics permissions
		canReadAnalytics: canReadAnalytics.hasPermission,

		// Loading state
		isLoading,
	};
}
