import type { PermissionAction, PermissionResource } from "./types";

export const SYSTEM_ROLES = {
	OWNER: "owner",
	CEO: "ceo",
	CHIEF_ENGINEER: "chief_engineer",
	DEPARTMENT_HEAD: "department_head",
	PROJECT_MANAGER: "project_manager",
	ENGINEER: "engineer",
	VIEWER: "viewer",
} as const;

export const ORGANIZATIONAL_POSITIONS = {
	OWNER: { name: "owner", displayName: "Владелец", level: 0 },
	CEO: { name: "ceo", displayName: "Генеральный директор", level: 1 },
	CHIEF_ENGINEER: {
		name: "chief_engineer",
		displayName: "Главный инженер проекта (ГИП)",
		level: 2,
	},
	DEPARTMENT_HEAD: {
		name: "department_head",
		displayName: "Руководитель отдела",
		level: 3,
	},
	SENIOR_SPECIALIST: {
		name: "senior_specialist",
		displayName: "Старший специалист",
		level: 4,
	},
	SPECIALIST: { name: "specialist", displayName: "Специалист", level: 5 },
} as const;

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
	[SYSTEM_ROLES.OWNER]: "Владелец",
	[SYSTEM_ROLES.CEO]: "Генеральный директор",
	[SYSTEM_ROLES.CHIEF_ENGINEER]: "Главный инженер проекта",
	[SYSTEM_ROLES.DEPARTMENT_HEAD]: "Руководитель отдела",
	[SYSTEM_ROLES.PROJECT_MANAGER]: "Руководитель проекта",
	[SYSTEM_ROLES.ENGINEER]: "Инженер",
	[SYSTEM_ROLES.VIEWER]: "Наблюдатель",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
	[SYSTEM_ROLES.OWNER]: "Полный доступ ко всей системе и всем подразделениям",
	[SYSTEM_ROLES.CEO]: "Управление компанией, доступ ко всем проектам и отделам",
	[SYSTEM_ROLES.CHIEF_ENGINEER]:
		"Главный инженер проекта, управление всеми техническими аспектами",
	[SYSTEM_ROLES.DEPARTMENT_HEAD]:
		"Руководитель отдела, управление сотрудниками и проектами отдела",
	[SYSTEM_ROLES.PROJECT_MANAGER]:
		"Управление проектами, командами и назначение задач",
	[SYSTEM_ROLES.ENGINEER]: "Просмотр и обновление назначенных задач и проектов",
	[SYSTEM_ROLES.VIEWER]: "Только просмотр проектов и задач",
};

// Define all possible permissions
export const ALL_PERMISSIONS: Array<{
	resource: PermissionResource;
	action: PermissionAction;
	description: string;
}> = [
	// Project permissions
	{
		resource: "projects",
		action: "create",
		description: "Create new projects",
	},
	{ resource: "projects", action: "read", description: "View projects" },
	{
		resource: "projects",
		action: "update",
		description: "Update project details",
	},
	{ resource: "projects", action: "delete", description: "Delete projects" },
	{
		resource: "projects",
		action: "manage",
		description: "Full project management",
	},

	// Construction Project permissions
	{
		resource: "constructionProjects",
		action: "create",
		description: "Create construction projects",
	},
	{
		resource: "constructionProjects",
		action: "read",
		description: "View construction projects",
	},
	{
		resource: "constructionProjects",
		action: "update",
		description: "Update construction projects",
	},
	{
		resource: "constructionProjects",
		action: "delete",
		description: "Delete construction projects",
	},
	{
		resource: "constructionProjects",
		action: "manage",
		description: "Manage construction projects",
	},

	// User permissions
	{ resource: "users", action: "create", description: "Create new users" },
	{ resource: "users", action: "read", description: "View user profiles" },
	{
		resource: "users",
		action: "update",
		description: "Update user information",
	},
	{ resource: "users", action: "delete", description: "Delete users" },
	{ resource: "users", action: "manage", description: "Full user management" },

	// Team permissions
	{ resource: "teams", action: "create", description: "Create new teams" },
	{ resource: "teams", action: "read", description: "View teams" },
	{
		resource: "teams",
		action: "update",
		description: "Update team information",
	},
	{ resource: "teams", action: "delete", description: "Delete teams" },
	{ resource: "teams", action: "manage", description: "Full team management" },

	// Construction Team permissions
	{
		resource: "constructionTeams",
		action: "create",
		description: "Create construction teams",
	},
	{
		resource: "constructionTeams",
		action: "read",
		description: "View construction teams",
	},
	{
		resource: "constructionTeams",
		action: "update",
		description: "Update construction teams",
	},
	{
		resource: "constructionTeams",
		action: "delete",
		description: "Delete construction teams",
	},
	{
		resource: "constructionTeams",
		action: "manage",
		description: "Manage construction teams",
	},

	// Issue/Task permissions
	{
		resource: "issues",
		action: "create",
		description: "Create new issues/tasks",
	},
	{ resource: "issues", action: "read", description: "View issues/tasks" },
	{ resource: "issues", action: "update", description: "Update issues/tasks" },
	{ resource: "issues", action: "delete", description: "Delete issues/tasks" },
	{
		resource: "issues",
		action: "manage",
		description: "Full issue management",
	},

	// Role permissions
	{ resource: "roles", action: "create", description: "Create new roles" },
	{ resource: "roles", action: "read", description: "View roles" },
	{
		resource: "roles",
		action: "update",
		description: "Update role permissions",
	},
	{ resource: "roles", action: "delete", description: "Delete roles" },
	{ resource: "roles", action: "manage", description: "Full role management" },

	// Permission management
	{ resource: "permissions", action: "read", description: "View permissions" },
	{
		resource: "permissions",
		action: "manage",
		description: "Manage permissions",
	},

	// Revenue permissions
	{
		resource: "revenue",
		action: "create",
		description: "Create revenue entries",
	},
	{ resource: "revenue", action: "read", description: "View revenue data" },
	{ resource: "revenue", action: "update", description: "Update revenue data" },
	{
		resource: "revenue",
		action: "delete",
		description: "Delete revenue entries",
	},
	{
		resource: "revenue",
		action: "manage",
		description: "Full revenue management",
	},

	// Work Category permissions
	{
		resource: "workCategories",
		action: "create",
		description: "Create work categories",
	},
	{
		resource: "workCategories",
		action: "read",
		description: "View work categories",
	},
	{
		resource: "workCategories",
		action: "update",
		description: "Update work categories",
	},
	{
		resource: "workCategories",
		action: "delete",
		description: "Delete work categories",
	},
	{
		resource: "workCategories",
		action: "manage",
		description: "Manage work categories",
	},
];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<
	string,
	Array<{ resource: PermissionResource; action: PermissionAction }>
> = {
	[SYSTEM_ROLES.OWNER]: ALL_PERMISSIONS.map((p) => ({
		resource: p.resource,
		action: p.action,
	})),

	[SYSTEM_ROLES.CEO]: ALL_PERMISSIONS.map((p) => ({
		resource: p.resource,
		action: p.action,
	})),

	[SYSTEM_ROLES.CHIEF_ENGINEER]: ALL_PERMISSIONS.filter(
		(p) =>
			// All permissions except role and permission management
			!(p.resource === "roles" && p.action !== "read") &&
			!(p.resource === "permissions" && p.action === "manage"),
	).map((p) => ({ resource: p.resource, action: p.action })),

	[SYSTEM_ROLES.DEPARTMENT_HEAD]: [
		// Projects - full access for department
		{ resource: "projects", action: "create" },
		{ resource: "projects", action: "read" },
		{ resource: "projects", action: "update" },
		{ resource: "constructionProjects", action: "create" },
		{ resource: "constructionProjects", action: "read" },
		{ resource: "constructionProjects", action: "update" },

		// Teams - manage department teams
		{ resource: "teams", action: "create" },
		{ resource: "teams", action: "read" },
		{ resource: "teams", action: "update" },
		{ resource: "teams", action: "manage" },
		{ resource: "constructionTeams", action: "create" },
		{ resource: "constructionTeams", action: "read" },
		{ resource: "constructionTeams", action: "update" },
		{ resource: "constructionTeams", action: "manage" },

		// Issues - full access
		{ resource: "issues", action: "create" },
		{ resource: "issues", action: "read" },
		{ resource: "issues", action: "update" },
		{ resource: "issues", action: "manage" },

		// Users - read and update for department
		{ resource: "users", action: "read" },
		{ resource: "users", action: "update" },

		// Revenue - read and update
		{ resource: "revenue", action: "read" },
		{ resource: "revenue", action: "update" },

		// Work categories - full access
		{ resource: "workCategories", action: "create" },
		{ resource: "workCategories", action: "read" },
		{ resource: "workCategories", action: "update" },
		{ resource: "workCategories", action: "manage" },

		// Roles - read only
		{ resource: "roles", action: "read" },
	],

	[SYSTEM_ROLES.PROJECT_MANAGER]: [
		// Projects - full access
		{ resource: "projects", action: "create" },
		{ resource: "projects", action: "read" },
		{ resource: "projects", action: "update" },
		{ resource: "projects", action: "manage" },
		{ resource: "constructionProjects", action: "create" },
		{ resource: "constructionProjects", action: "read" },
		{ resource: "constructionProjects", action: "update" },
		{ resource: "constructionProjects", action: "manage" },

		// Teams - full access
		{ resource: "teams", action: "create" },
		{ resource: "teams", action: "read" },
		{ resource: "teams", action: "update" },
		{ resource: "teams", action: "manage" },
		{ resource: "constructionTeams", action: "create" },
		{ resource: "constructionTeams", action: "read" },
		{ resource: "constructionTeams", action: "update" },
		{ resource: "constructionTeams", action: "manage" },

		// Issues - full access
		{ resource: "issues", action: "create" },
		{ resource: "issues", action: "read" },
		{ resource: "issues", action: "update" },
		{ resource: "issues", action: "manage" },

		// Users - read only
		{ resource: "users", action: "read" },

		// Revenue - read and update
		{ resource: "revenue", action: "read" },
		{ resource: "revenue", action: "update" },

		// Work categories - full access
		{ resource: "workCategories", action: "create" },
		{ resource: "workCategories", action: "read" },
		{ resource: "workCategories", action: "update" },
		{ resource: "workCategories", action: "manage" },
	],

	[SYSTEM_ROLES.ENGINEER]: [
		// Projects - read only
		{ resource: "projects", action: "read" },
		{ resource: "constructionProjects", action: "read" },

		// Teams - read only
		{ resource: "teams", action: "read" },
		{ resource: "constructionTeams", action: "read" },

		// Issues - read and update own
		{ resource: "issues", action: "read" },
		{ resource: "issues", action: "update" },

		// Users - read only
		{ resource: "users", action: "read" },

		// Work categories - read only
		{ resource: "workCategories", action: "read" },
	],

	[SYSTEM_ROLES.VIEWER]: [
		// Read-only access to everything
		{ resource: "projects", action: "read" },
		{ resource: "constructionProjects", action: "read" },
		{ resource: "teams", action: "read" },
		{ resource: "constructionTeams", action: "read" },
		{ resource: "issues", action: "read" },
		{ resource: "users", action: "read" },
		{ resource: "revenue", action: "read" },
		{ resource: "workCategories", action: "read" },
	],
};
