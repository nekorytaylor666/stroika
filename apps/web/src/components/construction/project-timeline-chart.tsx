"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	addDays,
	differenceInDays,
	eachDayOfInterval,
	endOfDay,
	format,
	isAfter,
	isBefore,
	parseISO,
	startOfDay,
	subDays,
} from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface ProjectTimelineChartProps {
	projectData: {
		_id: Id<"constructionProjects">;
		startDate: string;
		targetDate?: string | null;
		taskStats: {
			total: number;
			completed: number;
			inProgress: number;
			notStarted: number;
		};
	};
}

export function ProjectTimelineChart({
	projectData,
}: ProjectTimelineChartProps) {
	// Fetch timeline data with actual task due dates
	const timelineDataQuery = useQuery(
		api.constructionProjects.getProjectTimelineData,
		{
			id: projectData._id,
		},
	);

	// Default date range
	const defaultStartDate = parseISO(projectData.startDate);
	const defaultEndDate = projectData.targetDate
		? parseISO(projectData.targetDate)
		: addDays(new Date(), 30);

	// State for custom date range
	const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
		undefined,
	);
	const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
		undefined,
	);
	const [isStartDateOpen, setIsStartDateOpen] = useState(false);
	const [isEndDateOpen, setIsEndDateOpen] = useState(false);

	// Use custom dates if set, otherwise use defaults
	const startDate = customStartDate || defaultStartDate;
	const endDate = customEndDate || defaultEndDate;

	// Generate timeline data
	const timelineData = useMemo(() => {
		if (!timelineDataQuery) return [];

		const currentDate = new Date();
		const dataPoints = [];
		const totalDays = Math.max(differenceInDays(endDate, startDate), 1);

		// Calculate interval based on range
		const dayInterval = totalDays > 60 ? 7 : totalDays > 30 ? 3 : 1;

		// Generate data points
		const days = eachDayOfInterval({
			start: startOfDay(startDate),
			end: endOfDay(endDate),
		}).filter((_, index) => index % dayInterval === 0);

		// If no data yet, return empty chart
		if (!timelineDataQuery || !timelineDataQuery.project) {
			return [
				{
					date: format(currentDate, "d MMM", { locale: ru }),
					planned: 0,
					completed: 0,
					todo: 0,
				},
			];
		}

		// Get all tasks to track when they were created
		const allTasks = timelineDataQuery.tasks || [];
		const completedTasks = timelineDataQuery.completedTasks || [];

		for (const date of days) {
			const dayEnd = endOfDay(date);

			// Calculate planned: count all tasks created by this date
			let plannedCount = 0;
			if (allTasks.length > 0) {
				plannedCount = allTasks.filter((task) => {
					// Use task creation date from activities if available
					if (task.createdAt) {
						return new Date(task.createdAt) <= dayEnd;
					}
					// Otherwise assume task was created at project start
					return true;
				}).length;
			}

			// Calculate completed: count tasks completed by this date
			let completedCount = 0;
			if (completedTasks.length > 0) {
				completedCount = completedTasks.filter((task) => {
					// If we have a completion date from activities, use it
					if (task.completedAt) {
						return new Date(task.completedAt) <= dayEnd;
					}
					// Otherwise, for past dates, count all completed tasks
					// (this is a fallback for tasks completed before activity tracking was added)
					return date <= currentDate;
				}).length;
			}

			dataPoints.push({
				date: format(date, "d MMM", { locale: ru }),
				planned: plannedCount,
				completed: completedCount,
				todo: plannedCount - completedCount,
			});
		}

		// Add current state if not included
		const today = new Date();
		if (
			days.length > 0 &&
			!days.some(
				(d) =>
					format(d, "d MMM", { locale: ru }) ===
					format(today, "d MMM", { locale: ru }),
			) &&
			today >= startDate &&
			today <= endDate
		) {
			const completedToday = timelineDataQuery.completedTasks?.length || 0;
			const plannedToday = allTasks.length;

			dataPoints.push({
				date: format(today, "d MMM", { locale: ru }),
				planned: plannedToday,
				completed: completedToday,
				todo: plannedToday - completedToday,
			});
		}

		return dataPoints;
	}, [timelineDataQuery, startDate, endDate]);

	return (
		<Card className="p-4">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-sm">План/Факт выполнения задач</h3>

					{/* Date range controls */}
					<div className="flex items-center gap-2">
						<CalendarDays className="h-3 w-3 text-muted-foreground" />

						{/* Start date */}
						<Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="xs"
									className="h-6 px-2 text-xs"
								>
									{format(startDate, "d MMM", { locale: ru })}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<CalendarComponent
									mode="single"
									selected={startDate}
									onSelect={(date) => {
										if (date && (!endDate || isBefore(date, endDate))) {
											setCustomStartDate(date);
											setIsStartDateOpen(false);
										}
									}}
									disabled={(date) => isAfter(date, endDate)}
									locale={ru}
								/>
							</PopoverContent>
						</Popover>

						<span className="text-muted-foreground text-xs">—</span>

						{/* End date */}
						<Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									size="xs"
									className="h-6 px-2 text-xs"
								>
									{format(endDate, "d MMM", { locale: ru })}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<CalendarComponent
									mode="single"
									selected={endDate}
									onSelect={(date) => {
										if (date && (!startDate || isAfter(date, startDate))) {
											setCustomEndDate(date);
											setIsEndDateOpen(false);
										}
									}}
									disabled={(date) => isBefore(date, startDate)}
									locale={ru}
								/>
							</PopoverContent>
						</Popover>

						{/* Preset ranges */}
						<div className="ml-2 flex gap-1">
							<Button
								variant="ghost"
								size="xs"
								className="h-6 px-2 text-xs"
								onClick={() => {
									setCustomStartDate(subDays(new Date(), 30));
									setCustomEndDate(new Date());
								}}
							>
								30д
							</Button>
							<Button
								variant="ghost"
								size="xs"
								className="h-6 px-2 text-xs"
								onClick={() => {
									setCustomStartDate(new Date());
									setCustomEndDate(addDays(new Date(), 30));
								}}
							>
								+30д
							</Button>
							<Button
								variant="ghost"
								size="xs"
								className="h-6 px-2 text-xs"
								onClick={() => {
									setCustomStartDate(undefined);
									setCustomEndDate(undefined);
								}}
							>
								Весь
							</Button>
						</div>
					</div>
				</div>

				<div className="h-[200px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={timelineData}>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="hsl(var(--border))"
							/>
							<XAxis
								dataKey="date"
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="hsl(var(--muted-foreground))"
								fontSize={12}
								tickLine={false}
								axisLine={false}
							/>
							<Tooltip
								formatter={(value: number, name: string) => {
									const taskCount = Number.isNaN(value) ? 0 : value;
									const label =
										name === "planned"
											? "Запланировано"
											: name === "completed"
												? "Выполнено"
												: name === "todo"
													? "К выполнению"
													: name;
									return [
										`${taskCount} ${taskCount === 1 ? "задача" : "задач"}`,
										label,
									];
								}}
								contentStyle={{
									backgroundColor: "var(--background)",
									border: "1px solid var(--border)",
									borderRadius: "6px",
									fontSize: "12px",
								}}
							/>
							{/* Planned tasks area */}
							<Area
								type="monotone"
								dataKey="planned"
								stroke="#3B82F6"
								fill="#3B82F6"
								fillOpacity={0.1}
								strokeWidth={3}
								dot={{ fill: "#3B82F6", r: 4 }}
								activeDot={{ r: 6 }}
							/>
							{/* Completed tasks area */}
							<Area
								type="monotone"
								dataKey="completed"
								stroke="#22C55E"
								fill="#22C55E"
								fillOpacity={0.3}
								strokeWidth={3}
								dot={{ fill: "#22C55E", r: 4 }}
								activeDot={{ r: 6 }}
							/>
							{/* Today marker */}
							<ReferenceLine
								x={format(new Date(), "d MMM", { locale: ru })}
								stroke="#6B7280"
								strokeWidth={1}
								strokeDasharray="3 3"
								label={{
									value: "Сегодня",
									position: "top",
									fill: "#6B7280",
									fontSize: 11,
								}}
							/>
							{/* Deadline marker */}
							{projectData.targetDate && (
								<ReferenceLine
									x={format(new Date(projectData.targetDate), "d MMM", {
										locale: ru,
									})}
									stroke="#EF4444"
									strokeWidth={2}
									strokeDasharray="5 5"
									label={{
										value: "Дедлайн",
										position: "top",
										fill: "#EF4444",
										fontSize: 12,
										fontWeight: 600,
									}}
								/>
							)}
						</ComposedChart>
					</ResponsiveContainer>
				</div>

				<div className="space-y-3">
					{/* Legend */}
					<div className="flex items-center justify-center gap-4">
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1">
								<div
									className="h-0.5 w-4"
									style={{ backgroundColor: "#3B82F6" }}
								/>
								<div
									className="h-3 w-3 rounded-sm"
									style={{ backgroundColor: "#3B82F6", opacity: 0.3 }}
								/>
							</div>
							<span className="text-muted-foreground text-xs">
								Запланировано
							</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="flex items-center gap-1">
								<div
									className="h-0.5 w-4"
									style={{ backgroundColor: "#22C55E" }}
								/>
								<div
									className="h-3 w-3 rounded-sm"
									style={{ backgroundColor: "#22C55E", opacity: 0.3 }}
								/>
							</div>
							<span className="text-muted-foreground text-xs">Выполнено</span>
						</div>
						{projectData.targetDate && (
							<div className="flex items-center gap-2">
								<div
									className="h-3 w-0.5"
									style={{
										backgroundColor: "#EF4444",
										backgroundImage:
											"repeating-linear-gradient(0deg, transparent, transparent 3px, #EF4444 3px, #EF4444 6px)",
									}}
								/>
								<span className="text-muted-foreground text-xs">Дедлайн</span>
							</div>
						)}
					</div>

					{/* Summary stats */}
					{timelineDataQuery && (
						<div className="flex items-center justify-center gap-6 text-xs">
							<div className="text-center">
								<div className="font-medium text-sm">
									{timelineDataQuery.project?.taskStats?.total || 0}
								</div>
								<div className="text-muted-foreground">всего задач</div>
							</div>
							<div className="text-center">
								<div className="font-medium text-sm">
									{timelineDataQuery.tasksWithDueDates?.length || 0}
								</div>
								<div className="text-muted-foreground">с дедлайном</div>
							</div>
							<div className="text-center">
								<div className="font-medium text-sm">
									{timelineDataQuery.completedTasks?.length || 0}
								</div>
								<div className="text-muted-foreground">выполнено</div>
							</div>
							<div className="text-center">
								<div className="font-medium text-sm">
									{timelineData.length > 0
										? timelineData[timelineData.length - 1]?.todo || 0
										: 0}
								</div>
								<div className="text-muted-foreground">к выполнению</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
