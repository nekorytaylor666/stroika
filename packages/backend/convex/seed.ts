import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import {
	ALL_PERMISSIONS,
	DEFAULT_ROLE_PERMISSIONS,
	ORGANIZATIONAL_POSITIONS,
	ROLE_DESCRIPTIONS,
	ROLE_DISPLAY_NAMES,
	SYSTEM_ROLES,
} from "./permissions/constants";

export const seedAll = mutation({
	args: {},
	handler: async (ctx) => {
		const results = [];
		const now = new Date().toISOString();

		// 1. Create organization first
		let organizationId: Id<"organizations"> | null = null;
		try {
			const orgResult = await createOrganization(ctx);
			organizationId = orgResult.organizationId;
			results.push({ step: "Organization", ...orgResult });
		} catch (error) {
			results.push({
				step: "Organization",
				error: error instanceof Error ? error.message : String(error),
			});
			// Can't continue without organization
			return { message: "Seeding failed", results };
		}

		// 2. Create sample users with organization membership
		try {
			const sampleUsersResult = await createSampleUsers(ctx, organizationId);
			results.push({ step: "Sample Users", ...sampleUsersResult });
		} catch (error) {
			results.push({
				step: "Sample Users",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 3. Seed organizational positions
		try {
			const positionsResult = await seedOrganizationalPositions(
				ctx,
				organizationId,
			);
			results.push({ step: "Organizational Positions", ...positionsResult });
		} catch (error) {
			results.push({
				step: "Organizational Positions",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 4. Seed departments
		try {
			const departmentsResult = await seedDepartments(ctx, organizationId);
			results.push({ step: "Departments", ...departmentsResult });
		} catch (error) {
			results.push({
				step: "Departments",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 5. Create status, priorities, and labels
		try {
			const baseDataResult = await createBaseData(ctx);
			results.push({ step: "Base Data", ...baseDataResult });
		} catch (error) {
			results.push({
				step: "Base Data",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 6. Create teams (new structure)
		try {
			const teamsResult = await createTeams(ctx, organizationId);
			results.push({ step: "Teams", ...teamsResult });
		} catch (error) {
			results.push({
				step: "Teams",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 7. Create construction projects
		try {
			const projectsResult = await createConstructionProjects(
				ctx,
				organizationId,
			);
			results.push({ step: "Construction Projects", ...projectsResult });
		} catch (error) {
			results.push({
				step: "Construction Projects",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 8. Create tasks/issues
		try {
			const tasksResult = await createTasks(ctx, organizationId);
			results.push({ step: "Tasks", ...tasksResult });
		} catch (error) {
			results.push({
				step: "Tasks",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		// 9. Create sample invites
		try {
			const invitesResult = await createSampleInvites(ctx, organizationId);
			results.push({ step: "Sample Invites", ...invitesResult });
		} catch (error) {
			results.push({
				step: "Sample Invites",
				error: error instanceof Error ? error.message : String(error),
			});
		}

		return {
			message: "Seeding completed",
			organizationId,
			results,
		};
	},
});

async function createOrganization(ctx: MutationCtx) {
	// Check if organization already exists
	const existingOrg = await ctx.db.query("organizations").first();
	if (existingOrg) {
		return {
			message: "Organization already exists",
			organizationId: existingOrg._id,
			skipped: true,
		};
	}

	// First create a temporary owner user
	const tempOwnerId = await ctx.db.insert("users", {
		name: "Temp Owner",
		email: "temp@stroycomplex.ru",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=temp",
		status: "online",
		roleId: undefined as any,
		joinedDate: "2020-01-01",
		teamIds: [],
		position: "Temp",
		currentOrganizationId: undefined as any,
		isActive: true,
		lastLogin: new Date().toISOString(),
	});

	// Create the organization with temp owner
	const organizationId = await ctx.db.insert("organizations", {
		name: "СтройКомплекс",
		slug: "stroycomplex",
		description: "Ведущая строительная компания России",
		logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stroycomplex",
		website: "https://stroycomplex.ru",
		ownerId: tempOwnerId,
		settings: {
			allowInvites: true,
			requireEmailVerification: false,
			defaultRoleId: undefined,
		},
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	// Create default roles for the organization
	const roles = [
		{
			name: "admin",
			displayName: "Администратор",
			description: "Полный доступ ко всем ресурсам организации",
		},
		{
			name: "manager",
			displayName: "Менеджер",
			description: "Управление проектами и командами",
		},
		{
			name: "member",
			displayName: "Участник",
			description: "Просмотр и участие в проектах",
		},
		{
			name: "viewer",
			displayName: "Наблюдатель",
			description: "Только просмотр контента организации",
		},
	];

	const roleIds: Record<string, Id<"roles">> = {};
	for (const role of roles) {
		const roleId = await ctx.db.insert("roles", {
			organizationId,
			name: role.name,
			displayName: role.displayName,
			description: role.description,
			isSystem: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		roleIds[role.name] = roleId;
	}

	return {
		message: "Organization created successfully",
		organizationId,
		rolesCreated: roles.length,
		roleIds,
		tempOwnerId,
	};
}

async function createSampleUsers(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	const now = new Date().toISOString();

	// Get roles
	const adminRole = await ctx.db
		.query("roles")
		.filter((q) =>
			q.and(
				q.eq(q.field("name"), "admin"),
				q.eq(q.field("organizationId"), organizationId),
			),
		)
		.first();
	const managerRole = await ctx.db
		.query("roles")
		.filter((q) =>
			q.and(
				q.eq(q.field("name"), "manager"),
				q.eq(q.field("organizationId"), organizationId),
			),
		)
		.first();
	const memberRole = await ctx.db
		.query("roles")
		.filter((q) =>
			q.and(
				q.eq(q.field("name"), "member"),
				q.eq(q.field("organizationId"), organizationId),
			),
		)
		.first();

	if (!adminRole || !managerRole || !memberRole) {
		throw new Error("Required roles not found");
	}

	const users = [];

	// Create Owner/Admin
	const ownerId = await ctx.db.insert("users", {
		name: "Akmt Owner",
		email: "akmt.me23@gmail.com",
		avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=akmt",
		status: "online",
		roleId: adminRole._id,
		joinedDate: "2020-01-15",
		teamIds: [],
		position: "Генеральный директор",
		currentOrganizationId: organizationId,
		isActive: true,
		lastLogin: now,
	});

	// Add owner as organization member
	await ctx.db.insert("organizationMembers", {
		organizationId,
		userId: ownerId,
		roleId: adminRole._id,
		joinedAt: Date.now(),
		invitedBy: undefined,
		isActive: true,
	});

	// Update organization owner
	await ctx.db.patch(organizationId, { ownerId });

	// Delete the temporary owner user
	const orgResult = await ctx.db.query("organizations").first();
	if (orgResult && "tempOwnerId" in orgResult) {
		try {
			await ctx.db.delete((orgResult as any).tempOwnerId);
		} catch (e) {
			// Temp owner might already be deleted
		}
	}
	// Also try to find and delete by email
	const tempUsers = await ctx.db
		.query("users")
		.filter((q) => q.eq(q.field("email"), "temp@stroycomplex.ru"))
		.collect();
	for (const tempUser of tempUsers) {
		await ctx.db.delete(tempUser._id);
	}

	users.push({ name: "Owner/Admin", id: ownerId });

	// Create other users
	const otherUsers = [
		{
			name: "Мария Иванова",
			email: "maria@stroycomplex.ru",
			position: "Руководитель проектов",
			role: managerRole._id,
		},
		{
			name: "Дмитрий Сидоров",
			email: "dmitry@stroycomplex.ru",
			position: "Главный инженер",
			role: managerRole._id,
		},
		{
			name: "Елена Козлова",
			email: "elena@stroycomplex.ru",
			position: "Архитектор",
			role: memberRole._id,
		},
		{
			name: "Андрей Волков",
			email: "andrey@stroycomplex.ru",
			position: "Инженер-конструктор",
			role: memberRole._id,
		},
		{
			name: "Ольга Новикова",
			email: "olga@stroycomplex.ru",
			position: "Менеджер по закупкам",
			role: memberRole._id,
		},
	];

	for (const userData of otherUsers) {
		const userId = await ctx.db.insert("users", {
			name: userData.name,
			email: userData.email,
			avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
			status: "online",
			roleId: userData.role,
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
			roleId: userData.role,
			joinedAt: Date.now(),
			invitedBy: ownerId,
			isActive: true,
		});

		users.push({ name: userData.name, id: userId });
	}

	return {
		message: "Sample users created",
		usersCreated: users.length,
		users,
	};
}

async function seedOrganizationalPositions(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	const existingPositions = await ctx.db
		.query("organizationalPositions")
		.collect();
	if (existingPositions.length > 0) {
		return { message: "Organizational positions already exist", skipped: true };
	}

	const positions: Record<string, Id<"organizationalPositions">> = {};
	for (const [, position] of Object.entries(ORGANIZATIONAL_POSITIONS)) {
		const positionId = await ctx.db.insert("organizationalPositions", {
			name: position.name,
			displayName: position.displayName,
			level: position.level,
			canManageLevelsBelow: position.level <= 3,
			isUnique: position.level <= 2,
			createdAt: new Date().toISOString(),
		});
		positions[position.name] = positionId;
	}

	return {
		message: "Organizational positions created",
		positionsCreated: Object.keys(positions).length,
	};
}

async function seedDepartments(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	const now = new Date().toISOString();

	// Create root company department
	const companyId = await ctx.db.insert("departments", {
		organizationId,
		name: "company",
		displayName: "СтройКомплекс",
		description: "Главная организация",
		parentId: undefined,
		level: 0,
		isActive: true,
		createdAt: now,
		updatedAt: now,
	});

	// Create main departments
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
		const deptId = await ctx.db.insert("departments", {
			organizationId,
			name: dept.name,
			displayName: dept.displayName,
			description: dept.description,
			parentId: companyId,
			level: 1,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		departmentIds[dept.name] = deptId;
	}

	return {
		message: "Departments created",
		departmentsCreated: departments.length + 1,
		departmentIds,
	};
}

async function createBaseData(ctx: MutationCtx) {
	const created = { statuses: 0, priorities: 0, labels: 0 };

	// Create statuses
	const statuses = [
		{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
		{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
		{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
		{ name: "Завершено", color: "#10B981", iconName: "CheckCircle" },
		{ name: "Отменено", color: "#EF4444", iconName: "XCircle" },
	];

	for (const status of statuses) {
		await ctx.db.insert("status", status);
		created.statuses++;
	}

	// Create priorities
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
		await ctx.db.insert("priorities", priority);
		created.priorities++;
	}

	// Create labels
	const labels = [
		{ name: "Срочно", color: "#FF4444" },
		{ name: "Документация", color: "#4169E1" },
		{ name: "Безопасность", color: "#FFA500" },
		{ name: "Проверка", color: "#32CD32" },
		{ name: "Материалы", color: "#8A2BE2" },
		{ name: "Оборудование", color: "#FF6347" },
	];

	for (const label of labels) {
		await ctx.db.insert("labels", label);
		created.labels++;
	}

	return {
		message: "Base data created",
		...created,
	};
}

async function createTeams(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	// Get users
	const users = await ctx.db
		.query("organizationMembers")
		.withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
		.filter((q) => q.eq(q.field("isActive"), true))
		.collect();

	if (users.length === 0) {
		return { message: "No users found to create teams", teamsCreated: 0 };
	}

	const teams = [
		{
			name: "Команда проектирования",
			description: "Архитектурное и инженерное проектирование",
			leaderId: users[1]?.userId,
		},
		{
			name: "Строительная бригада №1",
			description: "Основная строительная бригада",
			leaderId: users[2]?.userId,
		},
		{
			name: "Инженерная группа",
			description: "Техническое сопровождение проектов",
			leaderId: users[2]?.userId,
		},
		{
			name: "Отдел закупок",
			description: "Закупка материалов и оборудования",
			leaderId: users[5]?.userId,
		},
	];

	const teamIds: Id<"teams">[] = [];

	for (let i = 0; i < teams.length; i++) {
		const team = teams[i];
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

		teamIds.push(teamId);

		// Add team members
		const memberCount = Math.min(3, users.length - i);
		for (let j = 0; j < memberCount; j++) {
			const user = users[i + j];
			if (user) {
				await ctx.db.insert("teamMembers", {
					teamId,
					userId: user.userId,
					joinedAt: Date.now(),
					role: j === 0 ? "leader" : "member",
				});
			}
		}
	}

	return {
		message: "Teams created",
		teamsCreated: teams.length,
		teamIds,
	};
}

async function createConstructionProjects(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	// Get necessary IDs
	const users = await ctx.db
		.query("organizationMembers")
		.withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
		.filter((q) => q.eq(q.field("isActive"), true))
		.collect();
	const statuses = await ctx.db.query("status").collect();
	const priorities = await ctx.db.query("priorities").collect();

	const statusInProgress = statuses.find((s) => s.name === "В работе");
	const statusPlanning = statuses.find((s) => s.name === "К выполнению");
	const priorityHigh = priorities.find((p) => p.name === "Высокий");
	const priorityMedium = priorities.find((p) => p.name === "Средний");

	if (
		!statusInProgress ||
		!statusPlanning ||
		!priorityHigh ||
		!priorityMedium ||
		users.length === 0
	) {
		throw new Error("Required data not found for creating projects");
	}

	const projects = [
		{
			organizationId,
			name: "ЖК Садовый",
			client: "ООО Девелопмент Плюс",
			statusId: statusInProgress._id,
			iconName: "Building",
			percentComplete: 45,
			contractValue: 150000000,
			startDate: "2024-01-15",
			targetDate: "2025-06-30",
			leadId: users[0].userId,
			priorityId: priorityHigh._id,
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект идет по плану",
			location: "г. Москва, ул. Садовая, 15",
			projectType: "residential" as const,
			notes: "Строительство 3 корпусов по 12 этажей",
			teamMemberIds: users.slice(0, 3).map((m) => m.userId),
		},
		{
			organizationId,
			name: "ТЦ Вертикаль",
			client: "АО Торговые центры",
			statusId: statusInProgress._id,
			iconName: "ShoppingCart",
			percentComplete: 30,
			contractValue: 85000000,
			startDate: "2024-03-01",
			targetDate: "2024-12-15",
			leadId: users[1]?.userId || users[0].userId,
			priorityId: priorityHigh._id,
			healthId: "warning",
			healthName: "Требует внимания",
			healthColor: "#F59E0B",
			healthDescription: "Задержки в поставке материалов",
			location: "г. Москва, Ленинский проспект, 45",
			projectType: "commercial" as const,
			notes: "Современный торговый центр с подземной парковкой",
			teamMemberIds: users.slice(1, 4).map((m) => m.userId),
		},
		{
			organizationId,
			name: "Бизнес-центр Альфа",
			client: "ООО БизнесСтрой",
			statusId: statusPlanning._id,
			iconName: "Briefcase",
			percentComplete: 5,
			contractValue: 200000000,
			startDate: "2024-06-01",
			targetDate: "2026-03-31",
			leadId: users[2]?.userId || users[0].userId,
			priorityId: priorityMedium._id,
			healthId: "healthy",
			healthName: "В норме",
			healthColor: "#10B981",
			healthDescription: "Проект на стадии планирования",
			location: "г. Санкт-Петербург, Невский проспект, 100",
			projectType: "commercial" as const,
			notes: "15-этажный бизнес-центр класса А",
			teamMemberIds: users.slice(2, 5).map((m) => m.userId),
		},
	];

	const projectIds: Id<"constructionProjects">[] = [];
	for (const project of projects) {
		const projectId = await ctx.db.insert("constructionProjects", project);
		projectIds.push(projectId);

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

async function createTasks(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	// Get necessary IDs
	const users = await ctx.db
		.query("organizationMembers")
		.withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
		.filter((q) => q.eq(q.field("isActive"), true))
		.collect();
	const statuses = await ctx.db.query("status").collect();
	const priorities = await ctx.db.query("priorities").collect();
	const labels = await ctx.db.query("labels").collect();
	const projects = await ctx.db
		.query("constructionProjects")
		.withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
		.collect();

	if (users.length === 0 || statuses.length === 0 || priorities.length === 0) {
		return {
			message: "Required data not found for creating tasks",
			tasksCreated: 0,
		};
	}

	const tasks = [
		{
			organizationId,
			identifier: "СТРФ-001",
			title: "Проверка фундамента корпуса А",
			description:
				"Необходимо провести инспекцию качества заложенного фундамента корпуса А жилого комплекса",
			statusId: statuses[1]._id,
			assigneeId: users[0].userId,
			priorityId: priorities[1]._id,
			labelIds: [labels[2]?._id, labels[3]?._id].filter(Boolean),
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			projectId: projects[0]?._id,
			rank: "a0",
			dueDate: "2024-04-15",
			isConstructionTask: true,
		},
		{
			organizationId,
			identifier: "СТРЭ-002",
			title: "Согласование электрической схемы",
			description:
				"Получить одобрение электрической схемы от надзорных органов",
			statusId: statuses[0]._id,
			assigneeId: users[2]?.userId || users[0].userId,
			priorityId: priorities[0]._id,
			labelIds: [labels[0]?._id, labels[1]?._id].filter(Boolean),
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			projectId: projects[0]?._id,
			rank: "a1",
			dueDate: "2024-04-10",
			isConstructionTask: true,
		},
		{
			organizationId,
			identifier: "СТРМ-003",
			title: "Закупка строительных материалов",
			description:
				"Заказать цемент, арматуру и кирпич для следующего этапа строительства",
			statusId: statuses[2]._id,
			assigneeId: users[3]?.userId || users[0].userId,
			priorityId: priorities[2]._id,
			labelIds: [labels[4]?._id].filter(Boolean),
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			projectId: projects[1]?._id,
			rank: "a2",
			dueDate: "2024-04-20",
			isConstructionTask: true,
		},
		{
			organizationId,
			identifier: "СТРБ-004",
			title: "Проверка техники безопасности",
			description:
				"Провести еженедельную проверку соблюдения норм техники безопасности на строительной площадке",
			statusId: statuses[3]._id,
			assigneeId: users[0].userId,
			priorityId: priorities[1]._id,
			labelIds: [labels[2]?._id].filter(Boolean),
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			projectId: projects[0]?._id,
			rank: "a3",
			dueDate: "2024-04-05",
			isConstructionTask: true,
		},
		{
			organizationId,
			identifier: "СТРО-005",
			title: "Установка башенного крана",
			description: "Монтаж и ввод в эксплуатацию башенного крана для корпуса Б",
			statusId: statuses[0]._id,
			assigneeId: users[2]?.userId || users[0].userId,
			priorityId: priorities[1]._id,
			labelIds: [labels[5]?._id, labels[2]?._id].filter(Boolean),
			createdAt: new Date().toISOString(),
			cycleId: "cycle-1",
			projectId: projects[0]?._id,
			rank: "a4",
			dueDate: "2024-04-25",
			isConstructionTask: true,
		},
	];

	const taskIds: Id<"issues">[] = [];
	for (const task of tasks) {
		const taskId = await ctx.db.insert("issues", task);
		taskIds.push(taskId);
	}

	return {
		message: "Tasks created",
		tasksCreated: tasks.length,
		taskIds,
	};
}

async function createSampleInvites(
	ctx: MutationCtx,
	organizationId: Id<"organizations">,
) {
	// Get users and roles
	const owner = await ctx.db
		.query("organizationMembers")
		.withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
		.filter((q) => q.eq(q.field("isActive"), true))
		.first();

	const memberRole = await ctx.db
		.query("roles")
		.filter((q) =>
			q.and(
				q.eq(q.field("name"), "member"),
				q.eq(q.field("organizationId"), organizationId),
			),
		)
		.first();

	if (!owner || !memberRole) {
		return {
			message: "Required data not found for creating invites",
			invitesCreated: 0,
		};
	}

	const invites = [
		{
			organizationId,
			email: "newuser1@example.com",
			inviteCode: "DEMO1234",
			roleId: memberRole._id,
			invitedBy: owner.userId,
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
			status: "pending" as const,
			createdAt: Date.now(),
		},
		{
			organizationId,
			email: "newuser2@example.com",
			inviteCode: "DEMO5678",
			roleId: memberRole._id,
			invitedBy: owner.userId,
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
			status: "pending" as const,
			createdAt: Date.now(),
		},
	];

	const inviteIds: Id<"organizationInvites">[] = [];
	for (const invite of invites) {
		const inviteId = await ctx.db.insert("organizationInvites", invite);
		inviteIds.push(inviteId);
	}

	return {
		message: "Sample invites created",
		invitesCreated: invites.length,
		inviteIds,
		inviteCodes: invites.map((i) => i.inviteCode),
	};
}
