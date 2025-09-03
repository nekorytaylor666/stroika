import type { Doc, Id } from "../_generated/dataModel";

export type Permission = Doc<"permissions">;
export type Role = Doc<"roles">;
export type RolePermission = Doc<"rolePermissions">;
export type UserPermission = Doc<"userPermissions">;
export type ProjectAccess = Doc<"projectAccess">;
export type ResourcePermission = Doc<"resourcePermissions">;
export type PermissionGroup = Doc<"permissionGroups">;

export type PermissionAction =
	| "create"
	| "read"
	| "update"
	| "delete"
	| "manage"
	| "invite"
	| "remove";

export type PermissionResource =
	| "projects"
	| "constructionProjects"
	| "users"
	| "teams"
	| "constructionTeams"
	| "issues"
	| "roles"
	| "permissions"
	| "revenue"
	| "workCategories"
	| "documents"
	| "organizations"
	| "members";

export type PermissionScope =
	| "global"
	| "organization"
	| "project"
	| "team"
	| "resource";

export type AccessLevel = "owner" | "admin" | "write" | "read";

export type DocumentAccessLevel = "owner" | "editor" | "commenter" | "viewer";

export interface PermissionCheck {
	resource: PermissionResource;
	action: PermissionAction;
	scope?: PermissionScope;
	resourceId?: string;
}

export interface UserWithRole extends Omit<Doc<"users">, "roleId"> {
	role?: Role;
}

export interface RoleWithPermissions extends Role {
	permissions: Permission[];
}

export interface ProjectAccessCheck {
	projectId: Id<"constructionProjects">;
	userId: Id<"users">;
	requiredLevel: AccessLevel;
}

export interface ResourceAccessCheck {
	resourceType: "project" | "document" | "issue" | "team";
	resourceId: string;
	userId: Id<"users">;
	requiredPermissions: string[];
}
