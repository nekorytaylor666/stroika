import {
	type ConstructionProject,
	calculateTotalContractValue,
	constructionProjects,
	getMonthlyRevenueTotal,
	groupProjectsByStatus,
	constructionProjects as mockProjects,
	sortProjectsByPriority,
} from "@/mock-data/construction/construction-projects";
import {
	constructionTasks,
	groupConstructionTasksByStatus,
} from "@/mock-data/construction/construction-tasks";
import {
	type ConstructionTeam,
	constructionTeams,
} from "@/mock-data/construction/construction-teams";
import type { Issue } from "@/mock-data/issues";
import type { LabelInterface } from "@/mock-data/labels";
import type { Priority } from "@/mock-data/priorities";
import type { Status } from "@/mock-data/status";
import type { User } from "@/mock-data/users";
import { create } from "zustand";

interface FilterOptions {
	status?: string[];
	assignee?: string[];
	priority?: string[];
	client?: string[];
	projectType?: string[];
	location?: string[];
}

interface ConstructionState {
	// Data
	projects: ConstructionProject[];
	projectsByStatus: Record<string, ConstructionProject[]>;
	teams: ConstructionTeam[];

	// Construction-specific issues/tasks
	constructionIssues: Issue[];
	constructionIssuesByStatus: Record<string, Issue[]>;

	// Analytics
	totalContractValue: number;
	monthlyRevenue: Record<string, { planned: number; actual: number }>;

	// Actions
	getAllProjects: () => ConstructionProject[];
	addProject: (project: ConstructionProject) => void;
	updateProject: (
		id: string,
		updatedProject: Partial<ConstructionProject>,
	) => void;
	deleteProject: (id: string) => void;

	// Construction Task/Issue Management
	getAllConstructionIssues: () => Issue[];
	addConstructionIssue: (issue: Issue) => void;
	updateConstructionIssue: (id: string, updatedIssue: Partial<Issue>) => void;
	deleteConstructionIssue: (id: string) => void;
	updateConstructionIssueStatus: (issueId: string, newStatus: Status) => void;
	updateConstructionIssuePriority: (
		issueId: string,
		newPriority: Priority,
	) => void;
	updateConstructionIssueAssignee: (
		issueId: string,
		newAssignee: User | null,
	) => void;
	addConstructionIssueLabel: (issueId: string, label: LabelInterface) => void;
	removeConstructionIssueLabel: (issueId: string, labelId: string) => void;
	getConstructionIssueById: (id: string) => Issue | undefined;
	searchConstructionIssues: (query: string) => Issue[];

	// Filters
	filterByStatus: (statusId: string) => ConstructionProject[];
	filterByPriority: (priorityId: string) => ConstructionProject[];
	filterByLead: (userId: string | null) => ConstructionProject[];
	filterByClient: (client: string) => ConstructionProject[];
	filterByProjectType: (type: string) => ConstructionProject[];
	filterByLocation: (location: string) => ConstructionProject[];
	searchProjects: (query: string) => ConstructionProject[];
	filterProjects: (filters: FilterOptions) => ConstructionProject[];

	// Status management
	updateProjectStatus: (projectId: string, newStatus: Status) => void;

	// Priority management
	updateProjectPriority: (projectId: string, newPriority: Priority) => void;

	// Lead management
	updateProjectLead: (projectId: string, newLead: User) => void;

	// Financial tracking
	updateContractValue: (projectId: string, newValue: number) => void;
	addMonthlyRevenue: (
		projectId: string,
		month: string,
		planned: number,
		actual: number,
	) => void;

	// Team workload
	getTeamWorkload: (teamId: string) => number;
	updateTeamWorkload: (teamId: string, workload: number) => void;

	// Utility functions
	getProjectById: (id: string) => ConstructionProject | undefined;
	getProjectsByTeam: (teamId: string) => ConstructionProject[];
	calculateProjectProgress: (projectId: string) => number;

	// Refresh data
	refreshData: () => void;
}

// Helper function to group construction issues by status
const groupConstructionIssuesByStatus = (
	issues: Issue[],
): Record<string, Issue[]> => {
	return issues.reduce(
		(acc, issue) => {
			const statusId = issue.status.id;
			if (!acc[statusId]) {
				acc[statusId] = [];
			}
			acc[statusId].push(issue);
			return acc;
		},
		{} as Record<string, Issue[]>,
	);
};

export const useConstructionStore = create<ConstructionState>((set, get) => ({
	// Initial data
	projects: constructionProjects,
	projectsByStatus: groupProjectsByStatus(constructionProjects),
	teams: constructionTeams,
	constructionIssues: constructionTasks, // Initialize with sample construction tasks
	constructionIssuesByStatus: groupConstructionTasksByStatus(constructionTasks),
	totalContractValue: calculateTotalContractValue(constructionProjects),
	monthlyRevenue: {
		Январь: getMonthlyRevenueTotal(constructionProjects, "Январь"),
		Февраль: getMonthlyRevenueTotal(constructionProjects, "Февраль"),
		Март: getMonthlyRevenueTotal(constructionProjects, "Март"),
		Апрель: getMonthlyRevenueTotal(constructionProjects, "Апрель"),
		Май: getMonthlyRevenueTotal(constructionProjects, "Май"),
		Июнь: getMonthlyRevenueTotal(constructionProjects, "Июнь"),
	},

	getAllProjects: () => get().projects,

	addProject: (project) =>
		set((state) => {
			const newProjects = [...state.projects, project];
			return {
				projects: newProjects,
				projectsByStatus: groupProjectsByStatus(newProjects),
				totalContractValue: calculateTotalContractValue(newProjects),
			};
		}),

	updateProject: (id, updatedProject) =>
		set((state) => {
			const newProjects = state.projects.map((project) =>
				project.id === id ? { ...project, ...updatedProject } : project,
			);
			return {
				projects: newProjects,
				projectsByStatus: groupProjectsByStatus(newProjects),
				totalContractValue: calculateTotalContractValue(newProjects),
			};
		}),

	deleteProject: (id) =>
		set((state) => {
			const newProjects = state.projects.filter((project) => project.id !== id);
			return {
				projects: newProjects,
				projectsByStatus: groupProjectsByStatus(newProjects),
				totalContractValue: calculateTotalContractValue(newProjects),
			};
		}),

	// Construction Issue/Task Management
	getAllConstructionIssues: () => get().constructionIssues,

	addConstructionIssue: (issue) =>
		set((state) => {
			const newIssues = [...state.constructionIssues, issue];
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	updateConstructionIssue: (id, updatedIssue) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === id ? { ...issue, ...updatedIssue } : issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	deleteConstructionIssue: (id) =>
		set((state) => {
			const newIssues = state.constructionIssues.filter(
				(issue) => issue.id !== id,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	updateConstructionIssueStatus: (issueId, newStatus) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === issueId ? { ...issue, status: newStatus } : issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	updateConstructionIssuePriority: (issueId, newPriority) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === issueId ? { ...issue, priority: newPriority } : issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	updateConstructionIssueAssignee: (issueId, newAssignee) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === issueId ? { ...issue, assignee: newAssignee } : issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	addConstructionIssueLabel: (issueId, label) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === issueId
					? { ...issue, labels: [...issue.labels, label] }
					: issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	removeConstructionIssueLabel: (issueId, labelId) =>
		set((state) => {
			const newIssues = state.constructionIssues.map((issue) =>
				issue.id === issueId
					? {
							...issue,
							labels: issue.labels.filter((label) => label.id !== labelId),
						}
					: issue,
			);
			return {
				constructionIssues: newIssues,
				constructionIssuesByStatus: groupConstructionIssuesByStatus(newIssues),
			};
		}),

	getConstructionIssueById: (id) =>
		get().constructionIssues.find((issue) => issue.id === id),

	searchConstructionIssues: (query) => {
		const issues = get().constructionIssues;
		if (!query.trim()) return issues;

		const lowercaseQuery = query.toLowerCase();
		return issues.filter(
			(issue) =>
				issue.title.toLowerCase().includes(lowercaseQuery) ||
				issue.description.toLowerCase().includes(lowercaseQuery) ||
				issue.identifier.toLowerCase().includes(lowercaseQuery) ||
				issue.assignee?.name.toLowerCase().includes(lowercaseQuery) ||
				issue.labels.some((label) =>
					label.name.toLowerCase().includes(lowercaseQuery),
				),
		);
	},

	filterByStatus: (statusId) =>
		get().projects.filter((project) => project.status.id === statusId),

	filterByPriority: (priorityId) =>
		get().projects.filter((project) => project.priority.id === priorityId),

	filterByLead: (userId) => {
		if (userId === null) {
			return get().projects.filter((project) => !project.lead);
		}
		return get().projects.filter((project) => project.lead?.id === userId);
	},

	filterByClient: (client) =>
		get().projects.filter((project) =>
			project.client.toLowerCase().includes(client.toLowerCase()),
		),

	filterByProjectType: (type) =>
		get().projects.filter((project) => project.projectType === type),

	filterByLocation: (location) =>
		get().projects.filter((project) =>
			project.location.toLowerCase().includes(location.toLowerCase()),
		),

	searchProjects: (query) => {
		const lowerQuery = query.toLowerCase();
		return get().projects.filter(
			(project) =>
				project.name.toLowerCase().includes(lowerQuery) ||
				project.client.toLowerCase().includes(lowerQuery) ||
				project.location.toLowerCase().includes(lowerQuery) ||
				(project.notes && project.notes.toLowerCase().includes(lowerQuery)),
		);
	},

	filterProjects: (filters) => {
		let filteredProjects = get().projects;

		if (filters.status && filters.status.length > 0) {
			filteredProjects = filteredProjects.filter((project) =>
				filters.status!.includes(project.status.id),
			);
		}

		if (filters.assignee && filters.assignee.length > 0) {
			filteredProjects = filteredProjects.filter((project) => {
				if (filters.assignee!.includes("unassigned")) {
					return !project.lead;
				}
				return project.lead && filters.assignee!.includes(project.lead.id);
			});
		}

		if (filters.priority && filters.priority.length > 0) {
			filteredProjects = filteredProjects.filter((project) =>
				filters.priority!.includes(project.priority.id),
			);
		}

		if (filters.client && filters.client.length > 0) {
			filteredProjects = filteredProjects.filter((project) =>
				filters.client!.some((client) =>
					project.client.toLowerCase().includes(client.toLowerCase()),
				),
			);
		}

		if (filters.projectType && filters.projectType.length > 0) {
			filteredProjects = filteredProjects.filter((project) =>
				filters.projectType!.includes(project.projectType),
			);
		}

		if (filters.location && filters.location.length > 0) {
			filteredProjects = filteredProjects.filter((project) =>
				filters.location!.some((location) =>
					project.location.toLowerCase().includes(location.toLowerCase()),
				),
			);
		}

		return filteredProjects;
	},

	updateProjectStatus: (projectId, newStatus) => {
		get().updateProject(projectId, { status: newStatus });
	},

	updateProjectPriority: (projectId, newPriority) => {
		get().updateProject(projectId, { priority: newPriority });
	},

	updateProjectLead: (projectId, newLead) => {
		get().updateProject(projectId, { lead: newLead });
	},

	updateContractValue: (projectId, newValue) => {
		get().updateProject(projectId, { contractValue: newValue });
	},

	addMonthlyRevenue: (projectId, month, planned, actual) => {
		const project = get().getProjectById(projectId);
		if (project) {
			const existingRevenue = project.monthlyRevenue.filter(
				(r) => r.month !== month,
			);
			const updatedRevenue = [...existingRevenue, { month, planned, actual }];
			get().updateProject(projectId, { monthlyRevenue: updatedRevenue });
		}
	},

	getTeamWorkload: (teamId) => {
		const team = get().teams.find((t) => t.id === teamId);
		return team ? team.workload : 0;
	},

	updateTeamWorkload: (teamId, workload) =>
		set((state) => {
			const newTeams = state.teams.map((team) =>
				team.id === teamId ? { ...team, workload } : team,
			);
			return { teams: newTeams };
		}),

	getProjectById: (id) => get().projects.find((project) => project.id === id),

	getProjectsByTeam: (teamId) => {
		const team = get().teams.find((t) => t.id === teamId);
		return team ? team.projects : [];
	},

	calculateProjectProgress: (projectId) => {
		const project = get().getProjectById(projectId);
		return project ? project.percentComplete : 0;
	},

	refreshData: () =>
		set((state) => ({
			projectsByStatus: groupProjectsByStatus(state.projects),
			totalContractValue: calculateTotalContractValue(state.projects),
			monthlyRevenue: {
				Январь: getMonthlyRevenueTotal(state.projects, "Январь"),
				Февраль: getMonthlyRevenueTotal(state.projects, "Февраль"),
				Март: getMonthlyRevenueTotal(state.projects, "Март"),
				Апрель: getMonthlyRevenueTotal(state.projects, "Апрель"),
				Май: getMonthlyRevenueTotal(state.projects, "Май"),
				Июнь: getMonthlyRevenueTotal(state.projects, "Июнь"),
			},
		})),
}));
