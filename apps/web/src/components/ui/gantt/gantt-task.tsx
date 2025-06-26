"use client";

import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { motion, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { GanttTask as GanttTaskType } from "./gantt-context";
import { useGantt } from "./gantt-context";

interface GanttTaskProps {
	task: GanttTaskType;
}

export function GanttTask({ task }: GanttTaskProps) {
	const {
		getTaskPosition,
		getPositionDate,
		selectedTaskId,
		hoveredTaskId,
		dispatch,
		rowHeight,
		locale,
	} = useGantt();

	const dragControls = useDragControls();
	const constraintsRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	const position = getTaskPosition(task);
	const isSelected = selectedTaskId === task.id;
	const isHovered = hoveredTaskId === task.id;
	const duration = differenceInDays(task.end, task.start) + 1;

	// Default color based on task progress
	const getDefaultColor = () => {
		if (!task.progress) return "hsl(var(--primary))";
		if (task.progress >= 1) return "hsl(142, 76%, 36%)"; // Green
		if (task.progress >= 0.5) return "hsl(45, 93%, 47%)"; // Yellow
		return "hsl(var(--primary))";
	};

	const barColor = task.color || getDefaultColor();

	const handleDragStart = () => {
		setIsDragging(true);
		dispatch({ type: "START_DRAG", taskId: task.id });
	};

	const handleDragEnd = (event: any, info: any) => {
		setIsDragging(false);
		dispatch({ type: "END_DRAG" });

		// Calculate new dates based on drag position
		const newStartDate = getPositionDate(position.x + info.offset.x);
		const daysDiff = differenceInDays(task.end, task.start);
		const newEndDate = new Date(newStartDate);
		newEndDate.setDate(newEndDate.getDate() + daysDiff);

		dispatch({
			type: "UPDATE_TASK",
			taskId: task.id,
			updates: {
				start: newStartDate,
				end: newEndDate,
			},
		});
	};

	// Set constraints ref
	useEffect(() => {
		if (constraintsRef.current) {
			const parent = constraintsRef.current.parentElement;
			if (parent) {
				constraintsRef.current.style.width = `${parent.scrollWidth}px`;
				constraintsRef.current.style.height = `${parent.scrollHeight}px`;
			}
		}
	}, []);

	return (
		<>
			{/* Invisible constraints area */}
			<div ref={constraintsRef} className="pointer-events-none absolute inset-0" />

			{/* Task bar */}
			<motion.div
				className={cn(
					"absolute flex items-center px-3",
					"cursor-move select-none",
					"transition-shadow",
					isSelected && "ring-2 ring-primary ring-offset-1",
					isDragging && "z-50 opacity-80",
				)}
				style={{
					left: position.x,
					width: position.width,
					height: rowHeight - 16,
					top: 8,
					backgroundColor: barColor,
					borderRadius: 6,
				}}
				drag="x"
				dragControls={dragControls}
				dragConstraints={constraintsRef}
				dragElastic={0}
				dragMomentum={false}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onClick={() => dispatch({ type: "SELECT_TASK", taskId: task.id })}
				onMouseEnter={() => dispatch({ type: "HOVER_TASK", taskId: task.id })}
				onMouseLeave={() => dispatch({ type: "HOVER_TASK", taskId: null })}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				{/* Progress bar */}
				{task.progress !== undefined && task.progress > 0 && (
					<motion.div
						className="absolute inset-0 rounded-md bg-black/10"
						style={{
							width: `${task.progress * 100}%`,
						}}
						initial={{ width: 0 }}
						animate={{ width: `${task.progress * 100}%` }}
						transition={{ duration: 0.3 }}
					/>
				)}

				{/* Task content */}
				<div className="relative z-10 flex w-full items-center justify-between">
					<span className="truncate font-medium text-white text-xs">
						{task.name}
					</span>
					{position.width > 60 && (
						<span className="ml-2 whitespace-nowrap text-white/80 text-xs">
							{duration}d
						</span>
					)}
				</div>

				{/* Resize handles */}
				{!isDragging && (
					<>
						<motion.div
							className="absolute -left-1 top-1/2 h-4 w-2 -translate-y-1/2 cursor-ew-resize rounded-sm bg-white/30 opacity-0 transition-opacity hover:bg-white/50"
							whileHover={{ opacity: 1 }}
							onPointerDown={(e) => {
								e.stopPropagation();
								// TODO: Implement resize start
							}}
						/>
						<motion.div
							className="absolute -right-1 top-1/2 h-4 w-2 -translate-y-1/2 cursor-ew-resize rounded-sm bg-white/30 opacity-0 transition-opacity hover:bg-white/50"
							whileHover={{ opacity: 1 }}
							onPointerDown={(e) => {
								e.stopPropagation();
								// TODO: Implement resize end
							}}
						/>
					</>
				)}
			</motion.div>

			{/* Tooltip */}
			{(isHovered || isDragging) && (
				<motion.div
					className="pointer-events-none absolute z-50 rounded-lg border bg-popover p-3 shadow-lg"
					style={{
						left: position.x + position.width / 2,
						top: rowHeight + 8,
					}}
					initial={{ opacity: 0, y: -10, x: "-50%" }}
					animate={{ opacity: 1, y: 0, x: "-50%" }}
					exit={{ opacity: 0, y: -10, x: "-50%" }}
				>
					<div className="space-y-1 text-xs">
						<p className="font-medium">{task.name}</p>
						<p className="text-muted-foreground">
							{format(task.start, "d MMM", { locale })} -{" "}
							{format(task.end, "d MMM yyyy", { locale })}
						</p>
						{task.assignee && (
							<p className="text-muted-foreground">
								Assignee: {task.assignee.name}
							</p>
						)}
						{task.progress !== undefined && (
							<p className="text-muted-foreground">
								Progress: {Math.round(task.progress * 100)}%
							</p>
						)}
					</div>
				</motion.div>
			)}
		</>
	);
}