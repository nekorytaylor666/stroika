"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";
import { GanttProvider, type GanttProviderProps } from "./gantt-context";
import { GanttGrid } from "./gantt-grid";
import { GanttHeader } from "./gantt-header";
import { GanttSidebar } from "./gantt-sidebar";
import { GanttTasks } from "./gantt-tasks";

interface GanttProps extends GanttProviderProps {
	className?: string;
	sidebarWidth?: number;
	headerHeight?: number;
}

export function Gantt({
	className,
	children,
	sidebarWidth = 300,
	headerHeight = 80,
	...providerProps
}: GanttProps) {
	return (
		<GanttProvider {...providerProps}>
			<div
				className={cn(
					"relative flex h-full w-full overflow-hidden rounded-lg border bg-background",
					className,
				)}
			>
				{/* Sidebar */}
				<div
					className="relative z-20 flex-shrink-0 border-r bg-background"
					style={{ width: sidebarWidth }}
				>
					<GanttSidebar headerHeight={headerHeight} />
				</div>

				{/* Chart area */}
				<div className="relative flex-1 overflow-hidden">
					{/* Timeline header */}
					<div
						className="relative z-10 border-b bg-background"
						style={{ height: headerHeight }}
					>
						<GanttHeader />
					</div>

					{/* Chart content */}
					<div className="relative overflow-auto">
						<GanttGrid headerHeight={headerHeight} />
						<GanttTasks />
					</div>
				</div>

				{children}
			</div>
		</GanttProvider>
	);
}

// Export sub-components for composability
export { GanttProvider } from "./gantt-context";
export { GanttGrid } from "./gantt-grid";
export { GanttHeader } from "./gantt-header";
export { GanttSidebar } from "./gantt-sidebar";
export { GanttTask } from "./gantt-task";
export { GanttTasks } from "./gantt-tasks";
