import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
	handler: async (ctx) => {
		// Check if data already exists
		const existingOrg = await ctx.db.query("organizations").first();
		if (existingOrg) {
			return { message: "Data already seeded" };
		}

		// Create organization first
		const organizationId = await ctx.db.insert("organizations", {
			name: "СтройКомплекс",
			slug: "stroycomplex",
			description: "Ведущая строительная компания России",
			logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=stroycomplex",
			website: "https://stroycomplex.ru",
			ownerId: undefined as any, // Will be set when we create the owner user
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

		// Create users
		const users = [
			{
				name: "Алексей Иванов",
				email: "alexey.ivanov@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				roleId: roleIds.admin,
				joinedDate: "2023-01-15",
				teamIds: [],
				position: "Генеральный директор",
				currentOrganizationId: organizationId,
				isActive: true,
				lastLogin: new Date().toISOString(),
			},
			{
				name: "Мария Петрова",
				email: "maria.petrova@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1494790108755-2616b1f2ce86?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				roleId: roleIds.manager,
				joinedDate: "2023-02-01",
				teamIds: [],
				position: "Ведущий архитектор",
				currentOrganizationId: organizationId,
				isActive: true,
				lastLogin: new Date().toISOString(),
			},
			{
				name: "Дмитрий Сидоров",
				email: "dmitriy.sidorov@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
				status: "away" as const,
				roleId: roleIds.manager,
				joinedDate: "2023-03-10",
				teamIds: [],
				position: "Инженер-строитель",
				currentOrganizationId: organizationId,
				isActive: true,
				lastLogin: new Date().toISOString(),
			},
			{
				name: "Анна Козлова",
				email: "anna.kozlova@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				roleId: roleIds.member,
				joinedDate: "2023-01-20",
				teamIds: [],
				position: "Менеджер проектов",
				currentOrganizationId: organizationId,
				isActive: true,
				lastLogin: new Date().toISOString(),
			},
		];

		const userIds: Id<"users">[] = [];
		for (let i = 0; i < users.length; i++) {
			const userId = await ctx.db.insert("users", users[i]);
			userIds.push(userId);

			// Add as organization member
			await ctx.db.insert("organizationMembers", {
				organizationId,
				userId,
				roleId: users[i].roleId,
				joinedAt: Date.now(),
				invitedBy: i === 0 ? undefined : userIds[0],
				isActive: true,
			});

			// Update organization owner if first user
			if (i === 0) {
				await ctx.db.patch(organizationId, { ownerId: userId });
			}
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

		const labelIds = await Promise.all(
			labels.map((label) => ctx.db.insert("labels", label)),
		);

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

		const priorityIds = await Promise.all(
			priorities.map((priority) => ctx.db.insert("priorities", priority)),
		);

		// Create status
		const statuses = [
			{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
			{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
			{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
			{ name: "завершено", color: "#10B981", iconName: "CheckCircle" },
		];

		const statusIds = await Promise.all(
			statuses.map((status) => ctx.db.insert("status", status)),
		);

		// Create construction projects
		const constructionProjects = [
			{
				organizationId,
				name: "Жилой комплекс 'Садовый'",
				client: "ООО 'Девелопмент Плюс'",
				statusId: statusIds[1], // В работе
				iconName: "Building",
				percentComplete: 45,
				contractValue: 150000000,
				startDate: "2024-01-15",
				targetDate: "2025-06-30",
				leadId: userIds[0],
				priorityId: priorityIds[1], // Высокий
				healthId: "healthy",
				healthName: "В норме",
				healthColor: "#10B981",
				healthDescription: "Проект идет по плану",
				location: "г. Москва, ул. Садовая, 15",
				projectType: "residential" as const,
				notes: "Строительство 3 корпусов по 12 этажей",
				teamMemberIds: [userIds[0], userIds[1], userIds[3]],
			},
			{
				organizationId,
				name: "Торговый центр 'Вертикаль'",
				client: "АО 'Торговые центры'",
				statusId: statusIds[1], // В работе
				iconName: "ShoppingCart",
				percentComplete: 30,
				contractValue: 85000000,
				startDate: "2024-03-01",
				targetDate: "2024-12-15",
				leadId: userIds[1],
				priorityId: priorityIds[0], // Критический
				healthId: "warning",
				healthName: "Требует внимания",
				healthColor: "#F59E0B",
				healthDescription: "Задержки в поставке материалов",
				location: "г. Москва, Ленинский проспект, 45",
				projectType: "commercial" as const,
				notes: "Современный торговый центр с подземной парковкой",
				teamMemberIds: [userIds[1], userIds[2], userIds[3]],
			},
		];

		const projectIds = await Promise.all(
			constructionProjects.map((project) =>
				ctx.db.insert("constructionProjects", project),
			),
		);

		// Create teams (new structure)
		const teams = [
			{
				organizationId,
				name: "Команда проектирования",
				description: "Архитектурное и инженерное проектирование",
				parentTeamId: undefined,
				leaderId: userIds[1],
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
			{
				organizationId,
				name: "Строительная бригада №1",
				description: "Основная строительная бригада",
				parentTeamId: undefined,
				leaderId: userIds[0],
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
			{
				organizationId,
				name: "Инженерная группа",
				description: "Техническое сопровождение проектов",
				parentTeamId: undefined,
				leaderId: userIds[2],
				isActive: true,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		];

		const teamIds: Id<"teams">[] = [];
		for (const team of teams) {
			const teamId = await ctx.db.insert("teams", team);
			teamIds.push(teamId);

			// Add team members
			if (team.leaderId) {
				await ctx.db.insert("teamMembers", {
					teamId,
					userId: team.leaderId,
					joinedAt: Date.now(),
					role: "leader",
				});
			}

			// Add additional members to teams
			if (teamIds.length === 1) {
				// Add user 3 to team 1
				await ctx.db.insert("teamMembers", {
					teamId,
					userId: userIds[3],
					joinedAt: Date.now(),
					role: "member",
				});
			}
		}

		// Create construction tasks
		const constructionTasks = [
			{
				organizationId,
				identifier: "СТРФ-001",
				title: "Проверка фундамента корпуса А",
				description:
					"Необходимо провести инспекцию качества заложенного фундамента корпуса А жилого комплекса",
				statusId: statusIds[1], // В работе
				assigneeId: userIds[0],
				priorityId: priorityIds[1], // Высокий
				labelIds: [labelIds[2], labelIds[3]], // Безопасность, Проверка
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[0],
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
				statusId: statusIds[0], // К выполнению
				assigneeId: userIds[2],
				priorityId: priorityIds[0], // Критический
				labelIds: [labelIds[0], labelIds[1]], // Срочно, Документация
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[0],
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
				statusId: statusIds[2], // На проверке
				assigneeId: userIds[3],
				priorityId: priorityIds[2], // Средний
				labelIds: [labelIds[4]], // Материалы
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[1],
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
				statusId: statusIds[3], // завершено
				assigneeId: userIds[0],
				priorityId: priorityIds[1], // Высокий
				labelIds: [labelIds[2]], // Безопасность
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[0],
				rank: "a3",
				dueDate: "2024-04-05",
				isConstructionTask: true,
			},
			{
				organizationId,
				identifier: "СТРО-005",
				title: "Установка башенного крана",
				description:
					"Монтаж и ввод в эксплуатацию башенного крана для корпуса Б",
				statusId: statusIds[0], // К выполнению
				assigneeId: userIds[2],
				priorityId: priorityIds[1], // Высокий
				labelIds: [labelIds[5], labelIds[2]], // Оборудование, Безопасность
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[0],
				rank: "a4",
				dueDate: "2024-04-25",
				isConstructionTask: true,
			},
			{
				organizationId,
				identifier: "СТРД-006",
				title: "Разработка ландшафтного дизайна",
				description:
					"Создать проект ландшафтного дизайна для прилегающей территории",
				statusId: statusIds[1], // В работе
				assigneeId: userIds[1],
				priorityId: priorityIds[3], // Низкий
				labelIds: [labelIds[1]], // Документация
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[0],
				rank: "a5",
				dueDate: "2024-05-15",
				isConstructionTask: true,
			},
			{
				organizationId,
				identifier: "СТРП-007",
				title: "Приемка завершеного объекта",
				description:
					"Подготовка к сдаче объекта заказчику и получение акта приемки",
				statusId: statusIds[0], // К выполнению
				assigneeId: userIds[3],
				priorityId: priorityIds[0], // Критический
				labelIds: [labelIds[1], labelIds[3]], // Документация, Проверка
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: projectIds[1],
				rank: "a6",
				dueDate: "2024-06-30",
				isConstructionTask: true,
			},
		];

		await Promise.all(
			constructionTasks.map((task) => ctx.db.insert("issues", task)),
		);

		// Create sample invites
		const invites = [
			{
				organizationId,
				email: "newuser1@example.com",
				inviteCode: "DEMO1234",
				roleId: roleIds.member,
				invitedBy: userIds[0],
				expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
				status: "pending" as const,
				createdAt: Date.now(),
			},
			{
				organizationId,
				email: "newuser2@example.com",
				inviteCode: "DEMO5678",
				roleId: roleIds.member,
				invitedBy: userIds[0],
				expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
				status: "pending" as const,
				createdAt: Date.now(),
			},
		];

		await Promise.all(
			invites.map((invite) => ctx.db.insert("organizationInvites", invite)),
		);

		return {
			message: "Initial data seeded successfully",
			organizationId,
			counts: {
				organization: 1,
				roles: roles.length,
				users: users.length,
				labels: labels.length,
				priorities: priorities.length,
				statuses: statuses.length,
				projects: constructionProjects.length,
				teams: teams.length,
				tasks: constructionTasks.length,
				invites: invites.length,
			},
			inviteCodes: invites.map((i) => i.inviteCode),
		};
	},
});
