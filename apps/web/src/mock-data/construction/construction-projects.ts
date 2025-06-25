import {
	Building,
	Building2,
	Calendar,
	Car,
	DollarSign,
	Factory,
	Home,
	Hospital,
	type LucideIcon,
	MapPin,
	School,
	Truck,
	Users,
	Warehouse,
} from "lucide-react";
import { priorities } from "../priorities";
import type { Priority } from "../priorities";
import { type Status, status } from "../status";
import { users } from "../users";
import type { User } from "../users";

export interface ConstructionProject {
	id: string;
	name: string;
	client: string; // Заказчик
	status: Status;
	icon: LucideIcon;
	percentComplete: number;
	contractValue: number; // Стоимость по договору
	startDate: string;
	targetDate?: string;
	lead: User; // Руководитель проекта
	priority: Priority;
	health: ProjectHealth;
	location: string; // Местоположение объекта
	projectType: "residential" | "commercial" | "industrial" | "infrastructure"; // Тип проекта
	monthlyRevenue: MonthlyRevenue[]; // Помесячная выручка
	notes?: string; // Примечания
	teamMembers: User[]; // Команда проекта
	workCategories: WorkCategory[]; // Категории работ
}

export interface ProjectHealth {
	id: "no-update" | "off-track" | "on-track" | "at-risk";
	name: string;
	color: string;
	description: string;
}

export interface MonthlyRevenue {
	month: string;
	planned: number;
	actual: number;
}

export interface WorkCategory {
	id: string;
	name: string;
	percentComplete: number;
	responsible: User;
	workload: number; // Загруженность в %
}

export const projectHealth: ProjectHealth[] = [
	{
		id: "on-track",
		name: "В графике",
		color: "#10B981",
		description: "Проект выполняется согласно плану и графику.",
	},
	{
		id: "at-risk",
		name: "Под угрозой",
		color: "#F59E0B",
		description: "Проект имеет риски и может быть задержан.",
	},
	{
		id: "off-track",
		name: "Отстает",
		color: "#EF4444",
		description: "Проект отстает от графика и требует внимания.",
	},
	{
		id: "no-update",
		name: "Нет обновлений",
		color: "#6B7280",
		description: "По проекту нет обновлений в течение последних 30 дней.",
	},
];

// Работы из Excel файла
export const workCategories: WorkCategory[] = [
	{
		id: "foundation",
		name: "Нулевой цикл первого этажа",
		percentComplete: 100,
		responsible: users[0],
		workload: 80,
	},
	{
		id: "structure",
		name: "Конструктивные решения",
		percentComplete: 85,
		responsible: users[1],
		workload: 90,
	},
	{
		id: "architecture",
		name: "Архитектурные решения",
		percentComplete: 75,
		responsible: users[2],
		workload: 70,
	},
	{
		id: "engineering",
		name: "Инженерные сети",
		percentComplete: 60,
		responsible: users[3],
		workload: 85,
	},
	{
		id: "interior",
		name: "Дизайн интерьера",
		percentComplete: 40,
		responsible: users[4],
		workload: 60,
	},
];

export const constructionProjects: ConstructionProject[] = [
	{
		id: "proj-001",
		name: 'Строительство многофункционального жилого комплекса по адресу: г.Астана, "Караганда", мкр 245',
		client: 'ТОО "Жуж Pro"',
		status: status[1], // In Progress
		icon: Building,
		percentComplete: 67,
		contractValue: 36000000,
		startDate: "2024-01-15",
		targetDate: "2025-12-31",
		lead: users[0],
		priority: priorities[1], // High
		health: projectHealth[0], // On track
		location: 'г.Астана, "Караганда", мкр 245',
		projectType: "residential",
		monthlyRevenue: [
			{ month: "Январь", planned: 6000000, actual: 5800000 },
			{ month: "Февраль", planned: 6000000, actual: 6200000 },
			{ month: "Март", planned: 6000000, actual: 5900000 },
			{ month: "Апрель", planned: 6000000, actual: 6100000 },
			{ month: "Май", planned: 6000000, actual: 5700000 },
			{ month: "Июнь", planned: 6000000, actual: 6300000 },
		],
		notes: "Проект в активной фазе строительства",
		teamMembers: [users[0], users[1], users[2], users[3]],
		workCategories: workCategories.slice(0, 3),
	},
	{
		id: "proj-002",
		name: 'Разработка ПСД электрических распределительных сетей по адресу: г.Астана "Караганда", р-н Целиноградский',
		client: 'ТОО "Invest Jp"',
		status: status[2], // Review
		icon: Factory,
		percentComplete: 34,
		contractValue: 12500000,
		startDate: "2024-03-01",
		targetDate: "2024-11-30",
		lead: users[1],
		priority: priorities[2], // Medium
		health: projectHealth[1], // At risk
		location: 'г.Астана "Караганда", р-н Целиноградский',
		projectType: "infrastructure",
		monthlyRevenue: [
			{ month: "Январь", planned: 0, actual: 0 },
			{ month: "Февраль", planned: 0, actual: 0 },
			{ month: "Март", planned: 2000000, actual: 1800000 },
			{ month: "Апрель", planned: 2000000, actual: 2100000 },
			{ month: "Май", planned: 2000000, actual: 1900000 },
			{ month: "Июнь", planned: 2000000, actual: 2200000 },
		],
		notes: "Требуется согласование с заказчиком",
		teamMembers: [users[1], users[4], users[5]],
		workCategories: workCategories.slice(1, 4),
	},
	{
		id: "proj-003",
		name: "Строительство торгового центра New Life",
		client: 'ТОО "NEW LEVEL"',
		status: status[3], // Testing
		icon: Building2,
		percentComplete: 89,
		contractValue: 24000000,
		startDate: "2023-06-01",
		targetDate: "2024-08-31",
		lead: users[2],
		priority: priorities[1], // High
		health: projectHealth[0], // On track
		location: "г.Астана, пр. Кабанбай батыра",
		projectType: "commercial",
		monthlyRevenue: [
			{ month: "Январь", planned: 4000000, actual: 3900000 },
			{ month: "Февраль", planned: 4000000, actual: 4200000 },
			{ month: "Март", planned: 4000000, actual: 4100000 },
			{ month: "Апрель", planned: 4000000, actual: 3800000 },
			{ month: "Май", planned: 4000000, actual: 4300000 },
			{ month: "Июнь", planned: 4000000, actual: 4000000 },
		],
		notes: "На стадии финального тестирования систем",
		teamMembers: [users[2], users[3], users[6]],
		workCategories: workCategories.slice(0, 5),
	},
	{
		id: "proj-004",
		name: "Строительство АНПС в городе Тараз и Алматы",
		client: 'ТОО "Атлас Architech"',
		status: status[0], // Todo
		icon: Car,
		percentComplete: 12,
		contractValue: 23000000,
		startDate: "2024-05-15",
		targetDate: "2025-03-31",
		lead: users[3],
		priority: priorities[2], // Medium
		health: projectHealth[2], // Off track
		location: "г.Тараз, г.Алматы",
		projectType: "infrastructure",
		monthlyRevenue: [
			{ month: "Январь", planned: 0, actual: 0 },
			{ month: "Февраль", planned: 0, actual: 0 },
			{ month: "Март", planned: 0, actual: 0 },
			{ month: "Апрель", planned: 0, actual: 0 },
			{ month: "Май", planned: 3000000, actual: 2800000 },
			{ month: "Июнь", planned: 3000000, actual: 2900000 },
		],
		notes: "Проект в стадии планирования",
		teamMembers: [users[3], users[7], users[8]],
		workCategories: workCategories.slice(2, 5),
	},
	{
		id: "proj-005",
		name: "Строительство медицинского реабилитационного центра",
		client: 'Проектный институт "Семиипалатинскурорстройпро ект"',
		status: status[4], // In Review
		icon: Hospital,
		percentComplete: 56,
		contractValue: 28000000,
		startDate: "2023-10-01",
		targetDate: "2024-12-31",
		lead: users[4],
		priority: priorities[0], // Urgent
		health: projectHealth[1], // At risk
		location: "г.Семипалатинск",
		projectType: "commercial",
		monthlyRevenue: [
			{ month: "Январь", planned: 4500000, actual: 4300000 },
			{ month: "Февраль", planned: 4500000, actual: 4600000 },
			{ month: "Март", planned: 4500000, actual: 4400000 },
			{ month: "Апрель", planned: 4500000, actual: 4700000 },
			{ month: "Май", planned: 4500000, actual: 4200000 },
			{ month: "Июнь", planned: 4500000, actual: 4800000 },
		],
		notes: "Требуется ускорение работ",
		teamMembers: [users[4], users[9], users[10]],
		workCategories: workCategories.slice(1, 4),
	},
	{
		id: "proj-006",
		name: "Реконструкция коттеджной зоны Достак",
		client: 'Проектный институт "Семипалатинскурорстройпро ект"',
		status: status[1], // In Progress
		icon: Home,
		percentComplete: 78,
		contractValue: 7000000,
		startDate: "2024-02-01",
		targetDate: "2024-09-30",
		lead: users[5],
		priority: priorities[2], // Medium
		health: projectHealth[0], // On track
		location: "коттеджная зона Достак",
		projectType: "residential",
		monthlyRevenue: [
			{ month: "Январь", planned: 0, actual: 0 },
			{ month: "Февраль", planned: 1200000, actual: 1100000 },
			{ month: "Март", planned: 1200000, actual: 1300000 },
			{ month: "Апрель", planned: 1200000, actual: 1150000 },
			{ month: "Май", planned: 1200000, actual: 1250000 },
			{ month: "Июнь", planned: 1200000, actual: 1200000 },
		],
		notes: "Проект успешно развивается",
		teamMembers: [users[5], users[11]],
		workCategories: workCategories.slice(0, 2),
	},
	{
		id: "proj-007",
		name: "Фундаментные решения БСК",
		client: 'ТОО "RZD AS Group"',
		status: status[5], // Done
		icon: Warehouse,
		percentComplete: 100,
		contractValue: 14000000,
		startDate: "2023-08-01",
		targetDate: "2024-06-30",
		lead: users[6],
		priority: priorities[3], // Low
		health: projectHealth[0], // On track
		location: "г.Астана",
		projectType: "industrial",
		monthlyRevenue: [
			{ month: "Январь", planned: 2300000, actual: 2200000 },
			{ month: "Февраль", planned: 2300000, actual: 2400000 },
			{ month: "Март", planned: 2300000, actual: 2350000 },
			{ month: "Апрель", planned: 2300000, actual: 2250000 },
			{ month: "Май", planned: 2300000, actual: 2450000 },
			{ month: "Июнь", planned: 2300000, actual: 2300000 },
		],
		notes: "Проект успешно завершен",
		teamMembers: [users[6], users[0], users[1]],
		workCategories: workCategories.slice(0, 3),
	},
];

// Utility functions
export function groupProjectsByStatus(
	projects: ConstructionProject[],
): Record<string, ConstructionProject[]> {
	return projects.reduce(
		(acc, project) => {
			const statusId = project.status.id;
			if (!acc[statusId]) {
				acc[statusId] = [];
			}
			acc[statusId].push(project);
			return acc;
		},
		{} as Record<string, ConstructionProject[]>,
	);
}

export function sortProjectsByPriority(
	projects: ConstructionProject[],
): ConstructionProject[] {
	const priorityOrder = {
		urgent: 0,
		high: 1,
		medium: 2,
		low: 3,
		"no-priority": 4,
	};
	return [...projects].sort(
		(a, b) => priorityOrder[a.priority.id] - priorityOrder[b.priority.id],
	);
}

export function calculateTotalContractValue(
	projects: ConstructionProject[],
): number {
	return projects.reduce((total, project) => total + project.contractValue, 0);
}

export function getMonthlyRevenueTotal(
	projects: ConstructionProject[],
	month: string,
): { planned: number; actual: number } {
	return projects.reduce(
		(total, project) => {
			const monthlyData = project.monthlyRevenue.find((m) => m.month === month);
			if (monthlyData) {
				total.planned += monthlyData.planned;
				total.actual += monthlyData.actual;
			}
			return total;
		},
		{ planned: 0, actual: 0 },
	);
}
