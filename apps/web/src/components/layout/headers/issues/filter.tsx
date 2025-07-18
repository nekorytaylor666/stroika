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
import { useFilterStore } from "@/store/filter-store";
import { useIssuesStore } from "@/store/issues-store";
import {
	BarChart3,
	CheckIcon,
	ChevronRight,
	CircleCheck,
	Folder,
	ListFilter,
	Tag,
	User,
} from "lucide-react";
import { useState } from "react";

// Define filter types
type FilterType = "status" | "assignee" | "priority" | "labels" | "project";

export function Filter() {
	const [open, setOpen] = useState<boolean>(false);
	const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);

	const { filters, toggleFilter, clearFilters, getActiveFiltersCount } =
		useFilterStore();

	const {
		filterByStatus,
		filterByAssignee,
		filterByPriority,
		filterByLabel,
		filterByProject,
	} = useIssuesStore();

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button size="xs" variant="ghost" className="relative">
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
								<CommandItem
									onSelect={() => setActiveFilter("project")}
									className="flex cursor-pointer items-center justify-between"
								>
									<span className="flex items-center gap-2">
										<Folder className="size-4 text-muted-foreground" />
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
								{statuses.map((item) => (
									<CommandItem
										key={item.id}
										value={item.id}
										onSelect={() => toggleFilter("status", item.id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<item.icon />
											{item.name}
										</div>
										{filters.status.includes(item.id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{filterByStatus(item.id).length}
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
										{filterByAssignee(null).length}
									</span>
								</CommandItem>
								{users.map((user) => (
									<CommandItem
										key={user.id}
										value={user.id}
										onSelect={() => toggleFilter("assignee", user.id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage src={user.avatarUrl} alt={user.name} />
												<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
											</Avatar>
											{user.name}
										</div>
										{filters.assignee.includes(user.id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{filterByAssignee(user.id).length}
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
								{priorities.map((item) => (
									<CommandItem
										key={item.id}
										value={item.id}
										onSelect={() => toggleFilter("priority", item.id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<item.icon className="size-4 text-muted-foreground" />
											{item.name}
										</div>
										{filters.priority.includes(item.id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{filterByPriority(item.id).length}
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
								{labels.map((label) => (
									<CommandItem
										key={label.id}
										value={label.id}
										onSelect={() => toggleFilter("labels", label.id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<span
												className="size-3 rounded-full"
												style={{ backgroundColor: label.color }}
											></span>
											{label.name}
										</div>
										{filters.labels.includes(label.id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{filterByLabel(label.id).length}
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
										key={project.id}
										value={project.id}
										onSelect={() => toggleFilter("project", project.id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<project.icon className="size-4" />
											{project.name}
										</div>
										{filters.project.includes(project.id) && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{filterByProject(project.id).length}
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
