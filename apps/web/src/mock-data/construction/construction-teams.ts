import { type User, users } from "../users";
import {
	type ConstructionProject,
	constructionProjects,
} from "./construction-projects";

export interface ConstructionTeam {
	id: string;
	name: string;
	shortName: string; // Короткое наименование
	icon: string;
	joined: boolean;
	color: string;
	members: User[];
	projects: ConstructionProject[];
	department: "design" | "construction" | "engineering" | "management"; // Раздел
	workload: number; // Общая загруженность команды в %
}

export const constructionTeams: ConstructionTeam[] = [
	{
		id: "AVK",
		name: "Автоматизация, водопровод и канализация",
		shortName: "АВК",
		icon: "🔧",
		joined: true,
		color: "#3B82F6",
		members: [users[0], users[1], users[2]],
		projects: [constructionProjects[0], constructionProjects[1]],
		department: "engineering",
		workload: 85,
	},
	{
		id: "KJ",
		name: "Конструкции железобетонные",
		shortName: "КЖ",
		icon: "🏗️",
		joined: true,
		color: "#EF4444",
		members: [users[3], users[4], users[5]],
		projects: [
			constructionProjects[0],
			constructionProjects[2],
			constructionProjects[6],
		],
		department: "construction",
		workload: 92,
	},
	{
		id: "AP",
		name: "Архитектурно-планировочные решения",
		shortName: "АП",
		icon: "📐",
		joined: true,
		color: "#10B981",
		members: [users[6], users[7], users[8]],
		projects: [
			constructionProjects[0],
			constructionProjects[2],
			constructionProjects[5],
		],
		department: "design",
		workload: 78,
	},
	{
		id: "KM",
		name: "Конструкции металлические",
		shortName: "КМ",
		icon: "⚙️",
		joined: true,
		color: "#F59E0B",
		members: [users[9], users[10]],
		projects: [constructionProjects[1], constructionProjects[3]],
		department: "construction",
		workload: 65,
	},
	{
		id: "TH",
		name: "Теплотехника",
		shortName: "ТХ",
		icon: "🌡️",
		joined: false,
		color: "#8B5CF6",
		members: [users[11]],
		projects: [constructionProjects[4]],
		department: "engineering",
		workload: 45,
	},
	{
		id: "EL",
		name: "Электротехнические решения",
		shortName: "ЭЛ",
		icon: "⚡",
		joined: true,
		color: "#F97316",
		members: [users[0], users[2], users[4]],
		projects: [
			constructionProjects[1],
			constructionProjects[3],
			constructionProjects[4],
		],
		department: "engineering",
		workload: 88,
	},
	{
		id: "GEO",
		name: "Геодезические изыскания",
		shortName: "ГЕО",
		icon: "🗺️",
		joined: false,
		color: "#06B6D4",
		members: [users[1], users[3]],
		projects: [constructionProjects[0], constructionProjects[3]],
		department: "engineering",
		workload: 72,
	},
	{
		id: "PM",
		name: "Управление проектами",
		shortName: "УП",
		icon: "📊",
		joined: true,
		color: "#EC4899",
		members: [users[5], users[7], users[9]],
		projects: constructionProjects,
		department: "management",
		workload: 95,
	},
	{
		id: "QC",
		name: "Контроль качества",
		shortName: "КК",
		icon: "✅",
		joined: true,
		color: "#84CC16",
		members: [users[6], users[8]],
		projects: [
			constructionProjects[0],
			constructionProjects[2],
			constructionProjects[4],
		],
		department: "management",
		workload: 67,
	},
	{
		id: "LOG",
		name: "Логистика и снабжение",
		shortName: "ЛОГ",
		icon: "🚛",
		joined: false,
		color: "#64748B",
		members: [users[10], users[11]],
		projects: [constructionProjects[0], constructionProjects[1]],
		department: "management",
		workload: 54,
	},
];

// Utility functions
export function getTeamsByDepartment(
	department: ConstructionTeam["department"],
): ConstructionTeam[] {
	return constructionTeams.filter((team) => team.department === department);
}

export function getJoinedTeams(): ConstructionTeam[] {
	return constructionTeams.filter((team) => team.joined);
}

export function calculateTeamWorkload(teamId: string): number {
	const team = constructionTeams.find((t) => t.id === teamId);
	return team ? team.workload : 0;
}

export function getTeamProjects(teamId: string): ConstructionProject[] {
	const team = constructionTeams.find((t) => t.id === teamId);
	return team ? team.projects : [];
}
