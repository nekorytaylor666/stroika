"use client";

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
import {
	BacklogIcon,
	CompletedIcon,
	InProgressIcon,
	PausedIcon,
	TechnicalReviewIcon,
	ToDoIcon,
} from "@/lib/status";
import { useGanttFilterStore } from "@/store/gantt-filter-store";
import type { Id } from "@stroika/backend";
import {
	Building2,
	CheckIcon,
	ChevronRight,
	Circle,
	CircleCheck,
	ListFilter,
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

// Define filter types
type FilterType = "projectStatus" | "project";

interface GanttFilterProps {
	projects: Array<{
		_id: Id<"constructionProjects">;
		name: string;
		status: {
			_id: Id<"status">;
			name: string;
			color: string;
			iconName: string;
		} | null;
		tasks: Array<{
			status: {
				_id: Id<"status">;
			} | null;
		}>;
	}>;
	statuses: Array<{
		_id: Id<"status">;
		name: string;
		color: string;
		iconName: string;
	}>;
}

export function GanttFilter({ projects, statuses }: GanttFilterProps) {
	const [open, setOpen] = useState<boolean>(false);
	const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

	const { filters, toggleFilter, clearFilters, getActiveFiltersCount } =
		useGanttFilterStore();

	// Count projects by status
	const getProjectsByStatus = (statusId: string) => {
		return projects.filter(
			(project) => project.status && project.status._id === statusId,
		);
	};

	// Get unique statuses from projects
	const projectStatuses = Array.from(
		new Set(
			projects
				.map((p) => p.status?._id)
				.filter((id): id is string => id !== null),
		),
	)
		.map((statusId) => statuses.find((s) => s._id === statusId))
		.filter((status): status is NonNullable<typeof status> => status !== null);

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
									onSelect={() => setActiveFilter("projectStatus")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<CircleCheck className="size-4 text-muted-foreground" />
										Статус проекта
									</span>
									<div className="flex items-center">
										{filters.projectStatus.length > 0 && (
											<span className="mr-1 text-muted-foreground text-xs">
												{filters.projectStatus.length}
											</span>
										)}
										<ChevronRight className="size-4" />
									</div>
								</CommandItem>
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
				) : activeFilter === "projectStatus" ? (
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
							<span className="ml-2 font-medium">Статус проекта</span>
						</div>
						<CommandInput placeholder="Поиск статуса..." />
						<CommandList>
							<CommandEmpty>Статус не найден.</CommandEmpty>
							<CommandGroup>
								{projectStatuses.map((item) => (
									<CommandItem
										key={item._id}
										value={item._id}
										onSelect={() => toggleFilter("projectStatus", item._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<StatusIcon iconName={item.iconName} color={item.color} />
											{item.name}
										</div>
										{filters.projectStatus.includes(item._id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getProjectsByStatus(item._id).length}
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
								{projects.map((project) => (
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
											{project.tasks.length} задач
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
