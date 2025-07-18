import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	GanttFeatureItem,
	GanttFeatureList,
	GanttFeatureListGroup,
	GanttHeader,
	GanttMarker,
	type GanttMarkerProps,
	GanttProvider,
	GanttSidebar,
	GanttSidebarGroup,
	GanttSidebarItem,
	GanttTimeline,
	GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { Skeleton } from "@/components/ui/skeleton";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useConstructionGanttData } from "@/hooks/use-construction-gantt-data";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { parseISO } from "date-fns";
import {
	BarChart3,
	Briefcase,
	ChevronDown,
	Filter,
	Search,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/analytics",
)({
	component: ProjectAnalyticsPage,
});

function ProjectAnalyticsPage() {
	const { projectId } = Route.useParams();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUserId, setSelectedUserId] = useState<string>("all");
	const [selectedStatusIds, setSelectedStatusIds] = useState<string[]>([]);
	const [selectedPriorityIds, setSelectedPriorityIds] = useState<string[]>([]);

	// Get construction data including statuses and priorities
	const { statuses, priorities } = useConstructionData();

	// Fetch project data with tasks
	const projectData = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId as Id<"constructionProjects">,
	});

	// Get Gantt data
	const {
		features,
		projectMarkers,
		project,
		isLoading: ganttLoading,
	} = useConstructionGanttData(projectId as Id<"constructionProjects">);

	// Fetch all users for the filter
	const users = useQuery(api.users.getAll);

	// Filter tasks based on search and user selection
	const filteredTasks = useMemo(() => {
		if (!projectData?.tasks) return [];

		let tasks = projectData.tasks;

		// Filter by search query
		if (searchQuery) {
			tasks = tasks.filter(
				(task) =>
					task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		// Filter by user
		if (selectedUserId !== "all") {
			tasks = tasks.filter((task) => task.assignee?._id === selectedUserId);
		}

		// Filter by status
		if (selectedStatusIds.length > 0) {
			tasks = tasks.filter((task) =>
				selectedStatusIds.includes(task.status._id),
			);
		}

		// Filter by priority
		if (selectedPriorityIds.length > 0) {
			tasks = tasks.filter((task) =>
				selectedPriorityIds.includes(task.priority._id),
			);
		}

		return tasks;
	}, [
		projectData?.tasks,
		searchQuery,
		selectedUserId,
		selectedStatusIds,
		selectedPriorityIds,
	]);

	// Filter Gantt features based on filtered tasks
	const filteredFeatures = useMemo(() => {
		if (!features.length || !filteredTasks.length) return [];

		const filteredTaskIds = new Set(filteredTasks.map((t) => t._id));
		return features.filter((feature) =>
			filteredTaskIds.has(feature.id as Id<"issues">),
		);
	}, [features, filteredTasks]);

	// Prepare timeline markers for Gantt
	const timelineMarkers: GanttMarkerProps[] = useMemo(() => {
		const markers: GanttMarkerProps[] = [];

		// Project start and deadline markers
		if (projectMarkers.startDate) {
			markers.push({
				id: "project-start",
				date: projectMarkers.startDate,
				label: "Начало проекта",
			});
		}
		if (projectMarkers.targetDate) {
			markers.push({
				id: "project-deadline",
				date: projectMarkers.targetDate,
				label: "Дедлайн проекта",
			});
		}

		// Add task deadline markers
		for (const task of filteredTasks) {
			if (
				task.dueDate &&
				task.priority?.name.toLowerCase().includes("критическая")
			) {
				markers.push({
					id: `task-deadline-${task._id}`,
					date: parseISO(task.dueDate),
					label: `Дедлайн: ${task.title}`,
				});
			}
		}

		return markers;
	}, [projectMarkers, filteredTasks]);

	// Group filtered features by status for Gantt
	const featuresByStatus = useMemo(() => {
		return filteredFeatures.reduce(
			(acc, feature) => {
				const statusName = feature.status.name;
				if (!acc[statusName]) acc[statusName] = [];
				acc[statusName].push(feature);
				return acc;
			},
			{} as Record<string, typeof filteredFeatures>,
		);
	}, [filteredFeatures]);

	const isLoading =
		projectData === undefined ||
		users === undefined ||
		ganttLoading ||
		statuses === undefined ||
		priorities === undefined;

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<BarChart3 className="h-8 w-8 text-muted-foreground" />
					<h1 className="font-semibold text-2xl">Аналитика проекта</h1>
				</div>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Поиск задач..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<Select value={selectedUserId} onValueChange={setSelectedUserId}>
							<SelectTrigger className="w-[250px]">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<SelectValue placeholder="Все пользователи" />
								</div>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все пользователи</SelectItem>
								{users?.map((user) => (
									<SelectItem key={user._id} value={user._id}>
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={user.avatarUrl || undefined} />
												<AvatarFallback className="text-xs">
													{user.name?.slice(0, 2).toUpperCase() || "??"}
												</AvatarFallback>
											</Avatar>
											<span>{user.name || "Без имени"}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{/* Status Filter */}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="w-[200px] justify-between"
								>
									<div className="flex items-center gap-2">
										<Filter className="h-4 w-4" />
										<span className="text-sm">
											{selectedStatusIds.length === 0
												? "Все статусы"
												: `${selectedStatusIds.length} статусов`}
										</span>
									</div>
									<ChevronDown className="h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0" align="start">
								<div className="max-h-[300px] overflow-auto">
									<div className="p-2">
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start text-sm"
											onClick={() => setSelectedStatusIds([])}
										>
											Очистить все
										</Button>
									</div>
									<div className="border-t p-2">
										{statuses?.map((status) => (
											<div
												key={status._id}
												className="flex items-center space-x-2 rounded p-2 hover:bg-accent"
											>
												<Checkbox
													checked={selectedStatusIds.includes(status._id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedStatusIds([
																...selectedStatusIds,
																status._id,
															]);
														} else {
															setSelectedStatusIds(
																selectedStatusIds.filter(
																	(id) => id !== status._id,
																),
															);
														}
													}}
												/>
												<label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
													<div
														className="h-3 w-3 rounded-full"
														style={{ backgroundColor: status.color }}
													/>
													<span>{status.name}</span>
												</label>
											</div>
										))}
									</div>
								</div>
							</PopoverContent>
						</Popover>

						{/* Priority Filter */}
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="w-[200px] justify-between"
								>
									<div className="flex items-center gap-2">
										<Filter className="h-4 w-4" />
										<span className="text-sm">
											{selectedPriorityIds.length === 0
												? "Все приоритеты"
												: `${selectedPriorityIds.length} приоритетов`}
										</span>
									</div>
									<ChevronDown className="h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[200px] p-0" align="start">
								<div className="max-h-[300px] overflow-auto">
									<div className="p-2">
										<Button
											variant="ghost"
											size="sm"
											className="w-full justify-start text-sm"
											onClick={() => setSelectedPriorityIds([])}
										>
											Очистить все
										</Button>
									</div>
									<div className="border-t p-2">
										{priorities?.map((priority) => (
											<div
												key={priority._id}
												className="flex items-center space-x-2 rounded p-2 hover:bg-accent"
											>
												<Checkbox
													checked={selectedPriorityIds.includes(priority._id)}
													onCheckedChange={(checked) => {
														if (checked) {
															setSelectedPriorityIds([
																...selectedPriorityIds,
																priority._id,
															]);
														} else {
															setSelectedPriorityIds(
																selectedPriorityIds.filter(
																	(id) => id !== priority._id,
																),
															);
														}
													}}
												/>
												<label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
													<div
														className="h-3 w-3 rounded-full"
														style={{ backgroundColor: priority.color }}
													/>
													<span>{priority.name}</span>
												</label>
											</div>
										))}
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<Card>
					<CardContent className="pt-6">
						<Skeleton className="h-[600px] w-full" />
					</CardContent>
				</Card>
			) : (
				// Gantt Chart Section
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Briefcase className="h-5 w-5" />
							График задач (Диаграмма Ганта)
						</CardTitle>
					</CardHeader>
					<CardContent>
						{filteredFeatures.length > 0 ? (
							<div className="h-[600px] overflow-hidden">
								<GanttProvider range="daily" zoom={100}>
									<GanttSidebar>
										{Object.entries(featuresByStatus).map(
											([statusName, statusFeatures]) => (
												<GanttSidebarGroup key={statusName} name={statusName}>
													{statusFeatures.map((feature) => (
														<GanttSidebarItem
															key={feature.id}
															feature={feature}
														/>
													))}
												</GanttSidebarGroup>
											),
										)}
									</GanttSidebar>
									<GanttTimeline>
										<GanttHeader />
										<GanttFeatureList>
											{Object.entries(featuresByStatus).map(
												([statusName, statusFeatures]) => (
													<GanttFeatureListGroup key={statusName}>
														{statusFeatures.map((feature) => (
															<GanttFeatureItem key={feature.id} {...feature} />
														))}
													</GanttFeatureListGroup>
												),
											)}
										</GanttFeatureList>
										{/* Timeline markers */}
										{timelineMarkers.map((marker) => (
											<GanttMarker
												key={marker.id}
												{...marker}
												className={cn(
													marker.id === "project-deadline" && "bg-red-500",
													marker.id === "project-start" && "bg-green-500",
													marker.id.startsWith("task-deadline") &&
														"bg-orange-500",
												)}
											/>
										))}
										<GanttToday />
									</GanttTimeline>
								</GanttProvider>
							</div>
						) : (
							<div className="flex h-[400px] items-center justify-center">
								<p className="text-muted-foreground">
									Нет задач для отображения на графике
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
