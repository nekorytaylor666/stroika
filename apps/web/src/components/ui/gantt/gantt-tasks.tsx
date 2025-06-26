"use client";

import { motion } from "motion/react";
import { useGantt } from "./gantt-context";
import { GanttTask } from "./gantt-task";

export function GanttTasks() {
	const { tasks, rowHeight } = useGantt();

	// Group tasks by their group property and calculate row positions
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
	const taskPositions: Record<string, number> = {};

	Object.entries(groupedTasks).forEach(([group, groupTasks]) => {
		// Skip row for group header if not "Ungrouped"
		if (group !== "Ungrouped") {
			rowIndex++;
		}

		groupTasks.forEach((task) => {
			taskPositions[task.id] = rowIndex;
			rowIndex++;
		});
	});

	return (
		<div className="relative">
			{tasks.map((task, index) => (
				<motion.div
					key={task.id}
					className="absolute"
					style={{
						top: taskPositions[task.id] * rowHeight,
						height: rowHeight,
					}}
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: index * 0.02 }}
				>
					<GanttTask task={task} />
				</motion.div>
			))}
		</div>
	);
}