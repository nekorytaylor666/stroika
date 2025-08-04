"use client";

import { Button } from "@/components/ui/button";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { type Id, api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Circle,
	Clock,
	ListTree,
	MoreHorizontal,
	Plus,
	XCircle,
} from "lucide-react";
import { type FC, useCallback, useMemo, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionLabelBadge } from "./construction-label-badge";
import { ConstructionProjectBadge } from "./construction-project-badge";
import type { ConstructionTask, StatusType } from "./construction-tasks";

const ISSUE_DRAG_TYPE = "construction-issue";

// Status icon mapping
const StatusIconMap = {
	circle: Circle,
	timer: Clock,
	"alert-circle": AlertCircle,
	"check-circle": CheckCircle,
	"x-circle": XCircle,
};

const StatusIcon: FC<{
	iconName: string;
	color: string;
	className?: string;
}> = ({ iconName, color, className = "h-3.5 w-3.5" }) => {
	const IconComponent =
		StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
	return <IconComponent style={{ color }} className={className} />;
};

// Task card component optimized for performance
const TaskCard: FC<{ task: ConstructionTask }> = ({ task }) => {
	const { users, labels, priorities, projects, isLoading } =
		useConstructionData();
	const { openTaskDetails } = useConstructionTaskDetailsStore();
	const ref = useRef<HTMLDivElement>(null);

	// Find related entities with null checks
	const assignee =
		task.assigneeId && users
			? users.find((u) => u._id === task.assigneeId) || null
			: null;
	const taskLabels =
		task.labelIds && labels
			? task.labelIds
					.map((id) => labels.find((l) => l._id === id))
					.filter(Boolean)
			: [];
	const priority =
		task.priorityId && priorities
			? priorities.find((p) => p._id === task.priorityId) || null
			: null;
	const project =
		task.projectId && projects
			? projects.find((p) => p._id === task.projectId) || null
			: null;

	// Set up drag functionality
	const [{ isDragging }, drag] = useDrag(
		() => ({
			type: ISSUE_DRAG_TYPE,
			item: task,
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
		}),
		[task],
	);

	drag(ref);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			if (target.closest("button") || target.closest('[role="combobox"]')) {
				return;
			}
			openTaskDetails(task);
		},
		[task, openTaskDetails],
	);

	// Calculate days until deadline
	const daysUntilDeadline = task.dueDate
		? differenceInDays(new Date(task.dueDate), new Date())
		: null;
	const isNearDeadline = daysUntilDeadline !== null && daysUntilDeadline <= 1;

	if (isLoading) {
		return (
			<div className="w-full rounded-lg border border-border/50 bg-card p-3">
				<div className="mb-2 flex items-center justify-between">
					<div className="h-3 w-16 animate-pulse rounded bg-muted"></div>
					<div className="h-3 w-3 animate-pulse rounded-full bg-muted"></div>
				</div>
				<div className="mb-3 h-10 animate-pulse rounded bg-muted"></div>
				<div className="mb-3 flex gap-2">
					<div className="h-5 w-12 animate-pulse rounded bg-muted"></div>
					<div className="h-5 w-16 animate-pulse rounded bg-muted"></div>
				</div>
				<div className="flex items-center justify-between">
					<div className="h-3 w-12 animate-pulse rounded bg-muted"></div>
					<div className="h-6 w-6 animate-pulse rounded-full bg-muted"></div>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={ref}
			className={cn(
				"group w-full cursor-pointer rounded-lg border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-sm",
				isDragging && "opacity-50 shadow-lg",
			)}
			onClick={handleClick}
		>
			{/* Header with priority and identifier */}
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					{priority && (
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: priority.color }}
							title={priority.name}
						/>
					)}
					<span className="font-mono text-muted-foreground text-xs">
						{task.identifier}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-auto w-auto p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<MoreHorizontal className="h-3 w-3" />
				</Button>
			</div>

			{/* Title */}
			<h3 className="mb-3 line-clamp-2 font-medium text-sm leading-tight">
				{task.title}
			</h3>

			{/* Labels and project */}
			{(taskLabels.length > 0 || project) && (
				<div className="mb-3 flex flex-wrap gap-1.5">
					{taskLabels.length > 0 && (
						<ConstructionLabelBadge labels={taskLabels as any} />
					)}
					{project && <ConstructionProjectBadge project={project} />}
				</div>
			)}

			{/* Footer with metadata and assignee */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					{task.dueDate && (
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span
								className={cn(isNearDeadline && "font-medium text-red-600")}
							>
								{format(new Date(task.dueDate), "MMM d", { locale: ru })}
							</span>
						</div>
					)}
					{task.subtaskCount !== undefined && task.subtaskCount > 0 && (
						<div className="flex items-center gap-1">
							<ListTree className="h-3 w-3" />
							<span>{task.subtaskCount}</span>
						</div>
					)}
				</div>
				<ConstructionAssigneeUser user={assignee || null} />
			</div>
		</div>
	);
};

// Kanban column component
const KanbanColumn: FC<{
	status: StatusType;
	tasks: ConstructionTask[];
	onCreateTask: (statusId: string) => void;
}> = ({ status, tasks, onCreateTask }) => {
	const { updateTaskStatus } = useConstructionData();
	const currentUser = useCurrentUser();
	const ref = useRef<HTMLDivElement>(null);

	// Sort tasks by priority and creation date
	const sortedTasks = useMemo(() => {
		return [...tasks].sort((a, b) => {
			// First sort by rank if available
			if (a.rank && b.rank) {
				return a.rank.localeCompare(b.rank);
			}
			// Then by creation date (newest first)
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [tasks]);

	// Set up drop functionality
	const [{ isOver }, drop] = useDrop(
		() => ({
			accept: ISSUE_DRAG_TYPE,
			drop: async (item: ConstructionTask) => {
				if (item.statusId !== status._id && currentUser) {
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
		}),
		[status._id, updateTaskStatus, currentUser],
	);

	drop(ref);

	return (
		<div className="flex h-full w-80 flex-shrink-0 flex-col">
			{/* Column header */}
			<div
				className="flex items-center justify-between rounded-t-lg border-border/50 border-b bg-muted/30 px-4 py-3"
				style={{
					backgroundColor: `${status.color}08`,
					borderColor: `${status.color}20`,
				}}
			>
				<div className="flex items-center gap-2">
					<StatusIcon iconName={status.iconName} color={status.color} />
					<h3 className="font-medium text-sm">{status.name}</h3>
					<span className="rounded-full bg-background px-2 py-0.5 font-medium text-muted-foreground text-xs">
						{tasks.length}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={() => onCreateTask(status._id)}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			{/* Column content */}
			<div
				ref={ref}
				className={cn(
					"flex-1 space-y-2 overflow-y-auto p-3",
					isOver && "bg-primary/5 ring-1 ring-primary/20",
				)}
				style={{ minHeight: "200px" }}
			>
				{sortedTasks.map((task) => (
					<TaskCard key={task._id} task={task} />
				))}

				{/* Empty state */}
				{tasks.length === 0 && (
					<div className="flex h-32 items-center justify-center text-muted-foreground">
						<div className="text-center">
							<StatusIcon
								iconName={status.iconName}
								color={status.color}
								className="mx-auto mb-2 h-6 w-6 opacity-40"
							/>
							<p className="text-xs">No tasks</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// Main Linear-style Kanban Board component
export const LinearKanbanBoard: FC<{
	tasks: ConstructionTask[];
	statuses: StatusType[];
}> = ({ tasks, statuses }) => {
	const { openModal } = useCreateIssueStore();
	const params = useParams({ strict: false });
	const projectId = (params as any).projectId;

	// Group tasks by status
	const tasksByStatus = useMemo(() => {
		const result: Record<string, ConstructionTask[]> = {};
		for (const status of statuses) {
			result[status._id] = tasks.filter((task) => task.statusId === status._id);
		}
		return result;
	}, [tasks, statuses]);

	const handleCreateTask = useCallback(
		(statusId: string) => {
			const status = statuses.find((s) => s._id === statusId);
			if (status) {
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
			}
		},
		[statuses, openModal, projectId],
	);

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="flex h-full gap-4 overflow-x-auto p-4">
				{statuses.map((status) => (
					<KanbanColumn
						key={status._id}
						status={status}
						tasks={tasksByStatus[status._id] || []}
						onCreateTask={handleCreateTask}
					/>
				))}
			</div>
		</DndProvider>
	);
};
