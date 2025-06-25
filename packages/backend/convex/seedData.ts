import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
	handler: async (ctx) => {
		// Check if data already exists
		const existingUsers = await ctx.db.query("users").first();
		if (existingUsers) {
			return { message: "Data already seeded" };
		}

		// Create users
		const users = [
			{
				name: "Алексей Иванов",
				email: "alexey.ivanov@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				role: "Прораб",
				joinedDate: "2023-01-15",
				teamIds: ["team1"],
				position: "Главный прораб",
				workload: 85,
			},
			{
				name: "Мария Петрова",
				email: "maria.petrova@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1494790108755-2616b1f2ce86?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				role: "Архитектор",
				joinedDate: "2023-02-01",
				teamIds: ["team2"],
				position: "Ведущий архитектор",
				workload: 75,
			},
			{
				name: "Дмитрий Сидоров",
				email: "dmitriy.sidorov@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
				status: "away" as const,
				role: "Инженер",
				joinedDate: "2023-03-10",
				teamIds: ["team3"],
				position: "Инженер-строитель",
				workload: 90,
			},
			{
				name: "Анна Козлова",
				email: "anna.kozlova@stroika.ru",
				avatarUrl:
					"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
				status: "online" as const,
				role: "Менеджер проекта",
				joinedDate: "2023-01-20",
				teamIds: ["team1", "team4"],
				position: "Менеджер проектов",
				workload: 80,
			},
		];

		const userIds = await Promise.all(
			users.map((user) => ctx.db.insert("users", user)),
		);

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
			{ name: "Критический", level: 0, iconName: "AlertTriangle" },
			{ name: "Высокий", level: 1, iconName: "ArrowUp" },
			{ name: "Средний", level: 2, iconName: "Minus" },
			{ name: "Низкий", level: 3, iconName: "ArrowDown" },
		];

		const priorityIds = await Promise.all(
			priorities.map((priority) => ctx.db.insert("priorities", priority)),
		);

		// Create status
		const statuses = [
			{ name: "К выполнению", color: "#6B7280", iconName: "Circle" },
			{ name: "В работе", color: "#3B82F6", iconName: "Clock" },
			{ name: "На проверке", color: "#F59E0B", iconName: "AlertCircle" },
			{ name: "Завершено", color: "#10B981", iconName: "CheckCircle" },
		];

		const statusIds = await Promise.all(
			statuses.map((status) => ctx.db.insert("status", status)),
		);

		// Create construction projects
		const constructionProjects = [
			{
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

		// Create construction teams
		const constructionTeams = [
			{
				name: "Бригада строителей А",
				shortName: "БСА",
				icon: "Hammer",
				joined: true,
				color: "#3B82F6",
				memberIds: [userIds[0], userIds[2]],
				projectIds: [projectIds[0]],
				department: "construction" as const,
				workload: 85,
			},
			{
				name: "Архитектурная группа",
				shortName: "АГ",
				icon: "Palette",
				joined: true,
				color: "#8B5CF6",
				memberIds: [userIds[1]],
				projectIds: [projectIds[0], projectIds[1]],
				department: "design" as const,
				workload: 75,
			},
			{
				name: "Инженерный отдел",
				shortName: "ИО",
				icon: "Cpu",
				joined: true,
				color: "#10B981",
				memberIds: [userIds[2]],
				projectIds: [projectIds[1]],
				department: "engineering" as const,
				workload: 90,
			},
		];

		const teamIds = await Promise.all(
			constructionTeams.map((team) => ctx.db.insert("constructionTeams", team)),
		);

		// Create construction tasks
		const constructionTasks = [
			{
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
				projectId: undefined,
				rank: "a0",
				dueDate: "2024-02-15",
				isConstructionTask: true,
			},
			{
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
				projectId: undefined,
				rank: "a1",
				dueDate: "2024-02-10",
				isConstructionTask: true,
			},
			{
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
				projectId: undefined,
				rank: "a2",
				dueDate: "2024-02-20",
				isConstructionTask: true,
			},
			{
				identifier: "СТРБ-004",
				title: "Проверка техники безопасности",
				description:
					"Провести еженедельную проверку соблюдения норм техники безопасности на строительной площадке",
				statusId: statusIds[3], // Завершено
				assigneeId: userIds[0],
				priorityId: priorityIds[1], // Высокий
				labelIds: [labelIds[2]], // Безопасность
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: undefined,
				rank: "a3",
				dueDate: "2024-02-05",
				isConstructionTask: true,
			},
			{
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
				projectId: undefined,
				rank: "a4",
				dueDate: "2024-02-25",
				isConstructionTask: true,
			},
			{
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
				projectId: undefined,
				rank: "a5",
				dueDate: "2024-03-15",
				isConstructionTask: true,
			},
			{
				identifier: "СТРП-007",
				title: "Приемка готового объекта",
				description:
					"Подготовка к сдаче объекта заказчику и получение акта приемки",
				statusId: statusIds[0], // К выполнению
				assigneeId: userIds[3],
				priorityId: priorityIds[0], // Критический
				labelIds: [labelIds[1], labelIds[3]], // Документация, Проверка
				createdAt: new Date().toISOString(),
				cycleId: "cycle-1",
				projectId: undefined,
				rank: "a6",
				dueDate: "2024-04-30",
				isConstructionTask: true,
			},
		];

		await Promise.all(
			constructionTasks.map((task) => ctx.db.insert("issues", task)),
		);

		return {
			message: "Initial data seeded successfully",
			counts: {
				users: users.length,
				labels: labels.length,
				priorities: priorities.length,
				statuses: statuses.length,
				projects: constructionProjects.length,
				teams: constructionTeams.length,
				tasks: constructionTasks.length,
			},
		};
	},
});
