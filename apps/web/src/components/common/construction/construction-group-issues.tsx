"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { useViewStore } from "@/store/view-store";
import { api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	AlertCircle,
	CheckCircle,
	Circle,
	Clock,
	Plus,
	XCircle,
} from "lucide-react";
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

	// Get projectId from route params if we're in a project view
	const params = useParams({ strict: false });
	const projectId = (params as any)?.projectId as
		| Id<"constructionProjects">
		| undefined;

	return (
		<div
			className={cn(
				"bg-container",
				isViewTypeGrid
					? "flex h-full w-[348px] flex-shrink-0 flex-col overflow-hidden rounded-md"
					: "mb-4 w-full",
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
								id: status._id as Id<"status">,
								name: status.name,
								color: status.color,
								icon: () => (
									<StatusIcon iconName={status.iconName} color={status.color} />
								),
							};
							openModal({
								status: statusForModal as any,
								projectId: projectId,
							});
						}}
					>
						<Plus className="size-4" />
					</Button>
				</div>
			</div>

			{viewType === "list" ? (
				<div className="space-y-1 px-6 py-2">
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
	const currentUser = useCurrentUser();

	// Set up drop functionality to accept only issue items.
	const [{ isOver }, drop] = useDrop(() => ({
		accept: IssueDragType,
		drop: async (item: ConstructionTask, monitor) => {
			// Don't process if already dropped or same status
			if (!monitor.didDrop() && item.statusId !== status._id && currentUser) {
				try {
					await updateTaskStatus({
						id: item._id as Id<"issues">,
						statusId: status._id as Id<"status">,
						userId: currentUser._id as Id<"users">,
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
			className={cn(
				"relative h-full flex-1 space-y-2 overflow-y-auto bg-zinc-50/50 p-2 dark:bg-zinc-900/50",
				sortedIssues.length === 0 && "min-h-[200px]",
				isOver && "ring-2 ring-primary/50 ring-offset-2",
			)}
		>
			{sortedIssues.map((issue) => (
				<ConstructionIssueGrid key={issue._id} issue={issue} />
			))}
		</div>
	);
};
