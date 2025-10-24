"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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

const chartConfig = {
	planned: {
		label: "К выполнению",
		color: "var(--chart-1)",
	},
	completed: {
		label: "Выполнено",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

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

		// Get all tasks and completed tasks to calculate timeline properly
		const allTasks = timelineDataQuery.tasks || [];
		const completedTasks = timelineDataQuery.completedTasks || [];

		for (const date of days) {
			const dayEnd = endOfDay(date);

			// Calculate total tasks created by this date
			let totalCreatedCount = 0;
			if (allTasks.length > 0) {
				totalCreatedCount = allTasks.filter((task) => {
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

			// Calculate remaining tasks as total created minus completed
			const remainingCount = Math.max(0, totalCreatedCount - completedCount);

			dataPoints.push({
				date: format(date, "d MMM", { locale: ru }),
				planned: remainingCount, // Remaining tasks (total created - completed)
				completed: completedCount,
				todo: remainingCount, // For backward compatibility with summary stats
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
			const totalToday = allTasks.length || 0;
			const remainingToday = Math.max(0, totalToday - completedToday);

			dataPoints.push({
				date: format(today, "d MMM", { locale: ru }),
				planned: remainingToday, // Remaining tasks (total - completed)
				completed: completedToday,
				todo: remainingToday,
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
									size="sm"
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
									size="sm"
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
								size="sm"
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
								size="sm"
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
								size="sm"
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

				<ChartContainer config={chartConfig} className="h-[250px] w-full">
					<AreaChart
						accessibilityLayer
						data={timelineData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" />}
						/>
						<Area
							dataKey="completed"
							type="linear"
							fill="var(--color-completed)"
							fillOpacity={0.4}
							stroke="var(--color-completed)"
							stackId="a"
						/>
						<Area
							dataKey="planned"
							type="linear"
							fill="var(--color-planned)"
							fillOpacity={0.4}
							stroke="var(--color-planned)"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>

				{/* Summary stats */}
				<div className="space-y-3">
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
