import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

// Main seed function that orchestrates all seeding
export const seedDatabase = mutation({
	args: {},
	handler: async (ctx) => {
		const results = [];

		// Check if data already exists
		const existingOrg = await ctx.db.query("organizations").first();
		if (existingOrg) {
			return {
				message: "Database already seeded",
				skipped: true,
				organizationId: existingOrg._id,
			};
		}

		try {
			// 1. Create permissions first (needed for roles)
			const permissionsResult = await createPermissions(ctx);
			results.push({ step: "Permissions", ...permissionsResult });

			// 2. Create system roles with permissions
			const rolesResult = await createSystemRoles(
				ctx,
				permissionsResult.permissionMap,
			);
			results.push({ step: "System Roles", ...rolesResult });

			// 3. Create organization with proper owner
			const orgResult = await createOrganization(ctx, rolesResult.roleIds);
			results.push({ step: "Organization", ...orgResult });

			// 4. Create organizational positions
			const positionsResult = await createOrganizationalPositions(ctx);
			results.push({ step: "Organizational Positions", ...positionsResult });

			// 5. Create departments
			const departmentsResult = await createDepartments(
				ctx,
				orgResult.organizationId,
			);
			results.push({ step: "Departments", ...departmentsResult });

			// 6. Create base data (statuses, priorities, labels)
			const baseDataResult = await createBaseData(ctx);
			results.push({ step: "Base Data", ...baseDataResult });

			// 7. Create sample users with proper roles
			const usersResult = await createUsers(
				ctx,
				orgResult.organizationId,
				rolesResult.roleIds,
			);
			results.push({ step: "Users", ...usersResult });

			// 8. Create teams
			const teamsResult = await createTeams(
				ctx,
				orgResult.organizationId,
				usersResult.userIds,
			);
			results.push({ step: "Teams", ...teamsResult });

			// 9. Create construction teams
			const constructionTeamsResult = await createConstructionTeams(
				ctx,
				orgResult.organizationId,
				usersResult.userIds,
			);
			results.push({ step: "Construction Teams", ...constructionTeamsResult });

			// 10. Create construction projects with proper access
			const projectsResult = await createConstructionProjects(
				ctx,
				orgResult.organizationId,
				usersResult.userIds,
				baseDataResult.statusIds,
				baseDataResult.priorityIds,
			);
			results.push({ step: "Construction Projects", ...projectsResult });

			// 11. Create sample tasks
			const tasksResult = await createTasks(
				ctx,
				orgResult.organizationId,
				usersResult.userIds,
				projectsResult.projectIds,
				baseDataResult.statusIds,
				baseDataResult.priorityIds,
				baseDataResult.labelIds,
			);
			results.push({ step: "Tasks", ...tasksResult });

			// 12. Create sample documents
			const documentsResult = await createDocuments(
				ctx,
				orgResult.organizationId,
				usersResult.userIds,
				projectsResult.projectIds,
			);
			results.push({ step: "Documents", ...documentsResult });

			return {
				message: "Database seeded successfully",
				organizationId: orgResult.organizationId,
				results,
				summary: {
					users: usersResult.userIds.length,
					projects: projectsResult.projectIds.length,
					tasks: tasksResult.taskIds.length,
					teams: teamsResult.teamIds.length,
				},
			};
		} catch (error) {
			return {
				message: "Seeding failed",
				error: error instanceof Error ? error.message : String(error),
				results,
			};
		}
	},
});

// Create all permissions
async function createPermissions(ctx: MutationCtx) {
	const now = new Date().toISOString();
	const permissionMap: Record<string, Id<"permissions">> = {};

	const permissions = [
		// General Project permissions (for all project types)
		{
			resource: "projects",
			action: "create",
			scope: "organization",
			description: "Create general projects",
		},
		{
			resource: "projects",
			action: "read",
			scope: "organization",
			description: "View general projects",
		},
		{
			resource: "projects",
			action: "update",
			scope: "organization",
			description: "Edit general projects",
		},
		{
			resource: "projects",
			action: "delete",
			scope: "organization",
			description: "Delete general projects",
		},
		{
			resource: "projects",
			action: "manage",
			scope: "organization",
			description: "Full general project management",
		},

		// Construction Project permissions (specific to construction)
		{
			resource: "constructionProjects",
			action: "create",
			scope: "organization",
			description: "Create new construction projects",
		},
		{
			resource: "constructionProjects",
			action: "read",
			scope: "organization",
			description: "View construction projects",
		},
		{
			resource: "constructionProjects",
			action: "update",
			scope: "organization",
			description: "Edit construction projects",
		},
		{
			resource: "constructionProjects",
			action: "delete",
			scope: "organization",
			description: "Delete construction projects",
		},
		{
			resource: "constructionProjects",
			action: "manage",
			scope: "organization",
			description: "Full construction project management",
		},

		// User permissions
		{
			resource: "users",
			action: "create",
			scope: "organization",
			description: "Create new users",
		},
		{
			resource: "users",
			action: "read",
			scope: "organization",
			description: "View user profiles",
		},
		{
			resource: "users",
			action: "update",
			scope: "organization",
			description: "Edit user profiles",
		},
		{
			resource: "users",
			action: "delete",
			scope: "organization",
			description: "Delete users",
		},
		{
			resource: "users",
			action: "manage",
			scope: "organization",
			description: "Full user management",
		},

		// Team permissions
		{
			resource: "teams",
			action: "create",
			scope: "organization",
			description: "Create teams",
		},
		{
			resource: "teams",
			action: "read",
			scope: "organization",
			description: "View teams",
		},
		{
			resource: "teams",
			action: "update",
			scope: "organization",
			description: "Edit teams",
		},
		{
			resource: "teams",
			action: "delete",
			scope: "organization",
			description: "Delete teams",
		},
		{
			resource: "teams",
			action: "manage",
			scope: "organization",
			description: "Full team management",
		},

		// Construction Teams permissions (specific to construction)
		{
			resource: "constructionTeams",
			action: "create",
			scope: "organization",
			description: "Create construction teams",
		},
		{
			resource: "constructionTeams",
			action: "read",
			scope: "organization",
			description: "View construction teams",
		},
		{
			resource: "constructionTeams",
			action: "update",
			scope: "organization",
			description: "Edit construction teams",
		},
		{
			resource: "constructionTeams",
			action: "delete",
			scope: "organization",
			description: "Delete construction teams",
		},
		{
			resource: "constructionTeams",
			action: "manage",
			scope: "organization",
			description: "Full construction team management",
		},

		// Finance permissions
		{
			resource: "finance",
			action: "read",
			scope: "project",
			description: "View financial data",
		},
		{
			resource: "finance",
			action: "create",
			scope: "project",
			description: "Create financial records",
		},
		{
			resource: "finance",
			action: "update",
			scope: "project",
			description: "Edit financial records",
		},
		{
			resource: "finance",
			action: "delete",
			scope: "project",
			description: "Delete financial records",
		},
		{
			resource: "finance",
			action: "manage",
			scope: "project",
			description: "Full financial management",
		},

		// Calendar permissions
		{
			resource: "calendar",
			action: "read",
			scope: "organization",
			description: "View calendar",
		},
		{
			resource: "calendar",
			action: "create",
			scope: "organization",
			description: "Create calendar events",
		},
		{
			resource: "calendar",
			action: "update",
			scope: "organization",
			description: "Edit calendar events",
		},
		{
			resource: "calendar",
			action: "delete",
			scope: "organization",
			description: "Delete calendar events",
		},
		{
			resource: "calendar",
			action: "manage",
			scope: "organization",
			description: "Full calendar management",
		},

		// Gantt chart permissions
		{
			resource: "gantt",
			action: "read",
			scope: "organization",
			description: "View Gantt charts",
		},
		{
			resource: "gantt",
			action: "create",
			scope: "organization",
			description: "Create Gantt charts",
		},
		{
			resource: "gantt",
			action: "update",
			scope: "organization",
			description: "Edit Gantt charts",
		},
		{
			resource: "gantt",
			action: "delete",
			scope: "organization",
			description: "Delete Gantt charts",
		},
		{
			resource: "gantt",
			action: "manage",
			scope: "organization",
			description: "Full Gantt chart management",
		},

		// Document permissions
		{
			resource: "documents",
			action: "create",
			scope: "project",
			description: "Create documents",
		},
		{
			resource: "documents",
			action: "read",
			scope: "project",
			description: "View documents",
		},
		{
			resource: "documents",
			action: "update",
			scope: "project",
			description: "Edit documents",
		},
		{
			resource: "documents",
			action: "delete",
			scope: "project",
			description: "Delete documents",
		},
		{
			resource: "documents",
			action: "manage",
			scope: "project",
			description: "Full document management",
		},

		// Issue permissions
		{
			resource: "issues",
			action: "create",
			scope: "project",
			description: "Create tasks/issues",
		},
		{
			resource: "issues",
			action: "read",
			scope: "project",
			description: "View tasks/issues",
		},
		{
			resource: "issues",
			action: "update",
			scope: "project",
			description: "Edit tasks/issues",
		},
		{
			resource: "issues",
			action: "delete",
			scope: "project",
			description: "Delete tasks/issues",
		},
		{
			resource: "issues",
			action: "manage",
			scope: "project",
			description: "Full task management",
		},

		// Member permissions
		{
			resource: "members",
			action: "invite",
			scope: "organization",
			description: "Invite new members",
		},
		{
			resource: "members",
			action: "remove",
			scope: "organization",
			description: "Remove members",
		},
		{
			resource: "members",
			action: "manage",
			scope: "organization",
			description: "Full member management",
		},

		// Role permissions
		{
			resource: "roles",
			action: "create",
			scope: "organization",
			description: "Create roles",
		},
		{
			resource: "roles",
			action: "read",
			scope: "organization",
			description: "View roles",
		},
		{
			resource: "roles",
			action: "update",
			scope: "organization",
			description: "Edit roles",
		},
		{
			resource: "roles",
			action: "delete",
			scope: "organization",
			description: "Delete roles",
		},
		{
			resource: "roles",
			action: "manage",
			scope: "organization",
			description: "Full role management",
		},

		// Permissions management
		{
			resource: "permissions",
			action: "read",
			scope: "organization",
			description: "View permissions",
		},
		{
			resource: "permissions",
			action: "create",
			scope: "organization",
			description: "Create permissions",
		},
		{
			resource: "permissions",
			action: "update",
			scope: "organization",
			description: "Edit permissions",
		},
		{
			resource: "permissions",
			action: "delete",
			scope: "organization",
			description: "Delete permissions",
		},
		{
			resource: "permissions",
			action: "manage",
			scope: "organization",
			description: "Full permission management",
		},
	];

	for (const perm of permissions) {
		const id = await ctx.db.insert("permissions", {
			...perm,
			createdAt: now,
		});
		permissionMap[`${perm.resource}_${perm.action}`] = id;
	}

	return {
		message: "Permissions created",
		permissionsCreated: permissions.length,
		permissionMap,
	};
}

// Create system roles
async function createSystemRoles(
	ctx: MutationCtx,
	permissionMap: Record<string, Id<"permissions">>,
) {
	const now = new Date().toISOString();
	const roleIds: Record<string, Id<"roles">> = {};

	const roles = [
		{
			name: "owner",
			displayName: "Владелец",
			description: "Полный доступ к системе",
			isSystem: true,
			isDirector: true,
			priority: 100,
			permissions: Object.values(permissionMap), // All permissions
		},
		{
			name: "director",
			displayName: "Директор",
			description: "Полный доступ ко всем проектам и управлению",
			isSystem: true,
			isDirector: true,
			priority: 90,
			permissions: Object.values(permissionMap), // All permissions
		},
		{
			name: "admin",
			displayName: "Администратор",
			description: "Управление организацией и членами",
			isSystem: true,
			isDirector: false,
			priority: 80,
			permissions: [
				permissionMap.constructionProjects_manage,
				permissionMap.users_manage,
				permissionMap.teams_manage,
				permissionMap.members_manage,
				permissionMap.documents_manage,
				permissionMap.issues_manage,
				permissionMap.roles_read,
			].filter(Boolean),
		},
		{
			name: "project_manager",
			displayName: "Руководитель проекта",
			description: "Управление назначенными проектами",
			isSystem: true,
			isDirector: false,
			priority: 70,
			permissions: [
				permissionMap.constructionProjects_read,
				permissionMap.constructionProjects_update,
				permissionMap.teams_read,
				permissionMap.teams_update,
				permissionMap.documents_manage,
				permissionMap.issues_manage,
				permissionMap.users_read,
			].filter(Boolean),
		},
		{
			name: "team_lead",
			displayName: "Руководитель команды",
			description: "Управление командными задачами и документами",
			isSystem: true,
			isDirector: false,
			priority: 60,
			permissions: [
				permissionMap.constructionProjects_read,
				permissionMap.teams_read,
				permissionMap.documents_create,
				permissionMap.documents_read,
				permissionMap.documents_update,
				permissionMap.issues_create,
				permissionMap.issues_read,
				permissionMap.issues_update,
				permissionMap.users_read,
			].filter(Boolean),
		},
		{
			name: "member",
			displayName: "Участник",
			description: "Стандартный член команды",
			isSystem: true,
			isDirector: false,
			priority: 50,
			permissions: [
				permissionMap.constructionProjects_read,
				permissionMap.teams_read,
				permissionMap.documents_read,
				permissionMap.documents_create,
				permissionMap.issues_read,
				permissionMap.issues_create,
				permissionMap.issues_update,
				permissionMap.users_read,
			].filter(Boolean),
		},
		{
			name: "viewer",
			displayName: "Наблюдатель",
			description: "Только просмотр назначенных ресурсов",
			isSystem: true,
			isDirector: false,
			priority: 40,
			permissions: [
				permissionMap.constructionProjects_read,
				permissionMap.teams_read,
				permissionMap.documents_read,
				permissionMap.issues_read,
				permissionMap.users_read,
			].filter(Boolean),
		},
	];

	for (const roleData of roles) {
		const roleId = await ctx.db.insert("roles", {
			organizationId: undefined, // System roles
			name: roleData.name,
			displayName: roleData.displayName,
			description: roleData.description,
			isSystem: roleData.isSystem,
			isDirector: roleData.isDirector,
			priority: roleData.priority,
			createdAt: now,
			updatedAt: now,
		});

		// Assign permissions to role
		for (const permissionId of roleData.permissions) {
			await ctx.db.insert("rolePermissions", {
				roleId,
				permissionId,
				createdAt: now,
			});
		}

		roleIds[roleData.name] = roleId;
	}

	return {
		message: "System roles created",
		rolesCreated: roles.length,
		roleIds,
	};
}

// Create organization
async function createOrganization(
	ctx: MutationCtx,
	roleIds: Record<string, Id<"roles">>,
) {
	// Create the owner user first
	const ownerId = await ctx.db.insert("users", {
		name: "Akmt Owner",
		email: "akmt.me23@gmail.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=akmt",
		status: "online",
		roleId: roleIds.owner,
		joinedDate: "2020-01-15",
		teamIds: [],
		position: "Генеральный директор",
		currentOrganizationId: undefined as any, // Will be set after org creation
		isActive: true,
		lastLogin: new Date().toISOString(),
	});

	// Create organization
	const organizationId = await ctx.db.insert("organizations", {
		name: "СтройКомплекс",
		slug: "stroycomplex",
		description: "Ведущая строительная компания России",
		logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stroycomplex",
		website: "https://stroycomplex.ru",
		ownerId,
		settings: {
			allowInvites: true,
			requireEmailVerification: false,
			defaultRoleId: roleIds.member,
		},
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	// Update owner's organization
	await ctx.db.patch(ownerId, {
		currentOrganizationId: organizationId,
	});

	// Add owner as organization member
	await ctx.db.insert("organizationMembers", {
		organizationId,
		userId: ownerId,
		roleId: roleIds.owner,
		joinedAt: Date.now(),
		invitedBy: undefined,
		isActive: true,
	});

	return {
		message: "Organization created",
		organizationId,
		ownerId,
	};
}

// Create organizational positions
async function createOrganizationalPositions(ctx: MutationCtx) {
	const now = new Date().toISOString();
	const positions = [
		{ name: "owner", displayName: "Владелец", level: 0 },
		{ name: "ceo", displayName: "Генеральный директор", level: 1 },
		{
			name: "chief_engineer",
			displayName: "Главный инженер проекта (ГИП)",
			level: 2,
		},
		{ name: "department_head", displayName: "Руководитель отдела", level: 3 },
		{ name: "senior_specialist", displayName: "Старший специалист", level: 4 },
		{ name: "specialist", displayName: "Специалист", level: 5 },
	];

	const positionIds: Record<string, Id<"organizationalPositions">> = {};

	for (const position of positions) {
		const id = await ctx.db.insert("organizationalPositions", {
			...position,
			canManageLevelsBelow: position.level <= 3,
			isUnique: position.level <= 2,
			createdAt: now,
		});
		positionIds[position.name] = id;
	}

	return {
		message: "Organizational positions created",
		positionsCreated: positions.length,
		positionIds,
	};
}

// Create departments
async function createDepartments(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	const now = new Date().toISOString();

	// Root company department
	const companyId = await ctx.db.insert("departments", {
		organizationId,
		name: "company",
		displayName: "СтройКомплекс",
		description: "Главная организация",
		parentId: undefined,
		level: 0,
		headUserId: undefined,
		isActive: true,
		createdAt: now,
		updatedAt: now,
	});

	// Main departments
	const departments = [
		{
			name: "management",
			displayName: "Управление",
			description: "Административное управление",
		},
		{
			name: "engineering",
			displayName: "Инженерный отдел",
			description: "Проектирование и инженерные решения",
		},
		{
			name: "construction",
			displayName: "Строительный отдел",
			description: "Выполнение строительных работ",
		},
		{
			name: "design",
			displayName: "Отдел проектирования",
			description: "Архитектурное проектирование",
		},
	];

	const departmentIds: Record<string, Id<"departments">> = {};

	for (const dept of departments) {
		const id = await ctx.db.insert("departments", {
			organizationId,
			...dept,
			parentId: companyId,
			level: 1,
			headUserId: undefined,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		departmentIds[dept.name] = id;
	}

	return {
		message: "Departments created",
		departmentsCreated: departments.length + 1,
		departmentIds,
	};
}

// Create base data
async function createBaseData(ctx: MutationCtx) {
	const statusIds: Id<"status">[] = [];
	const priorityIds: Id<"priorities">[] = [];
	const labelIds: Id<"labels">[] = [];

	// Statuses - indexes: 0=К выполнению, 1=В работе, 2=На проверке, 3=Завершено, 4=Отменено
	const statuses = [
		{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
		{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
		{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
		{ name: "Завершено", color: "#10B981", iconName: "CheckCircle" },
		{ name: "Отменено", color: "#EF4444", iconName: "XCircle" },
	];

	for (const status of statuses) {
		const id = await ctx.db.insert("status", status);
		statusIds.push(id);
	}

	// Priorities - indexes: 0=Критический, 1=Высокий, 2=Средний, 3=Низкий
	const priorities = [
		{
			name: "Критический",
			level: 0,
			iconName: "AlertTriangle",
			color: "#EF4444",
		},
		{ name: "Высокий", level: 1, iconName: "ArrowUp", color: "#F59E0B" },
		{ name: "Средний", level: 2, iconName: "Minus", color: "#3B82F6" },
		{ name: "Низкий", level: 3, iconName: "ArrowDown", color: "#10B981" },
	];

	for (const priority of priorities) {
		const id = await ctx.db.insert("priorities", priority);
		priorityIds.push(id);
	}

	// Labels
	const labels = [
		{ name: "Срочно", color: "#FF4444" },
		{ name: "Документация", color: "#4169E1" },
		{ name: "Безопасность", color: "#FFA500" },
		{ name: "Проверка", color: "#32CD32" },
		{ name: "Материалы", color: "#8A2BE2" },
		{ name: "Оборудование", color: "#FF6347" },
	];

	for (const label of labels) {
		const id = await ctx.db.insert("labels", label);
		labelIds.push(id);
	}

	return {
		message: "Base data created",
		statusIds,
		priorityIds,
		labelIds,
	};
}

// Create users
async function createUsers(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	roleIds: Record<string, Id<"roles">>,
) {
	const now = new Date().toISOString();
	const userIds: Id<"users">[] = [];

	// Get owner (already created)
	const owner = await ctx.db
		.query("users")
		.withIndex("by_email", (q) => q.eq("email", "akmt.me23@gmail.com"))
		.first();

	if (owner) {
		userIds.push(owner._id);
	}

	// Additional users
	const users = [
		{
			name: "Мария Иванова",
			email: "maria@stroycomplex.ru",
			position: "Руководитель проектов",
			roleId: roleIds.project_manager,
		},
		{
			name: "Дмитрий Сидоров",
			email: "dmitry@stroycomplex.ru",
			position: "Главный инженер",
			roleId: roleIds.director,
		},
		{
			name: "Елена Козлова",
			email: "elena@stroycomplex.ru",
			position: "Архитектор",
			roleId: roleIds.team_lead,
		},
		{
			name: "Андрей Волков",
			email: "andrey@stroycomplex.ru",
			position: "Инженер-конструктор",
			roleId: roleIds.member,
		},
		{
			name: "Ольга Новикова",
			email: "olga@stroycomplex.ru",
			position: "Менеджер по закупкам",
			roleId: roleIds.member,
		},
		{
			name: "Сергей Петров",
			email: "sergey@stroycomplex.ru",
			position: "Прораб",
			roleId: roleIds.team_lead,
		},
		{
			name: "Наталья Смирнова",
			email: "natalia@stroycomplex.ru",
			position: "Экономист",
			roleId: roleIds.member,
		},
		{
			name: "Игорь Федоров",
			email: "igor@stroycomplex.ru",
			position: "Начальник участка",
			roleId: roleIds.team_lead,
		},
	];

	for (const userData of users) {
		const userId = await ctx.db.insert("users", {
			name: userData.name,
			email: userData.email,
			avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
			status: "online",
			roleId: userData.roleId,
			joinedDate: "2021-01-15",
			teamIds: [],
			position: userData.position,
			currentOrganizationId: organizationId,
			isActive: true,
			lastLogin: now,
		});

		// Add as organization member
		await ctx.db.insert("organizationMembers", {
			organizationId,
			userId,
			roleId: userData.roleId,
			joinedAt: Date.now(),
			invitedBy: owner?._id,
			isActive: true,
		});

		userIds.push(userId);
	}

	return {
		message: "Users created",
		usersCreated: userIds.length,
		userIds,
	};
}

// Create teams
async function createTeams(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	userIds: Id<"users">[],
) {
	const teams = [
		{
			name: "Команда проектирования",
			description: "Архитектурное и инженерное проектирование",
			leaderId: userIds[3], // Елена Козлова
			memberIds: [userIds[3], userIds[4], userIds[7]],
		},
		{
			name: "Строительная бригада №1",
			description: "Основная строительная бригада",
			leaderId: userIds[6], // Сергей Петров
			memberIds: [userIds[6], userIds[4], userIds[8]],
		},
		{
			name: "Инженерная группа",
			description: "Техническое сопровождение проектов",
			leaderId: userIds[2], // Дмитрий Сидоров
			memberIds: [userIds[2], userIds[4], userIds[8]],
		},
		{
			name: "Отдел закупок",
			description: "Закупка материалов и оборудования",
			leaderId: userIds[5], // Ольга Новикова
			memberIds: [userIds[5], userIds[7]],
		},
	];

	const teamIds: Id<"teams">[] = [];

	for (const team of teams) {
		const teamId = await ctx.db.insert("teams", {
			organizationId,
			name: team.name,
			description: team.description,
			parentTeamId: undefined,
			leaderId: team.leaderId,
			isActive: true,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Add team members
		for (const userId of team.memberIds) {
			await ctx.db.insert("teamMembers", {
				teamId,
				userId,
				joinedAt: Date.now(),
				role: userId === team.leaderId ? "leader" : "member",
			});
		}

		teamIds.push(teamId);
	}

	return {
		message: "Teams created",
		teamsCreated: teams.length,
		teamIds,
	};
}

// Create construction teams
async function createConstructionTeams(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	userIds: Id<"users">[],
) {
	const teams = [
		{
			name: "Бригада монтажников",
			shortName: "БМ-1",
			icon: "Wrench",
			color: "#3B82F6",
			department: "construction" as const,
			memberIds: [userIds[6], userIds[4], userIds[8]],
		},
		{
			name: "Группа проектировщиков",
			shortName: "ГП-1",
			icon: "Pencil",
			color: "#10B981",
			department: "design" as const,
			memberIds: [userIds[3], userIds[4]],
		},
		{
			name: "Инженерная служба",
			shortName: "ИС-1",
			icon: "Settings",
			color: "#F59E0B",
			department: "engineering" as const,
			memberIds: [userIds[2], userIds[4], userIds[8]],
		},
	];

	const teamIds: Id<"constructionTeams">[] = [];

	for (const team of teams) {
		const teamId = await ctx.db.insert("constructionTeams", {
			organizationId,
			name: team.name,
			shortName: team.shortName,
			icon: team.icon,
			joined: true,
			color: team.color,
			memberIds: team.memberIds,
			projectIds: [],
			department: team.department,
			workload: Math.floor(Math.random() * 50) + 30,
		});
		teamIds.push(teamId);
	}

	return {
		message: "Construction teams created",
		teamsCreated: teams.length,
		teamIds,
	};
}

// Create construction projects
async function createConstructionProjects(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	userIds: Id<"users">[],
	statusIds: Record<string, Id<"status">>,
	priorityIds: Record<string, Id<"priorities">>,
) {
	const projects = [
		{
			name: "ЖК Садовый",
			client: "ООО Девелопмент Плюс",
			statusId: statusIds[1], // В работе
			iconName: "Building",
			percentComplete: 45,
			contractValue: 150000000,
			startDate: "2024-01-15",
			targetDate: "2025-06-30",
			leadId: userIds[1], // Мария Иванова
			priorityId: priorityIds[1], // Высокий
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект идет по плану",
			location: "г. Москва, ул. Садовая, 15",
			projectType: "residential" as const,
			notes: "Строительство 3 корпусов по 12 этажей",
			teamMemberIds: [userIds[1], userIds[3], userIds[4]],
		},
		{
			name: "ТЦ Вертикаль",
			client: "АО Торговые центры",
			statusId: statusIds[1], // В работе
			iconName: "ShoppingCart",
			percentComplete: 30,
			contractValue: 85000000,
			startDate: "2024-03-01",
			targetDate: "2024-12-15",
			leadId: userIds[2], // Дмитрий Сидоров
			priorityId: priorityIds[1], // Высокий
			healthId: "warning",
			healthName: "Требует внимания",
			healthColor: "#F59E0B",
			healthDescription: "Задержки в поставке материалов",
			location: "г. Москва, Ленинский проспект, 45",
			projectType: "commercial" as const,
			notes: "Современный торговый центр с подземной парковкой",
			teamMemberIds: [userIds[2], userIds[4], userIds[5]],
		},
		{
			name: "Бизнес-центр Альфа",
			client: "ООО БизнесСтрой",
			statusId: statusIds[0], // К выполнению
			iconName: "Briefcase",
			percentComplete: 5,
			contractValue: 200000000,
			startDate: "2024-06-01",
			targetDate: "2026-03-31",
			leadId: userIds[1], // Мария Иванова
			priorityId: priorityIds[2], // Средний
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект на стадии планирования",
			location: "г. Санкт-Петербург, Невский проспект, 100",
			projectType: "commercial" as const,
			notes: "15-этажный бизнес-центр класса А",
			teamMemberIds: [userIds[1], userIds[3], userIds[6]],
		},
		{
			name: "Реконструкция завода",
			client: "ПАО Промышленная группа",
			statusId: statusIds[1], // В работе
			iconName: "Factory",
			percentComplete: 60,
			contractValue: 120000000,
			startDate: "2023-10-01",
			targetDate: "2024-08-31",
			leadId: userIds[2], // Дмитрий Сидоров
			priorityId: priorityIds[0], // Критический
			healthId: "warning",
			healthName: "Требует внимания",
			healthColor: "#F59E0B",
			healthDescription: "Необходимо ускорить темпы работ",
			location: "г. Екатеринбург, Промышленная зона",
			projectType: "industrial" as const,
			notes: "Модернизация производственных цехов",
			teamMemberIds: [userIds[2], userIds[6], userIds[8]],
		},
	];

	const projectIds: Id<"constructionProjects">[] = [];
	const creatorId = userIds[0]; // Owner

	for (const project of projects) {
		const projectId = await ctx.db.insert("constructionProjects", {
			organizationId,
			...project,
		});
		projectIds.push(projectId);

		// Grant project access to lead
		await ctx.db.insert("projectAccess", {
			projectId,
			userId: project.leadId,
			teamId: undefined,
			accessLevel: "admin",
			grantedBy: creatorId,
			grantedAt: Date.now(),
			expiresAt: undefined,
		});

		// Grant project access to team members
		for (const memberId of project.teamMemberIds) {
			if (memberId !== project.leadId) {
				await ctx.db.insert("projectAccess", {
					projectId,
					userId: memberId,
					teamId: undefined,
					accessLevel: "write",
					grantedBy: creatorId,
					grantedAt: Date.now(),
					expiresAt: undefined,
				});
			}
		}

		// Create monthly revenue data
		const months = [
			"2024-01",
			"2024-02",
			"2024-03",
			"2024-04",
			"2024-05",
			"2024-06",
		];
		for (const month of months) {
			await ctx.db.insert("monthlyRevenue", {
				constructionProjectId: projectId,
				month,
				planned: Math.round(project.contractValue / 12),
				actual: Math.round(
					(project.contractValue / 12) * (0.8 + Math.random() * 0.4),
				),
			});
		}
	}

	return {
		message: "Construction projects created",
		projectsCreated: projects.length,
		projectIds,
	};
}

// Create tasks
async function createTasks(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	userIds: Id<"users">[],
	projectIds: Id<"constructionProjects">[],
	statusIds: Id<"status">[],
	priorityIds: Id<"priorities">[],
	labelIds: Id<"labels">[],
) {
	const tasks = [
		{
			identifier: "СТРФ-001",
			title: "Проверка фундамента корпуса А",
			description:
				"Необходимо провести инспекцию качества заложенного фундамента корпуса А жилого комплекса",
			statusId: statusIds[1], // В работе
			assigneeId: userIds[6], // Сергей Петров
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[2], labelIds[3]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-15",
		},
		{
			identifier: "СТРЭ-002",
			title: "Согласование электрической схемы",
			description:
				"Получить одобрение электрической схемы от надзорных органов",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[4], // Андрей Волков
			priorityId: priorityIds[0], // Критический
			labelIds: [labelIds[0], labelIds[1]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-10",
		},
		{
			identifier: "СТРМ-003",
			title: "Закупка строительных материалов",
			description:
				"Заказать цемент, арматуру и кирпич для следующего этапа строительства",
			statusId: statusIds[2], // На проверке
			assigneeId: userIds[5], // Ольга Новикова
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[4]].filter(Boolean),
			projectId: projectIds[1],
			dueDate: "2024-04-20",
		},
		{
			identifier: "СТРБ-004",
			title: "Проверка техники безопасности",
			description:
				"Провести еженедельную проверку соблюдения норм техники безопасности на строительной площадке",
			statusId: statusIds[3], // Завершено
			assigneeId: userIds[2], // Дмитрий Сидоров
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[2]].filter(Boolean),
			projectId: projectIds[3],
			dueDate: "2024-04-05",
		},
		{
			identifier: "СТРО-005",
			title: "Установка башенного крана",
			description: "Монтаж и ввод в эксплуатацию башенного крана для корпуса Б",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[8], // Игорь Федоров
			priorityId: priorityIds[1], // Высокий
			labelIds: [labelIds[5], labelIds[2]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-25",
		},
		{
			identifier: "СТРП-006",
			title: "Разработка проектной документации",
			description:
				"Подготовить полный комплект проектной документации для согласования",
			statusId: statusIds[1], // В работе
			assigneeId: userIds[3], // Елена Козлова
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[1]].filter(Boolean),
			projectId: projectIds[2],
			dueDate: "2024-05-01",
		},
		{
			identifier: "СТРТ-007",
			title: "Тестирование инженерных систем",
			description:
				"Провести комплексное тестирование систем вентиляции и кондиционирования",
			statusId: statusIds[0], // К выполнению
			assigneeId: userIds[4], // Андрей Волков
			priorityId: priorityIds[2], // Средний
			labelIds: [labelIds[3]].filter(Boolean),
			projectId: projectIds[1],
			dueDate: "2024-04-30",
		},
		{
			identifier: "СТРФ-008",
			title: "Финансовый отчет за квартал",
			description:
				"Подготовить финансовый отчет по всем проектам за первый квартал",
			statusId: statusIds[2], // На проверке
			assigneeId: userIds[7], // Наталья Смирнова
			priorityId: priorityIds[3], // Низкий
			labelIds: [labelIds[1]].filter(Boolean),
			projectId: projectIds[0],
			dueDate: "2024-04-08",
		},
	];

	const taskIds: Id<"issues">[] = [];

	for (const task of tasks) {
		const taskId = await ctx.db.insert("issues", {
			organizationId,
			...task,
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			rank: `a${taskIds.length}`,
			isConstructionTask: true,
			parentTaskId: undefined,
		});
		taskIds.push(taskId);
	}

	return {
		message: "Tasks created",
		tasksCreated: tasks.length,
		taskIds,
	};
}

// Create sample documents
async function createDocuments(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
	userIds: Id<"users">[],
	projectIds: Id<"constructionProjects">[],
) {
	const documents = [
		{
			title: "Техническое задание на проектирование",
			content:
				"Подробное техническое задание на разработку проектной документации для ЖК Садовый",
			projectId: projectIds[0],
			authorId: userIds[1],
			assignedTo: userIds[3],
			status: "completed" as const,
		},
		{
			title: "План строительных работ",
			content:
				"График выполнения строительных работ с указанием основных этапов и контрольных точек",
			projectId: projectIds[0],
			authorId: userIds[2],
			assignedTo: userIds[6],
			status: "in_progress" as const,
		},
		{
			title: "Смета на материалы",
			content:
				"Детальная смета на закупку строительных материалов для первого этапа",
			projectId: projectIds[1],
			authorId: userIds[5],
			assignedTo: userIds[7],
			status: "review" as const,
		},
		{
			title: "Протокол совещания",
			content: "Протокол еженедельного совещания по проекту от 01.04.2024",
			projectId: projectIds[0],
			authorId: userIds[1],
			status: "completed" as const,
		},
		{
			title: "Акт выполненных работ",
			content: "Акт приемки выполненных работ по устройству фундамента",
			projectId: projectIds[3],
			authorId: userIds[6],
			assignedTo: userIds[2],
			status: "review" as const,
		},
	];

	const documentIds: Id<"documents">[] = [];

	for (const doc of documents) {
		const documentId = await ctx.db.insert("documents", {
			organizationId,
			title: doc.title,
			content: doc.content,
			projectId: doc.projectId,
			parentId: null,
			authorId: doc.authorId,
			assignedTo: doc.assignedTo,
			status: doc.status,
			dueDate: undefined,
			tags: [],
			version: 1,
			lastEditedBy: doc.authorId,
			lastEditedAt: Date.now(),
		});

		// Grant document access to author
		await ctx.db.insert("documentAccess", {
			documentId,
			userId: doc.authorId,
			teamId: undefined,
			accessLevel: "owner",
			canShare: true,
			grantedBy: doc.authorId,
			grantedAt: Date.now(),
			expiresAt: undefined,
		});

		// Grant access to assignee if exists
		if (doc.assignedTo) {
			await ctx.db.insert("documentAccess", {
				documentId,
				userId: doc.assignedTo,
				teamId: undefined,
				accessLevel: "editor",
				canShare: true,
				grantedBy: doc.authorId,
				grantedAt: Date.now(),
				expiresAt: undefined,
			});
		}

		documentIds.push(documentId);
	}

	return {
		message: "Documents created",
		documentsCreated: documents.length,
		documentIds,
	};
}
