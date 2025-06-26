"use client";

import { cn } from "@/lib/utils";
import { isToday, isWeekend } from "date-fns";
import { useGantt } from "./gantt-context";

interface GanttGridProps {
	headerHeight: number;
}

export function GanttGrid({ headerHeight }: GanttGridProps) {
	const { tasks, getDatesInRange, showWeekends, cellWidth, rowHeight } =
		useGantt();
	const dates = getDatesInRange();

	// Group tasks by their group property
	const groupedTasks = tasks.reduce(
		(acc, task) => {
			const group = task.group || "Ungrouped";
			if (!acc[group]) acc[group] = [];
			acc[group].push(task);
			return acc;
		},
		{} as Record<string, typeof tasks>,
	);

	let rowIndex = 0;

	return (
		<div className="absolute inset-0">
			{/* Vertical grid lines */}
			<div className="absolute inset-0">
				{dates.map((date) => {
					if (!showWeekends && isWeekend(date)) return null;

					const isWeekendDay = isWeekend(date);
					const isTodayDate = isToday(date);

					return (
						<div
							key={date.toISOString()}
							className={cn(
								"absolute top-0 h-full border-r",
								isWeekendDay && "bg-muted/20",
								isTodayDate && "bg-primary/5",
							)}
							style={{
								left: dates.indexOf(date) * cellWidth,
								width: cellWidth,
							}}
						/>
					);
				})}
			</div>

			{/* Horizontal grid lines */}
			<div className="absolute inset-0">
				{Object.entries(groupedTasks).map(([group, groupTasks]) => {
					const rows = [];

					// Group header row
					if (group !== "Ungrouped") {
						rows.push(
							<div
								key={`${group}-header`}
								className="absolute left-0 w-full border-b bg-muted/10"
								style={{
									top: rowIndex * rowHeight,
									height: rowHeight,
								}}
							/>,
						);
						rowIndex++;
					}

					// Task rows
					groupTasks.forEach((task) => {
						rows.push(
							<div
								key={task.id}
								className="absolute left-0 w-full border-b"
								style={{
									top: rowIndex * rowHeight,
									height: rowHeight,
								}}
							/>,
						);
						rowIndex++;
					});

					return rows;
				})}
			</div>
		</div>
	);
}
