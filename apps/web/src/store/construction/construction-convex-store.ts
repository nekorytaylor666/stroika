import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Id } from "../../../../packages/backend/convex/_generated/dataModel";

// Types based on Convex schema
export interface ConstructionTask {
	_id: Id<"issues">;
	identifier: string;
	title: string;
	description: string;
	statusId: Id<"status">;
	assigneeId?: Id<"users">;
	priorityId: Id<"priorities">;
	labelIds: Id<"labels">[];
	createdAt: string;
	cycleId: string;
	projectId?: Id<"projects">;
	rank: string;
	dueDate?: string;
	isConstructionTask: boolean;
	// Populated fields
	status?: any;
	assignee?: any;
	priority?: any;
	labels?: any[];
}

export interface ConstructionProject {
	_id: Id<"constructionProjects">;
	name: string;
	client: string;
	statusId: Id<"status">;
	iconName: string;
	percentComplete: number;
	contractValue: number;
	startDate: string;
	targetDate?: string;
	leadId: Id<"users">;
	priorityId: Id<"priorities">;
	healthId: string;
	healthName: string;
	healthColor: string;
	healthDescription: string;
	location: string;
	projectType: "residential" | "commercial" | "industrial" | "infrastructure";
	notes?: string;
	teamMemberIds: Id<"users">[];
	// Populated fields
	status?: any;
	lead?: any;
	priority?: any;
	monthlyRevenue?: any[];
}

export interface ConstructionTeam {
	_id: Id<"constructionTeams">;
	name: string;
	shortName: string;
	icon: string;
	joined: boolean;
	color: string;
	memberIds: Id<"users">[];
	projectIds: Id<"constructionProjects">[];
	department: "design" | "construction" | "engineering" | "management";
	workload: number;
	// Populated fields
	members?: any[];
	projects?: any[];
}

interface FilterOptions {
	status?: string[];
	assignee?: string[];
	priority?: string[];
	client?: string[];
	projectType?: string[];
	location?: string[];
}

interface ConstructionConvexState {
	// Data loading states
	isLoading: boolean;
	error: string | null;

	// Cached data
	projects: ConstructionProject[];
	teams: ConstructionTeam[];
	tasks: ConstructionTask[];
	users: any[];
	labels: any[];
	priorities: any[];
	statuses: any[];

	// Computed data
	projectsByStatus: Record<string, ConstructionProject[]>;
	tasksByStatus: Record<string, ConstructionTask[]>;
	totalContractValue: number;

	// Actions
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// Data setters
	setProjects: (projects: ConstructionProject[]) => void;
	setTeams: (teams: ConstructionTeam[]) => void;
	setTasks: (tasks: ConstructionTask[]) => void;
	setUsers: (users: any[]) => void;
	setLabels: (labels: any[]) => void;
	setPriorities: (priorities: any[]) => void;
	setStatuses: (statuses: any[]) => void;

	// Task management
	addTask: (task: ConstructionTask) => void;
	updateTask: (id: Id<"issues">, updates: Partial<ConstructionTask>) => void;
	deleteTask: (id: Id<"issues">) => void;
	moveTask: (
		taskId: Id<"issues">,
		newStatusId: Id<"status">,
		newRank: string,
	) => void;

	// Project management
	addProject: (project: ConstructionProject) => void;
	updateProject: (
		id: Id<"constructionProjects">,
		updates: Partial<ConstructionProject>,
	) => void;
	deleteProject: (id: Id<"constructionProjects">) => void;

	// Team management
	addTeam: (team: ConstructionTeam) => void;
	updateTeam: (
		id: Id<"constructionTeams">,
		updates: Partial<ConstructionTeam>,
	) => void;
	deleteTeam: (id: Id<"constructionTeams">) => void;

	// Search and filter
	searchTasks: (query: string) => ConstructionTask[];
	searchProjects: (query: string) => ConstructionProject[];
	filterProjects: (filters: FilterOptions) => ConstructionProject[];
	filterTasks: (filters: FilterOptions) => ConstructionTask[];

	// Utility functions
	getTaskById: (id: Id<"issues">) => ConstructionTask | undefined;
	getProjectById: (
		id: Id<"constructionProjects">,
	) => ConstructionProject | undefined;
	getTeamById: (id: Id<"constructionTeams">) => ConstructionTeam | undefined;
	getUserById: (id: Id<"users">) => any | undefined;
	getLabelById: (id: Id<"labels">) => any | undefined;
	getPriorityById: (id: Id<"priorities">) => any | undefined;
	getStatusById: (id: Id<"status">) => any | undefined;

	// Analytics
	calculateTotalContractValue: () => number;
	getTaskStats: () => {
		total: number;
		byStatus: Record<string, number>;
		byPriority: Record<string, number>;
		completed: number;
		overdue: number;
	};

	// Refresh functions
	refreshData: () => void;
}

// Helper functions
const groupTasksByStatus = (
	tasks: ConstructionTask[],
	statuses: any[],
): Record<string, ConstructionTask[]> => {
	const grouped: Record<string, ConstructionTask[]> = {};

	statuses.forEach((status) => {
		grouped[status._id] = tasks.filter((task) => task.statusId === status._id);
	});

	return grouped;
};

const groupProjectsByStatus = (
	projects: ConstructionProject[],
	statuses: any[],
): Record<string, ConstructionProject[]> => {
	const grouped: Record<string, ConstructionProject[]> = {};

	statuses.forEach((status) => {
		grouped[status._id] = projects.filter(
			(project) => project.statusId === status._id,
		);
	});

	return grouped;
};

export const useConstructionConvexStore = create<ConstructionConvexState>()(
	devtools(
		(set, get) => ({
			// Initial state
			isLoading: false,
			error: null,
			projects: [],
			teams: [],
			tasks: [],
			users: [],
			labels: [],
			priorities: [],
			statuses: [],
			projectsByStatus: {},
			tasksByStatus: {},
			totalContractValue: 0,

			// Actions
			setLoading: (loading) => set({ isLoading: loading }),
			setError: (error) => set({ error }),

			// Data setters
			setProjects: (projects) => {
				const { statuses } = get();
				set({
					projects,
					projectsByStatus: groupProjectsByStatus(projects, statuses),
					totalContractValue: projects.reduce(
						(total, project) => total + project.contractValue,
						0,
					),
				});
			},

			setTeams: (teams) => set({ teams }),

			setTasks: (tasks) => {
				const { statuses } = get();
				set({
					tasks,
					tasksByStatus: groupTasksByStatus(tasks, statuses),
				});
			},

			setUsers: (users) => set({ users }),
			setLabels: (labels) => set({ labels }),
			setPriorities: (priorities) => set({ priorities }),

			setStatuses: (statuses) => {
				const { projects, tasks } = get();
				set({
					statuses,
					projectsByStatus: groupProjectsByStatus(projects, statuses),
					tasksByStatus: groupTasksByStatus(tasks, statuses),
				});
			},

			// Task management
			addTask: (task) => {
				const { tasks, statuses } = get();
				const newTasks = [...tasks, task];
				set({
					tasks: newTasks,
					tasksByStatus: groupTasksByStatus(newTasks, statuses),
				});
			},

			updateTask: (id, updates) => {
				const { tasks, statuses } = get();
				const newTasks = tasks.map((task) =>
					task._id === id ? { ...task, ...updates } : task,
				);
				set({
					tasks: newTasks,
					tasksByStatus: groupTasksByStatus(newTasks, statuses),
				});
			},

			deleteTask: (id) => {
				const { tasks, statuses } = get();
				const newTasks = tasks.filter((task) => task._id !== id);
				set({
					tasks: newTasks,
					tasksByStatus: groupTasksByStatus(newTasks, statuses),
				});
			},

			moveTask: (taskId, newStatusId, newRank) => {
				get().updateTask(taskId, { statusId: newStatusId, rank: newRank });
			},

			// Project management
			addProject: (project) => {
				const { projects, statuses } = get();
				const newProjects = [...projects, project];
				set({
					projects: newProjects,
					projectsByStatus: groupProjectsByStatus(newProjects, statuses),
					totalContractValue: newProjects.reduce(
						(total, p) => total + p.contractValue,
						0,
					),
				});
			},

			updateProject: (id, updates) => {
				const { projects, statuses } = get();
				const newProjects = projects.map((project) =>
					project._id === id ? { ...project, ...updates } : project,
				);
				set({
					projects: newProjects,
					projectsByStatus: groupProjectsByStatus(newProjects, statuses),
					totalContractValue: newProjects.reduce(
						(total, p) => total + p.contractValue,
						0,
					),
				});
			},

			deleteProject: (id) => {
				const { projects, statuses } = get();
				const newProjects = projects.filter((project) => project._id !== id);
				set({
					projects: newProjects,
					projectsByStatus: groupProjectsByStatus(newProjects, statuses),
					totalContractValue: newProjects.reduce(
						(total, p) => total + p.contractValue,
						0,
					),
				});
			},

			// Team management
			addTeam: (team) => {
				const { teams } = get();
				set({ teams: [...teams, team] });
			},

			updateTeam: (id, updates) => {
				const { teams } = get();
				const newTeams = teams.map((team) =>
					team._id === id ? { ...team, ...updates } : team,
				);
				set({ teams: newTeams });
			},

			deleteTeam: (id) => {
				const { teams } = get();
				set({ teams: teams.filter((team) => team._id !== id) });
			},

			// Search and filter
			searchTasks: (query) => {
				const { tasks } = get();
				if (!query.trim()) return tasks;

				const lowercaseQuery = query.toLowerCase();
				return tasks.filter(
					(task) =>
						task.title.toLowerCase().includes(lowercaseQuery) ||
						task.description.toLowerCase().includes(lowercaseQuery) ||
						task.identifier.toLowerCase().includes(lowercaseQuery),
				);
			},

			searchProjects: (query) => {
				const { projects } = get();
				if (!query.trim()) return projects;

				const lowercaseQuery = query.toLowerCase();
				return projects.filter(
					(project) =>
						project.name.toLowerCase().includes(lowercaseQuery) ||
						project.client.toLowerCase().includes(lowercaseQuery) ||
						project.location.toLowerCase().includes(lowercaseQuery) ||
						(project.notes &&
							project.notes.toLowerCase().includes(lowercaseQuery)),
				);
			},

			filterProjects: (filters) => {
				const { projects } = get();
				let filtered = projects;

				if (filters.status && filters.status.length > 0) {
					filtered = filtered.filter((project) =>
						filters.status!.includes(project.statusId),
					);
				}

				if (filters.priority && filters.priority.length > 0) {
					filtered = filtered.filter((project) =>
						filters.priority!.includes(project.priorityId),
					);
				}

				if (filters.projectType && filters.projectType.length > 0) {
					filtered = filtered.filter((project) =>
						filters.projectType!.includes(project.projectType),
					);
				}

				return filtered;
			},

			filterTasks: (filters) => {
				const { tasks } = get();
				let filtered = tasks;

				if (filters.status && filters.status.length > 0) {
					filtered = filtered.filter((task) =>
						filters.status!.includes(task.statusId),
					);
				}

				if (filters.assignee && filters.assignee.length > 0) {
					filtered = filtered.filter((task) => {
						if (filters.assignee!.includes("unassigned")) {
							return !task.assigneeId;
						}
						return (
							task.assigneeId && filters.assignee!.includes(task.assigneeId)
						);
					});
				}

				if (filters.priority && filters.priority.length > 0) {
					filtered = filtered.filter((task) =>
						filters.priority!.includes(task.priorityId),
					);
				}

				return filtered;
			},

			// Utility functions
			getTaskById: (id) => get().tasks.find((task) => task._id === id),
			getProjectById: (id) =>
				get().projects.find((project) => project._id === id),
			getTeamById: (id) => get().teams.find((team) => team._id === id),
			getUserById: (id) => get().users.find((user) => user._id === id),
			getLabelById: (id) => get().labels.find((label) => label._id === id),
			getPriorityById: (id) =>
				get().priorities.find((priority) => priority._id === id),
			getStatusById: (id) => get().statuses.find((status) => status._id === id),

			// Analytics
			calculateTotalContractValue: () => {
				const { projects } = get();
				return projects.reduce(
					(total, project) => total + project.contractValue,
					0,
				);
			},

			getTaskStats: () => {
				const { tasks, statuses, priorities } = get();
				const stats = {
					total: tasks.length,
					byStatus: {} as Record<string, number>,
					byPriority: {} as Record<string, number>,
					completed: 0,
					overdue: 0,
				};

				const currentDate = new Date().toISOString().split("T")[0];

				tasks.forEach((task) => {
					// Count by status
					const status = statuses.find((s) => s._id === task.statusId);
					if (status) {
						stats.byStatus[status.name] =
							(stats.byStatus[status.name] || 0) + 1;
						if (status.name === "Завершено") stats.completed++;
					}

					// Count by priority
					const priority = priorities.find((p) => p._id === task.priorityId);
					if (priority) {
						stats.byPriority[priority.name] =
							(stats.byPriority[priority.name] || 0) + 1;
					}

					// Count overdue
					if (task.dueDate && task.dueDate < currentDate) {
						stats.overdue++;
					}
				});

				return stats;
			},

			refreshData: () => {
				const { projects, tasks, statuses } = get();
				set({
					projectsByStatus: groupProjectsByStatus(projects, statuses),
					tasksByStatus: groupTasksByStatus(tasks, statuses),
					totalContractValue: projects.reduce(
						(total, p) => total + p.contractValue,
						0,
					),
				});
			},
		}),
		{
			name: "construction-convex-store",
		},
	),
);
