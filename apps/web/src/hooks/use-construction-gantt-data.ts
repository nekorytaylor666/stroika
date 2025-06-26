import type { GanttFeature } from "@/components/ui/shadcn-io/gantt";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";

export function useConstructionGanttData(
	projectId: Id<"constructionProjects">,
) {
	// Fetch project data with tasks
	const projectData = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId,
	});

	// Transform tasks into Gantt format
	const ganttFeatures = useMemo<GanttFeature[]>(() => {
		if (!projectData) return [];

		const features: GanttFeature[] = [];

		// Process tasks and convert to Gantt format
		for (const task of projectData.tasks) {
			// Use createdAt as start date and dueDate as end date
			// If no dueDate, use 7 days from creation
			const startDate = startOfDay(parseISO(task.createdAt));
			const endDate = task.dueDate
				? startOfDay(parseISO(task.dueDate))
				: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days default

			features.push({
				id: task._id,
				name: task.title,
				startAt: startDate,
				endAt: endDate,
				status: {
					id: task.status?._id || "no-status",
					name: task.status?.name || "Без статуса",
					color: task.status?.color || "#6b7280",
				},
			});
		}

		return features;
	}, [projectData]);

	// Project timeline markers
	const projectMarkers = useMemo(() => {
		if (!projectData) return { startDate: null, targetDate: null };

		return {
			startDate: projectData.startDate ? parseISO(projectData.startDate) : null,
			targetDate: projectData.targetDate
				? parseISO(projectData.targetDate)
				: null,
		};
	}, [projectData]);

	return {
		features: ganttFeatures,
		projectMarkers,
		project: projectData,
		isLoading: projectData === undefined,
	};
}
