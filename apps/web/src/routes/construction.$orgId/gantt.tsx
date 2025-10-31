import { GanttFilter } from "@/components/layout/headers/construction/gantt-filter";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	type GanttFeature,
	GanttFeatureItem,
	GanttFeatureList,
	GanttFeatureListGroup,
	GanttFeatureRow,
	GanttHeader,
	GanttProvider,
	GanttSidebar,
	GanttSidebarGroup,
	GanttSidebarItem,
	type GanttStatus,
	GanttTimeline,
	GanttToday,
} from "@/components/ui/kibo-ui/gantt";
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
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { useGanttFilterStore } from "@/store/gantt-filter-store";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	addDays,
	endOfDay,
	isAfter,
	isBefore,
	isWithinInterval,
	parseISO,
	startOfDay,
} from "date-fns";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon, Lock, X } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/construction/$orgId/gantt")({
	component: ConstructionGanttView,
});

type ProjectWithTasks = {
	_id: Id<"constructionProjects">;
	name: string;
	startDate: string;
	targetDate?: string;
	status: {
		_id: Id<"status">;
		name: string;
		color: string;
	} | null;
	lead: {
		_id: Id<"user">;
		name: string;
	} | null;
	priority: {
		_id: Id<"priorities">;
		name: string;
	} | null;
	tasks: Array<{
		_id: Id<"issues">;
		title: string;
		startDate: string;
		dueDate?: string;
		status: {
			_id: Id<"status">;
			name: string;
			color: string;
		} | null;
		assignee: {
			_id: Id<"user">;
			name: string;
		} | null;
	}>;
};

function ConstructionGanttView() {
	const permissions = usePermissions();
	const projects = useQuery(
		api.constructionProjects.getAllProjectsWithTasksForGantt,
	);
	const statuses = useQuery(api.metadata.getAllStatus);
	const [range, setRange] = useState<"daily" | "monthly" | "quarterly">(
		"monthly",
	);
	const [zoom, setZoom] = useState(100);
	const [dateRange, setDateRange] = useState<{
		start: Date | undefined;
		end: Date | undefined;
	}>({ start: undefined, end: undefined });
	const [isStartDateOpen, setIsStartDateOpen] = useState(false);
	const [isEndDateOpen, setIsEndDateOpen] = useState(false);

	const { filters, getActiveFiltersCount } = useGanttFilterStore();

	// Filter projects based on active filters
	const filteredProjects = useMemo(() => {
		if (!projects) return [];
		let result = projects;

		// Filter by project
		if (filters.project.length > 0) {
			result = result.filter((project) =>
				filters.project.includes(project._id),
			);
		}

		// Filter by project status
		if (filters.projectStatus.length > 0) {
			result = result.filter(
				(project) =>
					project.status && filters.projectStatus.includes(project.status._id),
			);
		}

		// Filter by date range
		if (dateRange.start || dateRange.end) {
			result = result.filter((project) => {
				const projectStart = parseISO(project.startDate);
				const projectEnd = project.targetDate
					? parseISO(project.targetDate)
					: addDays(projectStart, 90);

				if (dateRange.start && dateRange.end) {
					// Check if project overlaps with date range
					return (
						isWithinInterval(projectStart, {
							start: dateRange.start,
							end: dateRange.end,
						}) ||
						isWithinInterval(projectEnd, {
							start: dateRange.start,
							end: dateRange.end,
						}) ||
						(isBefore(projectStart, dateRange.start) &&
							isAfter(projectEnd, dateRange.end))
					);
				} else if (dateRange.start) {
					return (
						isAfter(projectEnd, dateRange.start) ||
						projectEnd.getTime() === dateRange.start.getTime()
					);
				} else if (dateRange.end) {
					return (
						isBefore(projectStart, dateRange.end) ||
						projectStart.getTime() === dateRange.end.getTime()
					);
				}
				return true;
			});
		}

		// Map to include filtered tasks by date only
		// (project status filter applies to projects, not individual tasks)
		return result.map((project) => ({
			...project,
			tasks: project.tasks.filter((task) => {
				// Filter tasks by date range
				if (dateRange.start || dateRange.end) {
					const taskStart = parseISO(task.startDate);
					const taskEnd = task.dueDate
						? parseISO(task.dueDate)
						: addDays(taskStart, 7);

					if (dateRange.start && dateRange.end) {
						return (
							isWithinInterval(taskStart, {
								start: dateRange.start,
								end: dateRange.end,
							}) ||
							isWithinInterval(taskEnd, {
								start: dateRange.start,
								end: dateRange.end,
							}) ||
							(isBefore(taskStart, dateRange.start) &&
								isAfter(taskEnd, dateRange.end))
						);
					} else if (dateRange.start) {
						return (
							isAfter(taskEnd, dateRange.start) ||
							taskEnd.getTime() === dateRange.start.getTime()
						);
					} else if (dateRange.end) {
						return (
							isBefore(taskStart, dateRange.end) ||
							taskStart.getTime() === dateRange.end.getTime()
						);
					}
				}

				return true;
			}),
		}));
	}, [projects, filters, dateRange]);

	// Convert projects and tasks to Gantt features
	const ganttFeatures: GanttFeature[] = [];
	const projectGroups: Map<
		string,
		{ project: ProjectWithTasks; features: GanttFeature[] }
	> = new Map();

	// Check loading state after all hooks
	if (permissions.isLoading || !projects || !statuses) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view gantt chart using colon notation
	const canViewGantt =
		permissions.hasPermission("projects:read") ||
		permissions.hasPermission("projects:manage") ||
		permissions.hasPermission("constructionProjects:read") ||
		permissions.hasPermission("constructionProjects:manage") ||
		permissions.hasPermission("gantt:read") ||
		permissions.hasPermission("gantt:manage") ||
		permissions.isOwner;

	if (!canViewGantt) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к диаграмме Ганта. Необходимо разрешение
							"projects:read", "gantt:read" или "constructionProjects:read".
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	filteredProjects.forEach((project) => {
		const projectFeatures: GanttFeature[] = [];

		// Add project as a feature
		const projectStatus: GanttStatus = {
			id: project.status?._id || "default",
			name: project.status?.name || "Не указан",
			color: project.status?.color || "#6b7280",
		};

		const projectFeature: GanttFeature = {
			id: project._id,
			name: project.name,
			startAt: parseISO(project.startDate),
			endAt: project.targetDate
				? parseISO(project.targetDate)
				: addDays(parseISO(project.startDate), 90),
			status: projectStatus,
		};

		projectFeatures.push(projectFeature);

		// Add tasks as features
		project.tasks.forEach((task) => {
			const taskStatus: GanttStatus = {
				id: task.status?._id || "default",
				name: task.status?.name || "Не указан",
				color: task.status?.color || "#6b7280",
			};

			const taskFeature: GanttFeature = {
				id: task._id,
				name: task.title,
				startAt: parseISO(task.startDate),
				endAt: task.dueDate
					? parseISO(task.dueDate)
					: addDays(parseISO(task.startDate), 7),
				status: taskStatus,
			};

			projectFeatures.push(taskFeature);
		});

		projectGroups.set(project._id, { project, features: projectFeatures });
		ganttFeatures.push(...projectFeatures);
	});

	return (
		<div className="flex h-full flex-col">
			{/* Header with controls */}
			<div className="flex flex-col gap-3 border-b p-4">
				<div className="flex items-center justify-between">
					<h1 className="font-semibold text-2xl">Диаграмма Ганта</h1>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">Масштаб:</span>
							<Select
								value={range}
								onValueChange={(value: any) => setRange(value)}
							>
								<SelectTrigger className="w-40">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="daily">По дням</SelectItem>
									<SelectItem value="monthly">По месяцам</SelectItem>
									<SelectItem value="quarterly">По кварталам</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">Zoom:</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setZoom(Math.max(50, zoom - 10))}
								disabled={zoom <= 50}
							>
								-
							</Button>
							<span className="w-12 text-center text-sm">{zoom}%</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setZoom(Math.min(200, zoom + 10))}
								disabled={zoom >= 200}
							>
								+
							</Button>
						</div>
					</div>
				</div>

				{/* Filters row */}
				<div className="flex items-center gap-3">
					<GanttFilter projects={projects} statuses={statuses} />

					{/* Date range filters */}
					<Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-start text-left font-normal",
									!dateRange.start && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dateRange.start
									? format(dateRange.start, "d MMM yyyy", { locale: ru })
									: "Дата начала"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={dateRange.start}
								onSelect={(date) => {
									setDateRange({ ...dateRange, start: date });
									setIsStartDateOpen(false);
								}}
								locale={ru}
							/>
						</PopoverContent>
					</Popover>

					<Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"justify-start text-left font-normal",
									!dateRange.end && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{dateRange.end
									? format(dateRange.end, "d MMM yyyy", { locale: ru })
									: "Дата окончания"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={dateRange.end}
								onSelect={(date) => {
									setDateRange({ ...dateRange, end: date });
									setIsEndDateOpen(false);
								}}
								locale={ru}
								disabled={(date) =>
									dateRange.start ? isBefore(date, dateRange.start) : false
								}
							/>
						</PopoverContent>
					</Popover>

					{/* Active filters indicator */}
					{(getActiveFiltersCount() > 0 ||
						dateRange.start ||
						dateRange.end) && (
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground text-sm">
								Активные фильтры:
							</span>
							{getActiveFiltersCount() > 0 && (
								<Badge variant="secondary" className="text-xs">
									{getActiveFiltersCount()}{" "}
									{getActiveFiltersCount() === 1 ? "фильтр" : "фильтров"}
								</Badge>
							)}
							{(dateRange.start || dateRange.end) && (
								<Badge variant="secondary" className="text-xs">
									Даты
								</Badge>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									useGanttFilterStore.getState().clearFilters();
									setDateRange({ start: undefined, end: undefined });
								}}
								className="h-6 px-2"
							>
								<X className="h-3 w-3" />
								Очистить все
							</Button>
						</div>
					)}

					{/* Projects count */}
					<div className="ml-auto text-muted-foreground text-sm">
						Показано проектов: {filteredProjects.length} из {projects.length}
					</div>
				</div>
			</div>

			{/* Gantt Chart */}
			<div className="flex-1 overflow-hidden p-4">
				{filteredProjects.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<p className="text-muted-foreground">
								Нет проектов, соответствующих выбранным фильтрам
							</p>
							<Button
								variant="ghost"
								size="sm"
								className="mt-2"
								onClick={() => {
									useGanttFilterStore.getState().clearFilters();
									setDateRange({ start: undefined, end: undefined });
								}}
							>
								Очистить фильтры
							</Button>
						</div>
					</div>
				) : (
					<GanttProvider range={range} zoom={zoom}>
						<GanttSidebar className="w-80">
							{Array.from(projectGroups.values()).map(
								({ project, features }) => (
									<GanttSidebarGroup
										key={project._id}
										name={`${project.name} (${project.lead?.name || "Без руководителя"})`}
									>
										{features.map((feature) => (
											<GanttSidebarItem
												key={feature.id}
												feature={feature}
												className={
													feature.id === project._id
														? "bg-muted/50 font-medium"
														: "pl-8"
												}
											/>
										))}
									</GanttSidebarGroup>
								),
							)}
						</GanttSidebar>

						<GanttTimeline>
							<GanttHeader />
							<GanttFeatureList>
								<GanttToday />
								{Array.from(projectGroups.values()).map(
									({ project, features }) => {
										// Separate project feature from task features
										const projectFeature = features.find(
											(f) => f.id === project._id,
										);
										const taskFeatures = features.filter(
											(f) => f.id !== project._id,
										);

										return (
											<GanttFeatureListGroup key={project._id}>
												{/* Project row */}
												{projectFeature && (
													<GanttFeatureRow
														features={[projectFeature]}
														className="font-medium"
													>
														{(feature) => (
															<div className="flex items-center gap-2">
																<div
																	className="h-2 w-2 shrink-0 rounded-full"
																	style={{
																		backgroundColor: feature.status.color,
																	}}
																/>
																<p className="flex-1 truncate text-xs">
																	{project.name}
																</p>
															</div>
														)}
													</GanttFeatureRow>
												)}
												{/* Tasks row - all tasks can be on the same row and will be stacked if they overlap */}
												{taskFeatures.length > 0 && (
													<GanttFeatureRow
														features={taskFeatures}
														className="ml-4"
													>
														{(feature) => (
															<div className="flex items-center gap-2">
																<div
																	className="h-2 w-2 shrink-0 rounded-full"
																	style={{
																		backgroundColor: feature.status.color,
																	}}
																/>
																<p className="flex-1 truncate text-xs">
																	{feature.name}
																</p>
															</div>
														)}
													</GanttFeatureRow>
												)}
											</GanttFeatureListGroup>
										);
									},
								)}
							</GanttFeatureList>
						</GanttTimeline>
					</GanttProvider>
				)}
			</div>
		</div>
	);
}
