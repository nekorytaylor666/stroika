"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useGantt } from "./gantt-context";

interface GanttSidebarProps {
	headerHeight: number;
}

export function GanttSidebar({ headerHeight }: GanttSidebarProps) {
	const { tasks, rowHeight, selectedTaskId, hoveredTaskId, dispatch } = useGantt();
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

	const toggleGroup = (group: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(group)) {
				next.delete(group);
			} else {
				next.add(group);
			}
			return next;
		});
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div
				className="flex items-center border-b px-4 font-medium text-sm"
				style={{ height: headerHeight }}
			>
				Tasks
			</div>

			{/* Task list */}
			<div className="flex-1 overflow-y-auto">
				{Object.entries(groupedTasks).map(([group, groupTasks], groupIndex) => (
					<div key={group}>
						{/* Group header */}
						{group !== "Ungrouped" && (
							<motion.div
								className="sticky top-0 z-10 flex items-center gap-2 border-b bg-muted/50 px-2 py-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: groupIndex * 0.05 }}
							>
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5"
									onClick={() => toggleGroup(group)}
								>
									{collapsedGroups.has(group) ? (
										<ChevronRight className="h-3 w-3" />
									) : (
										<ChevronDown className="h-3 w-3" />
									)}
								</Button>
								<span className="font-medium text-xs text-muted-foreground">
									{group}
								</span>
								<span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
									{groupTasks.length}
								</span>
							</motion.div>
						)}

						{/* Tasks in group */}
						{!collapsedGroups.has(group) &&
							groupTasks.map((task, index) => (
								<motion.div
									key={task.id}
									className={cn(
										"flex items-center gap-3 border-b px-4 transition-colors hover:bg-muted/30",
										selectedTaskId === task.id && "bg-muted/50",
										hoveredTaskId === task.id && "bg-muted/30",
									)}
									style={{ height: rowHeight }}
									onClick={() => dispatch({ type: "SELECT_TASK", taskId: task.id })}
									onMouseEnter={() =>
										dispatch({ type: "HOVER_TASK", taskId: task.id })
									}
									onMouseLeave={() => dispatch({ type: "HOVER_TASK", taskId: null })}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: (groupIndex + index) * 0.02 }}
								>
									{task.assignee && (
										<Avatar className="h-6 w-6">
											<AvatarImage src={task.assignee.avatar} />
											<AvatarFallback className="text-[10px]">
												{task.assignee.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
									)}
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">{task.name}</p>
										{task.assignee && (
											<p className="truncate text-muted-foreground text-xs">
												{task.assignee.name}
											</p>
										)}
									</div>
									{task.progress !== undefined && (
										<span className="text-muted-foreground text-xs">
											{Math.round(task.progress * 100)}%
										</span>
									)}
								</motion.div>
							))}
					</div>
				))}
			</div>
		</div>
	);
}