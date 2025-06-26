"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { useViewStore } from "@/store/view-store";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	AlertCircle,
	CheckCircle,
	Circle,
	Clock,
	Plus,
	XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type FC, useRef } from "react";
import { useDrop } from "react-dnd";
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";
import { Button } from "../../ui/button";
import { IssueDragType } from "../issues/issue-grid";
import { ConstructionIssueGrid } from "./construction-issue-grid";
import { ConstructionIssueLine } from "./construction-issue-line";
import type { ConstructionTask, StatusType } from "./construction-tasks";

// Sort construction tasks by priority
function sortConstructionTasksByPriority(
	tasks: ConstructionTask[],
	priorities: Array<{ _id: string; level: number }> | undefined,
): ConstructionTask[] {
	if (!priorities || priorities.length === 0) {
		return tasks;
	}

	// Create a map of priority IDs to their level (lower level = higher priority)
	const priorityLevelMap: Record<string, number> = {};
	for (const priority of priorities) {
		priorityLevelMap[priority._id] = priority.level;
	}

	return tasks.slice().sort((a, b) => {
		const aLevel = priorityLevelMap[a.priorityId] ?? 999;
		const bLevel = priorityLevelMap[b.priorityId] ?? 999;
		return aLevel - bLevel;
	});
}

interface ConstructionGroupIssuesProps {
	status: StatusType;
	issues: ConstructionTask[];
	count: number;
}

// Status icon mapping based on iconName from database
const StatusIconMap = {
	circle: Circle,
	timer: Clock,
	"alert-circle": AlertCircle,
	"check-circle": CheckCircle,
	"x-circle": XCircle,
};

// Status icon component that uses database iconName
const StatusIcon: FC<{ iconName: string; color: string }> = ({
	iconName,
	color,
}) => {
	const IconComponent =
		StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
	return <IconComponent style={{ color }} className="h-3.5 w-3.5" />;
};

export function ConstructionGroupIssues({
	status,
	issues,
	count,
}: ConstructionGroupIssuesProps) {
	const { viewType } = useViewStore();
	const isViewTypeGrid = viewType === "grid";
	const { openModal } = useCreateIssueStore();
	const priorities = useQuery(api.metadata.getAllPriorities);
	const sortedIssues = sortConstructionTasksByPriority(issues, priorities);

	return (
		<div
			className={cn(
				"bg-conainer",
				isViewTypeGrid
					? "flex h-full w-[348px] flex-shrink-0 flex-col overflow-hidden rounded-md"
					: "",
			)}
		>
			<div
				className={cn(
					"sticky top-0 z-10 w-full bg-container",
					isViewTypeGrid ? "h-[50px] rounded-t-md" : "h-10",
				)}
			>
				<div
					className={cn(
						"flex h-full w-full items-center justify-between",
						isViewTypeGrid ? "px-3" : "px-6",
					)}
					style={{
						backgroundColor: isViewTypeGrid
							? `${status.color}10`
							: `${status.color}08`,
					}}
				>
					<div className="flex items-center gap-2">
						<StatusIcon iconName={status.iconName} color={status.color} />
						<span className="font-medium text-sm">{status.name}</span>
						<span className="text-muted-foreground text-sm">{count}</span>
					</div>

					<Button
						className="size-6"
						size="icon"
						variant="ghost"
						onClick={(e) => {
							e.stopPropagation();
							// Convert StatusType to Status type expected by openModal
							const statusForModal = {
								id: status._id,
								name: status.name,
								color: status.color,
								icon: () => (
									<StatusIcon iconName={status.iconName} color={status.color} />
								),
							};
							openModal({ status: statusForModal as any });
						}}
					>
						<Plus className="size-4" />
					</Button>
				</div>
			</div>

			{viewType === "list" ? (
				<div className="space-y-0">
					{sortedIssues.map((issue) => (
						<ConstructionIssueLine
							key={issue._id}
							issue={issue}
							layoutId={true}
						/>
					))}
				</div>
			) : (
				<ConstructionIssueGridList issues={issues} status={status} />
			)}
		</div>
	);
}

const ConstructionIssueGridList: FC<{
	issues: ConstructionTask[];
	status: StatusType;
}> = ({ issues, status }) => {
	const ref = useRef<HTMLDivElement>(null);
	const { updateTaskStatus, priorities } = useConstructionData();

	// Set up drop functionality to accept only issue items.
	const [{ isOver }, drop] = useDrop(() => ({
		accept: IssueDragType,
		drop: async (item: ConstructionTask, monitor) => {
			if (monitor.didDrop() && item.statusId !== status._id) {
				try {
					await updateTaskStatus({
						id: item._id as Id<"issues">,
						statusId: status._id as Id<"status">,
					});
				} catch (error) {
					console.error("Failed to update task status:", error);
				}
			}
		},
		collect: (monitor) => ({
			isOver: !!monitor.isOver(),
		}),
	}));
	drop(ref);

	const sortedIssues = sortConstructionTasksByPriority(issues, priorities);

	return (
		<div
			ref={ref}
			className="relative h-full flex-1 space-y-2 overflow-y-auto bg-zinc-50/50 p-2 dark:bg-zinc-900/50"
		>
			<AnimatePresence>
				{isOver && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.1 }}
						className="pointer-events-none fixed top-0 right-0 bottom-0 left-0 z-10 flex items-center justify-center bg-background/90"
						style={{
							width: ref.current?.getBoundingClientRect().width || "100%",
							height: ref.current?.getBoundingClientRect().height || "100%",
							transform: `translate(${ref.current?.getBoundingClientRect().left || 0}px, ${ref.current?.getBoundingClientRect().top || 0}px)`,
						}}
					>
						<div className="max-w-[90%] rounded-md border border-border bg-background p-3 shadow-md">
							<p className="text-center font-medium text-sm">
								Задачи отсортированы по приоритету
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			{sortedIssues.map((issue) => (
				<ConstructionIssueGrid key={issue._id} issue={issue} />
			))}
		</div>
	);
};
