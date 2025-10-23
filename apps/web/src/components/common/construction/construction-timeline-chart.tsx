"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	addDays,
	differenceInDays,
	eachDayOfInterval,
	endOfDay,
	format,
	isAfter,
	isBefore,
	isToday,
	parseISO,
	startOfDay,
	subDays,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
	Calendar,
	CalendarDays,
	CheckCircle2,
	Clock,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

interface TimelineChartProps {
	subtasks: any[];
	parentTask: any;
}

export function TimelineChart({ subtasks, parentTask }: TimelineChartProps) {
	// Default date range
	const defaultStartDate = parentTask.createdAt
		? parseISO(parentTask.createdAt)
		: new Date();
	const defaultEndDate = parentTask.dueDate
		? parseISO(parentTask.dueDate)
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

	// Calculate timeline data
	const timelineData = useMemo(() => {
		if (!subtasks || subtasks.length === 0) return null;

		// Get all dates from subtasks
		const allDates = subtasks
			.filter((task) => task.dueDate)
			.map((task) => parseISO(task.dueDate));

		if (allDates.length === 0) return null;

		const today = new Date();

		// Generate day intervals using the selected date range
		const days = eachDayOfInterval({
			start: startOfDay(startDate),
			end: endOfDay(endDate),
		});

		// Calculate cumulative data for each day
		const cumulativeData = days.map((day) => {
			const dayEnd = endOfDay(day);

			// Count tasks that should be done by this day
			const plannedCount = subtasks.filter(
				(task) => task.dueDate && isBefore(parseISO(task.dueDate), dayEnd),
			).length;

			// Count tasks that were actually completed by this day
			const completedCount = subtasks.filter((task) => {
				const isDone =
					task.status?.name === "завершено" || task.status?.name === "Done";
				if (!isDone) return false;

				// For completed tasks, we check if they have a due date before this day
				if (task.dueDate && isBefore(parseISO(task.dueDate), dayEnd)) {
					return true;
				}
				return false;
			}).length;

			return {
				date: day,
				planned: plannedCount,
				completed: completedCount,
				isToday: isToday(day),
			};
		});

		// Calculate max value for scaling
		const maxValue = Math.max(
			...cumulativeData.map((d) => Math.max(d.planned, d.completed)),
			subtasks.length,
		);

		return {
			data: cumulativeData,
			maxValue,
			totalTasks: subtasks.length,
			completedTasks: subtasks.filter(
				(task) =>
					task.status?.name === "завершено" || task.status?.name === "Done",
			).length,
		};
	}, [subtasks, parentTask, startDate, endDate]);

	if (!timelineData || timelineData.data.length === 0) return null;

	// Sampling data if too many days
	const sampledData =
		timelineData.data.length > 10
			? timelineData.data.filter(
					(_, index) =>
						index === 0 ||
						index === timelineData.data.length - 1 ||
						index % Math.ceil(timelineData.data.length / 8) === 0 ||
						timelineData.data[index].isToday,
				)
			: timelineData.data;

	return (
		<div className="space-y-2 rounded-md bg-background/50 p-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 font-medium text-xs">
					<TrendingUp className="h-3 w-3" />
					<span>График выполнения</span>
				</div>
				<div className="flex items-center gap-3 text-xs">
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-blue-500" />
						<span className="text-muted-foreground">План</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-green-500" />
						<span className="text-muted-foreground">Факт</span>
					</div>
				</div>
			</div>

			{/* Date range selectors */}
			<div className="flex items-center gap-2 border-t pt-2">
				<CalendarDays className="h-3 w-3 text-muted-foreground" />
				<span className="text-muted-foreground text-xs">Период:</span>

				{/* Start date */}
				<Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" className="h-6 px-2 text-xs">
							{format(startDate, "d MMM yyyy", { locale: ru })}
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
						<Button variant="outline" size="sm" className="h-6 px-2 text-xs">
							{format(endDate, "d MMM yyyy", { locale: ru })}
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
				<div className="ml-auto flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={() => {
							setCustomStartDate(subDays(new Date(), 7));
							setCustomEndDate(new Date());
						}}
					>
						7д
					</Button>
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
						След. 30д
					</Button>
					{(customStartDate || customEndDate) && (
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-2 text-muted-foreground text-xs"
							onClick={() => {
								setCustomStartDate(undefined);
								setCustomEndDate(undefined);
							}}
						>
							Сброс
						</Button>
					)}
				</div>
			</div>

			{/* Chart */}
			<div className="relative h-32 w-full">
				{/* Grid lines */}
				<div className="absolute inset-0 flex flex-col justify-between">
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="h-px bg-border/50" />
					))}
				</div>

				{/* Chart content */}
				<div className="relative h-full w-full">
					<svg
						className="h-full w-full"
						viewBox={`0 0 ${sampledData.length * 40} 120`}
					>
						{/* Planned line */}
						<polyline
							fill="none"
							stroke="rgb(59, 130, 246)"
							strokeWidth="2"
							points={sampledData
								.map(
									(d, i) =>
										`${i * 40 + 20},${120 - (d.planned / timelineData.maxValue) * 110}`,
								)
								.join(" ")}
						/>

						{/* Completed line */}
						<polyline
							fill="none"
							stroke="rgb(34, 197, 94)"
							strokeWidth="2"
							points={sampledData
								.map(
									(d, i) =>
										`${i * 40 + 20},${120 - (d.completed / timelineData.maxValue) * 110}`,
								)
								.join(" ")}
						/>

						{/* Data points */}
						{sampledData.map((d, i) => (
							<g key={i}>
								{/* Planned point */}
								<circle
									cx={i * 40 + 20}
									cy={120 - (d.planned / timelineData.maxValue) * 110}
									r="3"
									fill="rgb(59, 130, 246)"
									className="hover:r-4"
								/>

								{/* Completed point */}
								<circle
									cx={i * 40 + 20}
									cy={120 - (d.completed / timelineData.maxValue) * 110}
									r="3"
									fill="rgb(34, 197, 94)"
								/>

								{/* Today marker */}
								{d.isToday && (
									<line
										x1={i * 40 + 20}
										y1="0"
										x2={i * 40 + 20}
										y2="120"
										stroke="rgb(239, 68, 68)"
										strokeWidth="1"
										strokeDasharray="4 2"
									/>
								)}
							</g>
						))}
					</svg>
				</div>

				{/* X-axis labels */}
				<div className="-bottom-5 absolute right-0 left-0 flex justify-between">
					{sampledData.map((d, i) => (
						<div
							key={i}
							className={cn(
								"text-[9px] text-muted-foreground",
								d.isToday && "font-semibold text-foreground",
							)}
							style={{ width: "40px", textAlign: "center" }}
						>
							{format(d.date, "d MMM", { locale: ru })}
						</div>
					))}
				</div>

				{/* Y-axis labels */}
				<div className="-left-6 absolute top-0 flex h-full flex-col justify-between text-[9px] text-muted-foreground">
					<span>{timelineData.maxValue}</span>
					<span>{Math.round(timelineData.maxValue * 0.75)}</span>
					<span>{Math.round(timelineData.maxValue * 0.5)}</span>
					<span>{Math.round(timelineData.maxValue * 0.25)}</span>
					<span>0</span>
				</div>
			</div>

			{/* Summary stats */}
			<div className="mt-6 flex justify-between border-t pt-2 text-xs">
				<div className="flex items-center gap-2">
					<Clock className="h-3 w-3 text-muted-foreground" />
					<span className="text-muted-foreground">
						Сегодня: {timelineData.data.find((d) => d.isToday)?.planned || 0} из{" "}
						{timelineData.totalTasks} должно быть завершено
					</span>
				</div>
				<div className="flex items-center gap-2">
					<CheckCircle2 className="h-3 w-3 text-green-500" />
					<span className="font-medium">
						{timelineData.completedTasks} выполнено
					</span>
				</div>
			</div>
		</div>
	);
}
