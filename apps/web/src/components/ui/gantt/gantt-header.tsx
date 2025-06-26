"use client";

import { cn } from "@/lib/utils";
import { format, getDay, isToday, isWeekend, startOfMonth } from "date-fns";
import { motion } from "motion/react";
import { useGantt } from "./gantt-context";

export function GanttHeader() {
	const { getDatesInRange, viewMode, showWeekends, cellWidth, locale } =
		useGantt();
	const dates = getDatesInRange();

	const getMonthGroups = () => {
		const groups: { month: Date; days: Date[] }[] = [];
		let currentGroup: { month: Date; days: Date[] } | null = null;

		dates.forEach((date) => {
			const monthStart = startOfMonth(date);
			if (
				!currentGroup ||
				currentGroup.month.getTime() !== monthStart.getTime()
			) {
				currentGroup = { month: monthStart, days: [] };
				groups.push(currentGroup);
			}
			if (showWeekends || !isWeekend(date)) {
				currentGroup.days.push(date);
			}
		});

		return groups;
	};

	const monthGroups = getMonthGroups();

	return (
		<div className="relative h-full">
			{/* Month row */}
			{viewMode !== "year" && (
				<div className="flex h-1/2 border-b">
					{monthGroups.map((group, index) => (
						<motion.div
							key={group.month.toISOString()}
							className="flex items-center border-r px-3 font-medium text-sm"
							style={{ width: group.days.length * cellWidth }}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.02 }}
						>
							{format(group.month, "LLLL yyyy", { locale })}
						</motion.div>
					))}
				</div>
			)}

			{/* Day row */}
			<div className={cn("flex", viewMode === "year" ? "h-full" : "h-1/2")}>
				{dates.map((date, index) => {
					if (!showWeekends && isWeekend(date)) return null;

					const dayOfWeek = getDay(date);
					const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

					return (
						<motion.div
							key={date.toISOString()}
							className={cn(
								"flex flex-col items-center justify-center border-r px-1",
								isWeekendDay && "bg-muted/30",
								isToday(date) && "bg-primary/5",
							)}
							style={{ width: cellWidth, minWidth: cellWidth }}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: index * 0.001 }}
						>
							{viewMode === "day" && (
								<>
									<span
										className={cn(
											"font-medium text-[10px] text-muted-foreground uppercase",
											isToday(date) && "text-primary",
										)}
									>
										{format(date, "EEE", { locale })}
									</span>
									<span
										className={cn(
											"font-medium text-sm",
											isToday(date) && "text-primary",
										)}
									>
										{format(date, "d", { locale })}
									</span>
								</>
							)}
							{viewMode === "week" && (
								<span
									className={cn(
										"font-medium text-xs",
										isToday(date) && "text-primary",
									)}
								>
									{format(date, "d", { locale })}
								</span>
							)}
							{viewMode === "month" && (
								<span className="text-muted-foreground text-xs">
									{format(date, "d", { locale })}
								</span>
							)}
							{viewMode === "quarter" && date.getDate() === 1 && (
								<span className="text-muted-foreground text-xs">
									{format(date, "MMM", { locale })}
								</span>
							)}
							{viewMode === "year" && date.getDate() === 1 && (
								<span className="font-medium text-xs">
									{format(date, "MMM", { locale })}
								</span>
							)}
						</motion.div>
					);
				})}
			</div>

			{/* Today marker */}
			{dates.some((d) => isToday(d)) && (
				<motion.div
					className="absolute top-0 h-full w-0.5 bg-primary"
					style={{
						left:
							dates.findIndex((d) => isToday(d)) * cellWidth +
							cellWidth / 2 -
							1,
					}}
					initial={{ opacity: 0, scaleY: 0 }}
					animate={{ opacity: 1, scaleY: 1 }}
					transition={{ delay: 0.3 }}
				/>
			)}
		</div>
	);
}
