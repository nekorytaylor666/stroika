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
	ComposedChart,
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
					actual: 0,
					difference: 0,
				},
			];
		}

		// If no tasks with due dates, just show completed tasks
		if (
			!timelineDataQuery.tasksWithDueDates ||
			timelineDataQuery.tasksWithDueDates.length === 0
		) {
			return days.map((date) => ({
				date: format(date, "d MMM", { locale: ru }),
				planned: 0,
				actual:
					date <= currentDate
						? timelineDataQuery.completedTasks?.length || 0
						: 0,
				difference:
					date <= currentDate
						? timelineDataQuery.completedTasks?.length || 0
						: 0,
			}));
		}

		for (const date of days) {
			const dayEnd = endOfDay(date);

			// Calculate planned: cumulative tasks that should be done by this date
			const plannedCount = timelineDataQuery.tasksWithDueDates.filter(
				(task) => {
					if (!task.dueDate) return false;
					return (
						isBefore(parseISO(task.dueDate), dayEnd) ||
						format(parseISO(task.dueDate), "yyyy-MM-dd") ===
							format(date, "yyyy-MM-dd")
					);
				},
			).length;

			// Calculate actual: count tasks completed by this date using actual completion dates
			let actualCount;
			if (timelineDataQuery.completedTasks) {
				actualCount = timelineDataQuery.completedTasks.filter((task) => {
					// If we have a completion date from activities, use it
					if (task.completedAt) {
						return new Date(task.completedAt) <= dayEnd;
					}
					// Otherwise, for past dates, count all completed tasks
					// (this is a fallback for tasks completed before activity tracking was added)
					return date <= currentDate;
				}).length;
			} else {
				actualCount = 0;
			}

			dataPoints.push({
				date: format(date, "d MMM", { locale: ru }),
				planned: plannedCount,
				actual: actualCount,
				difference: actualCount - plannedCount,
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
			)
		) {
			const plannedToday = timelineDataQuery.tasksWithDueDates.filter(
				(task) => {
					if (!task.dueDate) return false;
					return isBefore(parseISO(task.dueDate), endOfDay(today));
				},
			).length;

			dataPoints.push({
				date: format(today, "d MMM", { locale: ru }),
				planned: plannedToday,
				actual: timelineDataQuery.completedTasks.length,
				difference: timelineDataQuery.completedTasks.length - plannedToday,
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
							<defs>
								<linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
								</linearGradient>
							</defs>
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
											? "План"
											: name === "actual"
												? "Факт"
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
							{/* Planned line with area */}
							<Area
								type="monotone"
								dataKey="planned"
								stroke="#3B82F6"
								fillOpacity={1}
								fill="url(#colorPlanned)"
								strokeWidth={2}
								strokeDasharray="5 3"
							/>
							{/* Actual line with area */}
							<Area
								type="monotone"
								dataKey="actual"
								stroke="#22C55E"
								fillOpacity={1}
								fill="url(#colorActual)"
								strokeWidth={3}
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
									style={{
										backgroundColor: "#3B82F6",
										backgroundImage:
											"repeating-linear-gradient(90deg, transparent, transparent 5px, #3B82F6 5px, #3B82F6 8px)",
									}}
								/>
								<div
									className="h-3 w-3 rounded-sm"
									style={{ backgroundColor: "#3B82F6", opacity: 0.3 }}
								/>
							</div>
							<span className="text-muted-foreground text-xs">План</span>
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
							<span className="text-muted-foreground text-xs">Факт</span>
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
								<div
									className={cn(
										"font-medium text-sm",
										timelineData.length > 0 &&
											timelineData[timelineData.length - 1]?.difference > 0
											? "text-green-600"
											: timelineData[timelineData.length - 1]?.difference < 0
												? "text-red-600"
												: "",
									)}
								>
									{timelineData.length > 0
										? timelineData[timelineData.length - 1]?.difference > 0
											? `+${timelineData[timelineData.length - 1].difference}`
											: timelineData[timelineData.length - 1]?.difference || 0
										: 0}
								</div>
								<div className="text-muted-foreground">отклонение</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
