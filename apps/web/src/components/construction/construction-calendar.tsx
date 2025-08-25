"use client";

import { EventCalendar } from "@/components/event-calendar";
import type { CalendarEvent } from "@/components/event-calendar/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { CalendarDays, Search } from "lucide-react";
import { useMemo, useState } from "react";

export function ConstructionCalendar() {
	const projects = useQuery(
		api.constructionProjects.getAllProjectsWithTasksForGantt,
	);
	const [searchQuery, setSearchQuery] = useState("");

	// Convert projects and their tasks to calendar events
	const events = useMemo(() => {
		if (!projects) return [];

		const calendarEvents: CalendarEvent[] = [];

		projects.forEach((project) => {
			// Add project as an event (if it has dates)
			if (project.startDate) {
				const projectEvent: CalendarEvent = {
					id: `project-${project._id}`,
					title: `🏗️ ${project.name}`,
					description: `Проект: ${project.name}\nСтатус: ${project.status?.name || "Неизвестно"}\nРуководитель: ${project.lead?.name || "Неизвестно"}`,
					start: new Date(project.startDate),
					end: project.targetDate
						? new Date(project.targetDate)
						: new Date(project.startDate),
					allDay: true,
					color: "emerald", // Projects in green
				};
				calendarEvents.push(projectEvent);
			}

			// Add tasks as events
			project.tasks.forEach((task) => {
				if (task.dueDate) {
					const taskEvent: CalendarEvent = {
						id: `task-${task._id}`,
						title: task.title,
						description: `Задача: ${task.title}\nПроект: ${project.name}\nСтатус: ${task.status?.name || "Неизвестно"}\nИсполнитель: ${task.assignee?.name || "Не назначен"}`,
						start: new Date(task.startDate),
						end: new Date(task.dueDate),
						allDay: true,
						color: getTaskColor(task.status?.name || ""),
					};
					calendarEvents.push(taskEvent);
				}
			});
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
	}, [projects, searchQuery]);

	// Get color based on task status
	function getTaskColor(statusName: string): CalendarEvent["color"] {
		const status = statusName.toLowerCase();
		if (
			status.includes("завершен") ||
			status.includes("done") ||
			status.includes("completed")
		) {
			return "sky"; // Blue for completed
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

	if (!projects) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground text-sm">
					Загружаем календарь проектов...
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
					<h1 className="font-semibold text-lg">Календарь проектов</h1>
				</div>
				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Поиск проектов и задач..."
							className="h-8 w-64 pr-3 pl-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			</div>

			{/* Calendar */}
			<div className="flex-1 overflow-hidden p-6">
				<EventCalendar events={events} initialView="month" className="h-full" />
			</div>

			{/* Legend */}
			<div className="flex items-center gap-6 border-t px-6 py-3 text-sm">
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-emerald-500" />
					<span className="text-muted-foreground">Проекты</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-amber-500" />
					<span className="text-muted-foreground">В работе</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-3 w-3 rounded-full bg-sky-500" />
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
