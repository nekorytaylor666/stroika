import { Doc, Id } from "../_generated/dataModel";

export type Permission = Doc<"permissions">;
export type Role = Doc<"roles">;
export type RolePermission = Doc<"rolePermissions">;
export type UserPermission = Doc<"userPermissions">;

export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";

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
  | "workCategories";

export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
}

export interface UserWithRole extends Omit<Doc<"users">, "roleId"> {
  role?: Role;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}