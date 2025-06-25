import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";

export const useConstructionData = () => {
	// Queries
	const projects = useQuery(api.constructionProjects.getAll);
	const teams = useQuery(api.constructionTeams.getAll);
	const tasks = useQuery(api.constructionTasks.getAll);
	const users = useQuery(api.users.getAll);
	const labels = useQuery(api.metadata.getAllLabels);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const statuses = useQuery(api.metadata.getAllStatus);

	// Mutations
	const createTask = useMutation(api.constructionTasks.create);
	const updateTask = useMutation(api.constructionTasks.update);
	const deleteTask = useMutation(api.constructionTasks.deleteTask);
	const moveTask = useMutation(api.constructionTasks.moveTask);
	const updateTaskStatus = useMutation(api.constructionTasks.updateStatus);
	const updateTaskAssignee = useMutation(api.constructionTasks.updateAssignee);
	const updateTaskPriority = useMutation(api.constructionTasks.updatePriority);

	const createProject = useMutation(api.constructionProjects.create);
	const updateProject = useMutation(api.constructionProjects.update);
	const deleteProject = useMutation(api.constructionProjects.deleteProject);
	const updateProjectStatus = useMutation(
		api.constructionProjects.updateStatus,
	);
	const updateProjectProgress = useMutation(
		api.constructionProjects.updateProgress,
	);

	const createTeam = useMutation(api.constructionTeams.create);
	const updateTeam = useMutation(api.constructionTeams.update);
	const deleteTeam = useMutation(api.constructionTeams.deleteTeam);

	const seedData = useMutation(api.seedData.seedInitialData);

	// Loading state
	const isLoading =
		projects === undefined ||
		teams === undefined ||
		tasks === undefined ||
		users === undefined ||
		labels === undefined ||
		priorities === undefined ||
		statuses === undefined;

	// Computed values
	const totalContractValue = useMemo(() => {
		if (!projects) return 0;
		return projects.reduce((sum, project) => sum + project.contractValue, 0);
	}, [projects]);

	const tasksByStatus = useMemo(() => {
		if (!tasks || !statuses) return {};
		const result: Record<string, any[]> = {};
		statuses.forEach((status) => {
			result[status._id] = tasks.filter((task) => task.statusId === status._id);
		});
		return result;
	}, [tasks, statuses]);

	// Utility functions
	const getUserById = (id: string) => users?.find((u) => u._id === id);
	const getProjectById = (id: string) => projects?.find((p) => p._id === id);
	const getStatusById = (id: string) => statuses?.find((s) => s._id === id);
	const getPriorityById = (id: string) => priorities?.find((p) => p._id === id);
	const getLabelById = (id: string) => labels?.find((l) => l._id === id);

	// Search and filter functions
	const searchTasks = (query: string) => {
		if (!tasks || !query.trim()) return [];
		const lowercaseQuery = query.toLowerCase();
		return tasks.filter(
			(task) =>
				task.title.toLowerCase().includes(lowercaseQuery) ||
				task.description.toLowerCase().includes(lowercaseQuery) ||
				task.identifier.toLowerCase().includes(lowercaseQuery),
		);
	};

	const filterTasks = (filters: any) => {
		if (!tasks) return [];
		let result = tasks;

		if (filters.status && filters.status.length > 0) {
			result = result.filter((task) => filters.status.includes(task.statusId));
		}

		if (filters.assignee && filters.assignee.length > 0) {
			result = result.filter((task) => {
				if (filters.assignee.includes("unassigned")) {
					if (!task.assigneeId) return true;
				}
				return task.assigneeId && filters.assignee.includes(task.assigneeId);
			});
		}

		if (filters.priority && filters.priority.length > 0) {
			result = result.filter((task) =>
				filters.priority.includes(task.priorityId),
			);
		}

		if (filters.labels && filters.labels.length > 0) {
			result = result.filter((task) =>
				task.labelIds?.some((labelId) => filters.labels.includes(labelId)),
			);
		}

		if (filters.project && filters.project.length > 0) {
			result = result.filter(
				(task) => task.projectId && filters.project.includes(task.projectId),
			);
		}

		return result;
	};

	// Task operations
	const handleCreateTask = async (taskData: {
		identifier: string;
		title: string;
		description: string;
		statusId: Id<"status">;
		assigneeId?: Id<"users">;
		priorityId: Id<"priorities">;
		labelIds: Id<"labels">[];
		cycleId: string;
		projectId?: Id<"projects">;
		rank: string;
		dueDate?: string;
	}) => {
		try {
			const newTaskId = await createTask(taskData);
			return newTaskId;
		} catch (error) {
			console.error("Failed to create task:", error);
			throw error;
		}
	};

	const handleUpdateTask = async (id: Id<"issues">, updates: any) => {
		try {
			await updateTask({ id, ...updates });
		} catch (error) {
			console.error("Failed to update task:", error);
			throw error;
		}
	};

	const handleDeleteTask = async (id: Id<"issues">) => {
		try {
			await deleteTask({ id });
		} catch (error) {
			console.error("Failed to delete task:", error);
			throw error;
		}
	};

	const handleMoveTask = async (
		id: Id<"issues">,
		newStatusId: Id<"status">,
		newRank: string,
	) => {
		try {
			await moveTask({ id, newStatusId, newRank });
		} catch (error) {
			console.error("Failed to move task:", error);
			throw error;
		}
	};

	const handleSeedData = async () => {
		try {
			const result = await seedData({});
			console.log("Data seeded:", result);
			return result;
		} catch (error) {
			console.error("Failed to seed data:", error);
			throw error;
		}
	};

	return {
		// Raw data
		projects,
		teams,
		tasks,
		users,
		labels,
		priorities,
		statuses,

		// Loading states
		isLoading,

		// Computed values
		totalContractValue,
		tasksByStatus,

		// Utility functions
		getUserById,
		getProjectById,
		getStatusById,
		getPriorityById,
		getLabelById,

		// Search and filter
		searchTasks,
		filterTasks,

		// Operations
		createTask: handleCreateTask,
		updateTask: handleUpdateTask,
		deleteTask: handleDeleteTask,
		moveTask: handleMoveTask,
		updateTaskStatus,
		updateTaskAssignee,
		updateTaskPriority,

		createProject,
		updateProject,
		deleteProject,
		updateProjectStatus,
		updateProjectProgress,

		createTeam,
		updateTeam,
		deleteTeam,

		// Utility
		seedData: handleSeedData,
	};
};
