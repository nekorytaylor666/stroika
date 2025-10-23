"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useConstructionData } from "@/hooks/use-construction-data";
import {
	BacklogIcon,
	CompletedIcon,
	InProgressIcon,
	PausedIcon,
	TechnicalReviewIcon,
	ToDoIcon,
} from "@/lib/status";
import { useFilterStore } from "@/store/filter-store";
import type { Id } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import {
	AlertTriangle,
	BarChart3,
	Building2,
	CheckIcon,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Circle,
	CircleCheck,
	ListFilter,
	Minus,
	Tag,
	User,
} from "lucide-react";
import { useState } from "react";

// Status icon mapping
const StatusIconMap = {
	BacklogIcon: BacklogIcon,
	PausedIcon: PausedIcon,
	ToDoIcon: ToDoIcon,
	InProgressIcon: InProgressIcon,
	TechnicalReviewIcon: TechnicalReviewIcon,
	CompletedIcon: CompletedIcon,
};

// Priority icon mapping
const PriorityIconMap = {
	"alert-triangle": AlertTriangle,
	"chevron-up": ChevronUp,
	minus: Minus,
	"chevron-down": ChevronDown,
};

// Define filter types
type FilterType = "status" | "assignee" | "priority" | "labels" | "project";

export function ConstructionFilter() {
	const [open, setOpen] = useState<boolean>(false);
	const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

	const { filters, toggleFilter, clearFilters, getActiveFiltersCount } =
		useFilterStore();

	const { tasks, users, statuses, priorities, labels, projects } =
		useConstructionData();

	// Get projectId from route params to filter tasks
	const params = useParams({ strict: false });
	const currentProjectId = (params as any)?.projectId as
		| Id<"constructionProjects">
		| undefined;

	// Filter tasks by current project
	const projectTasks = currentProjectId
		? tasks?.filter((task) => task.projectId === currentProjectId) || []
		: tasks || [];

	// Filter functions
	const getTasksByStatus = (statusId: string) => {
		return projectTasks.filter((task) => task.statusId === statusId);
	};

	const getTasksByAssignee = (assigneeId: string | null) => {
		if (assigneeId === null || assigneeId === "unassigned") {
			return projectTasks.filter((task) => !task.assigneeId);
		}
		return projectTasks.filter((task) => task.assigneeId === assigneeId);
	};

	const getTasksByPriority = (priorityId: string) => {
		return projectTasks.filter((task) => task.priorityId === priorityId);
	};

	const getTasksByLabel = (labelId: string) => {
		return projectTasks.filter((task) => task.labelIds.includes(labelId));
	};

	const getTasksByProject = (projectId: string) => {
		return projectTasks.filter((task) => task.projectId === projectId);
	};

	const StatusIcon = ({
		iconName,
		color,
	}: { iconName: string; color?: string }) => {
		const IconComponent =
			StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
		return (
			<IconComponent
				style={color ? { color } : undefined}
				className="h-4 w-4"
			/>
		);
	};

	const PriorityIcon = ({ iconName }: { iconName: string }) => {
		const IconComponent =
			PriorityIconMap[iconName as keyof typeof PriorityIconMap] || Minus;
		return <IconComponent className="h-4 w-4" />;
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button size="sm" variant="ghost" className="relative">
					<ListFilter className="mr-1 size-4" />
					Фильтр
					{getActiveFiltersCount() > 0 && (
						<span className="-top-1 -right-1 absolute flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
							{getActiveFiltersCount()}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-60 p-0" align="start">
				{activeFilter === null ? (
					<Command>
						<CommandList>
							<CommandGroup>
								<CommandItem
									onSelect={() => setActiveFilter("status")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<CircleCheck className="size-4 text-muted-foreground" />
										Статус
									</span>
									<div className="flex items-center">
										{filters.status.length > 0 && (
											<span className="mr-1 text-muted-foreground text-xs">
												{filters.status.length}
											</span>
										)}
										<ChevronRight className="size-4" />
									</div>
								</CommandItem>
								<CommandItem
									onSelect={() => setActiveFilter("assignee")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<User className="size-4 text-muted-foreground" />
										Исполнитель
									</span>
									<div className="flex items-center">
										{filters.assignee.length > 0 && (
											<span className="mr-1 text-muted-foreground text-xs">
												{filters.assignee.length}
											</span>
										)}
										<ChevronRight className="size-4" />
									</div>
								</CommandItem>
								<CommandItem
									onSelect={() => setActiveFilter("priority")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<BarChart3 className="size-4 text-muted-foreground" />
										Приоритет
									</span>
									<div className="flex items-center">
										{filters.priority.length > 0 && (
											<span className="mr-1 text-muted-foreground text-xs">
												{filters.priority.length}
											</span>
										)}
										<ChevronRight className="size-4" />
									</div>
								</CommandItem>
								<CommandItem
									onSelect={() => setActiveFilter("labels")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<Tag className="size-4 text-muted-foreground" />
										Метки
									</span>
									<div className="flex items-center">
										{filters.labels.length > 0 && (
											<span className="mr-1 text-muted-foreground text-xs">
												{filters.labels.length}
											</span>
										)}
										<ChevronRight className="size-4" />
									</div>
								</CommandItem>
								{!currentProjectId && (
									<CommandItem
										onSelect={() => setActiveFilter("project")}
										className="flex cursor-pointer items-center justify-between"
									>
										<span className="flex items-center gap-2">
											<Building2 className="size-4 text-muted-foreground" />
											Проект
										</span>
										<div className="flex items-center">
											{filters.project.length > 0 && (
												<span className="mr-1 text-muted-foreground text-xs">
													{filters.project.length}
												</span>
											)}
											<ChevronRight className="size-4" />
										</div>
									</CommandItem>
								)}
							</CommandGroup>
							{getActiveFiltersCount() > 0 && (
								<>
									<CommandSeparator />
									<CommandGroup>
										<CommandItem
											onSelect={() => clearFilters()}
											className="text-destructive"
										>
											Очистить все фильтры
										</CommandItem>
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				) : activeFilter === "status" ? (
					<Command>
						<div className="flex items-center border-b p-2">
							<Button
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => setActiveFilter(null)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<span className="ml-2 font-medium">Статус</span>
						</div>
						<CommandInput placeholder="Поиск статуса..." />
						<CommandList>
							<CommandEmpty>Статус не найден.</CommandEmpty>
							<CommandGroup>
								{statuses?.map((item) => (
									<CommandItem
										key={item._id}
										value={item._id}
										onSelect={() => toggleFilter("status", item._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<StatusIcon iconName={item.iconName} color={item.color} />
											{item.name}
										</div>
										{filters.status.includes(item._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTasksByStatus(item._id).length}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				) : activeFilter === "assignee" ? (
					<Command>
						<div className="flex items-center border-b p-2">
							<Button
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => setActiveFilter(null)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<span className="ml-2 font-medium">Исполнитель</span>
						</div>
						<CommandInput placeholder="Поиск исполнителя..." />
						<CommandList>
							<CommandEmpty>Исполнитель не найден.</CommandEmpty>
							<CommandGroup>
								<CommandItem
									value="unassigned"
									onSelect={() => toggleFilter("assignee", "unassigned")}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<User className="size-5" />
										Не назначено
									</div>
									{filters.assignee.includes("unassigned") && (
										<CheckIcon size={16} className="ml-auto" />
									)}
									<span className="text-muted-foreground text-xs">
										{getTasksByAssignee(null).length}
									</span>
								</CommandItem>
								{users?.map((user) => (
									<CommandItem
										key={user._id}
										value={user._id}
										onSelect={() => toggleFilter("assignee", user._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage
													src={user.avatarUrl || undefined}
													alt={user.name || "User"}
												/>
												<AvatarFallback>
													{user.name?.charAt(0) || "U"}
												</AvatarFallback>
											</Avatar>
											{user.name || "Unnamed"}
										</div>
										{filters.assignee.includes(user._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTasksByAssignee(user._id).length}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				) : activeFilter === "priority" ? (
					<Command>
						<div className="flex items-center border-b p-2">
							<Button
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => setActiveFilter(null)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<span className="ml-2 font-medium">Приоритет</span>
						</div>
						<CommandInput placeholder="Поиск приоритета..." />
						<CommandList>
							<CommandEmpty>Приоритет не найден.</CommandEmpty>
							<CommandGroup>
								{priorities?.map((item) => (
									<CommandItem
										key={item._id}
										value={item._id}
										onSelect={() => toggleFilter("priority", item._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<PriorityIcon iconName={item.iconName} />
											{item.name}
										</div>
										{filters.priority.includes(item._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTasksByPriority(item._id).length}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				) : activeFilter === "labels" ? (
					<Command>
						<div className="flex items-center border-b p-2">
							<Button
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => setActiveFilter(null)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<span className="ml-2 font-medium">Метки</span>
						</div>
						<CommandInput placeholder="Поиск меток..." />
						<CommandList>
							<CommandEmpty>Метки не найдены.</CommandEmpty>
							<CommandGroup>
								{labels?.map((label) => (
									<CommandItem
										key={label._id}
										value={label._id}
										onSelect={() => toggleFilter("labels", label._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<span
												className="size-3 rounded-full"
												style={{ backgroundColor: label.color }}
											></span>
											{label.name}
										</div>
										{filters.labels.includes(label._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTasksByLabel(label._id).length}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				) : activeFilter === "project" ? (
					<Command>
						<div className="flex items-center border-b p-2">
							<Button
								variant="ghost"
								size="icon"
								className="size-6"
								onClick={() => setActiveFilter(null)}
							>
								<ChevronRight className="size-4 rotate-180" />
							</Button>
							<span className="ml-2 font-medium">Проект</span>
						</div>
						<CommandInput placeholder="Поиск проектов..." />
						<CommandList>
							<CommandEmpty>Проекты не найдены.</CommandEmpty>
							<CommandGroup>
								{projects?.map((project) => (
									<CommandItem
										key={project._id}
										value={project._id}
										onSelect={() => toggleFilter("project", project._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Building2 className="size-4" />
											{project.name}
										</div>
										{filters.project.includes(project._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTasksByProject(project._id).length}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
