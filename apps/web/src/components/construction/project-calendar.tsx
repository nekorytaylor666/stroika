"use client";

import { EventCalendar } from "@/components/event-calendar";
import type { CalendarEvent } from "@/components/event-calendar/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { type Id, api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ConstructionProjectCalendarProps {
	projectId: Id<"constructionProjects">;
}

export function ConstructionProjectCalendar({
	projectId,
}: ConstructionProjectCalendarProps) {
	const project = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId,
	});
	const updateTask = useMutation(api.constructionTasks.update);
	const users = useQuery(api.users.getAll);
	const [searchQuery, setSearchQuery] = useState("");
	const { openModal } = useCreateIssueStore();

	// Convert tasks to calendar events
	const events = useMemo(() => {
		if (!project) return [];

		const calendarEvents: CalendarEvent[] = [];

		// Add project milestone if it has a target date
		if (project.targetDate) {
			const projectMilestone: CalendarEvent = {
				id: `project-milestone-${project._id}`,
				title: `🎯 ${project.name} - Дедлайн`,
				description: `Дедлайн проекта: ${project.name}`,
				start: new Date(project.targetDate),
				end: new Date(project.targetDate),
				allDay: true,
				color: "rose", // Red for deadline
			};
			calendarEvents.push(projectMilestone);
		}

		// Add tasks as events
		project.tasks.forEach((task) => {
			// If task has a due date, create a spanning event from creation to due date
			if (task.dueDate) {
				const taskEvent: CalendarEvent = {
					id: `task-${task._id}`,
					title: task.title,
					description: `Задача: ${task.title}\nСтатус: ${task.status?.name || "Unknown"}\nИсполнитель: ${task.assignee?.name || "Не назначен"}\nСоздана: ${format(new Date(task.createdAt), "dd.MM.yyyy")}\nСрок: ${format(new Date(task.dueDate), "dd.MM.yyyy")}`,
					start: new Date(task.createdAt),
					end: new Date(task.dueDate),
					allDay: true,
					color: getTaskColor(task.status?.name || ""),
				};
				calendarEvents.push(taskEvent);
			} else {
				// If no due date, just show as single day event on creation date
				const taskEvent: CalendarEvent = {
					id: `task-${task._id}`,
					title: task.title,
					description: `Задача: ${task.title}\nСтатус: ${task.status?.name || "Unknown"}\nИсполнитель: ${task.assignee?.name || "Не назначен"}\nСоздана: ${format(new Date(task.createdAt), "dd.MM.yyyy")}\nСрок: Не установлен`,
					start: new Date(task.createdAt),
					end: new Date(task.createdAt),
					allDay: true,
					color: getTaskColor(task.status?.name || ""),
				};
				calendarEvents.push(taskEvent);
			}
		});

		// Filter events based on search query
		if (searchQuery) {
			return calendarEvents.filter(
				(event) =>
					event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		return calendarEvents;
	}, [project, searchQuery]);

	// Get color based on task status
	function getTaskColor(statusName: string): CalendarEvent["color"] {
		const status = statusName.toLowerCase();
		if (
			status.includes("завершен") ||
			status.includes("done") ||
			status.includes("completed")
		) {
			return "emerald"; // Green for completed
		}
		if (status.includes("в работе") || status.includes("progress")) {
			return "amber"; // Yellow for in progress
		}
		if (status.includes("проверк") || status.includes("review")) {
			return "violet"; // Purple for review
		}
		if (status.includes("блокирован") || status.includes("blocked")) {
			return "rose"; // Red for blocked
		}
		return "sky"; // Default color
	}

	// Handle new event creation
	const handleEventAdd = (event: CalendarEvent) => {
		// Open create issue modal with pre-filled due date
		openModal({
			projectId,
			dueDate: format(event.start, "yyyy-MM-dd"),
		});
	};

	if (!project || !users) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground text-sm">
					Загружаем календарь проекта...
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="relative flex h-12 items-center justify-between border-b px-6">
				{/* Linear-style gradient border */}
				<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
				<div className="flex items-center gap-4">
					<CalendarDays className="h-5 w-5 text-muted-foreground" />
					<h1 className="font-semibold text-lg">
						Календарь проекта: {project.name}
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Поиск задач..."
							className="h-8 w-64 pr-3 pl-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Button size="xs" onClick={() => openModal({ projectId })}>
						<Plus className="mr-1 h-4 w-4" />
						Новая задача
					</Button>
				</div>
			</div>

			{/* Calendar */}
			<div className="flex-1 overflow-hidden p-6">
				<EventCalendar
					events={events}
					onEventAdd={handleEventAdd}
					initialView="month"
					className="h-full"
					enableDragAndDrop={false}
				/>
			</div>

			{/* Legend */}
			<div className="flex items-center gap-6 border-t px-6 py-3 text-sm">
				<div className="flex items-center gap-2">
					<span className="text-lg">🎯</span>
					<span className="text-muted-foreground">Дедлайн проекта</span>
				</div>
				<div className="mx-2 h-4 w-px bg-border" />
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-amber-500" />
					<span className="text-muted-foreground">В работе</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-emerald-500" />
					<span className="text-muted-foreground">Завершено</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-violet-500" />
					<span className="text-muted-foreground">На проверке</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-rose-500" />
					<span className="text-muted-foreground">Блокировано</span>
				</div>
			</div>
		</div>
	);
}
