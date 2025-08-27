"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { useViewStore } from "@/store/view-store";
import { type Id, api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Circle,
	Clock,
	Hash,
	Plus,
	User,
	XCircle,
} from "lucide-react";
import { type FC, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
	KanbanBoard,
	KanbanCard,
	KanbanCards,
	type DragEndEvent as KanbanDragEndEvent,
	KanbanHeader,
	KanbanProvider,
} from "../../ui/kibo-ui/kanban";
import {
	type DragEndEvent as ListDragEndEvent,
	ListGroup,
	ListItem,
	ListItems,
	ListProvider,
} from "../../ui/kibo-ui/list";
import { ConstructionCreateIssueModal } from "./construction-create-issue-modal";
import { ConstructionIssueLine } from "./construction-issue-line";
import { ConstructionKanbanCard } from "./construction-kanban-card";
import { ConstructionTaskDetails } from "./construction-task-details";
import { MobileTaskListWrapper } from "./mobile/mobile-task-list-wrapper";

// Types for construction tasks
export interface ConstructionTask {
	_id: string;
	identifier: string;
	title: string;
	description: string;
	statusId: string;
	assigneeId?: string;
	priorityId: string;
	labelIds: string[];
	createdAt: string;
	cycleId: string;
	projectId?: string;
	constructionProjectId?: string;
	rank: string;
	dueDate?: string;
	isConstructionTask: boolean;
	parentTaskId?: string;
	subtaskCount?: number;
	attachments?: Array<{
		_id: string;
		issueId: string;
		fileName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
		uploadedBy: string;
		uploadedAt: number;
		uploader?: {
			_id: string;
			name: string;
			email: string;
			avatarUrl: string;
		} | null;
	}>;
}

export interface StatusType {
	_id: string;
	name: string;
	color: string;
	iconName: string;
}

interface ConstructionTasksProps {
	tasks: ConstructionTask[];
	statuses: StatusType[];
	projectId?: string;
	onTaskStatusChange?: (taskId: string, newStatusId: string) => Promise<void>;
}

export default function ConstructionTasks({
	tasks,
	statuses,
	projectId,
	onTaskStatusChange,
}: ConstructionTasksProps) {
	const { viewType } = useViewStore();
	const { isOpen, selectedTask, closeTaskDetails, openTaskDetails } =
		useConstructionTaskDetailsStore();
	const { openModal } = useCreateIssueStore();
	const isMobile = useMobile();
	const params = useParams({ from: "/construction/$orgId" });
	const currentUser = useCurrentUser();
	const updateTaskStatus = useMutation(api.constructionTasks.updateStatus);

	const isViewTypeGrid = viewType === "grid";

	// Group tasks by status
	const tasksByStatus = useMemo(() => {
		const result: Record<string, ConstructionTask[]> = {};
		for (const status of statuses) {
			result[status._id] = tasks.filter((task) => task.statusId === status._id);
		}
		return result;
	}, [tasks, statuses]);

	// Transform tasks for kanban
	const kanbanData = useMemo(() => {
		return tasks.map((task) => ({
			id: task._id,
			name: task.title,
			column: task.statusId,
			task,
		}));
	}, [tasks]);

	// Transform statuses for kanban columns
	const kanbanColumns = useMemo(() => {
		return statuses.map((status) => ({
			id: status._id,
			name: status.name,
			color: status.color,
			iconName: status.iconName,
		}));
	}, [statuses]);

	// Handle task status change
	const handleTaskStatusChange = async (
		taskId: string,
		newStatusId: string,
	) => {
		if (onTaskStatusChange) {
			await onTaskStatusChange(taskId, newStatusId);
		} else if (currentUser) {
			try {
				await updateTaskStatus({
					id: taskId as Id<"issues">,
					statusId: newStatusId as Id<"status">,
					userId: currentUser._id as Id<"users">,
				});
			} catch (error) {
				console.error("Failed to update task status:", error);
			}
		}
	};

	// Handle drag end for list view
	const handleListDragEnd = async (event: ListDragEndEvent) => {
		const { active, over } = event;
		if (!over || !currentUser) return;

		const draggedTaskId = active.id as string;
		const newStatusId = over.id as string;

		const draggedTask = tasks.find((task) => task._id === draggedTaskId);
		if (!draggedTask || draggedTask.statusId === newStatusId) return;

		await handleTaskStatusChange(draggedTaskId, newStatusId);
	};

	// Handle drag end for kanban view
	const handleKanbanDragEnd = async (event: KanbanDragEndEvent) => {
		const { active, over } = event;
		if (!over || !currentUser) return;

		const draggedTaskId = active.id as string;
		const draggedTask = tasks.find((task) => task._id === draggedTaskId);
		if (!draggedTask) return;

		// Check if dropped on a column header or card
		let newStatusId: string;
		const overTask = tasks.find((task) => task._id === over.id);
		if (overTask) {
			newStatusId = overTask.statusId;
		} else {
			// Dropped on column header
			newStatusId = over.id as string;
		}

		if (draggedTask.statusId !== newStatusId) {
			await handleTaskStatusChange(draggedTaskId, newStatusId);
		}
	};

	// Mobile view
	if (isMobile) {
		return (
			<>
				<ConstructionCreateIssueModal />
				<MobileTaskListWrapper projectId={projectId} />
				<ConstructionTaskDetails
					task={selectedTask}
					open={isOpen}
					onOpenChange={closeTaskDetails}
					orgId={params.orgId}
				/>
			</>
		);
	}

	// Desktop Kanban view
	if (isViewTypeGrid) {
		return (
			<>
				<ConstructionCreateIssueModal />
				<div className="h-full w-full overflow-x-auto p-4">
					<KanbanProvider
						columns={kanbanColumns}
						data={kanbanData}
						onDragEnd={handleKanbanDragEnd}
						className="h-full"
					>
						{(column) => (
							<KanbanBoard key={column.id} id={column.id}>
								<KanbanHeader
									className="flex items-center justify-between px-3"
									style={{ backgroundColor: `${column.color}10` }}
								>
									<div className="flex items-center gap-2">
										<div
											className="h-3.5 w-3.5 rounded-full"
											style={{ backgroundColor: column.color }}
										/>
										<span>{column.name}</span>
										<span className="text-muted-foreground">
											{tasksByStatus[column.id]?.length || 0}
										</span>
									</div>
									<Button
										className="h-6 w-6"
										size="icon"
										variant="ghost"
										onClick={(e) => {
											e.stopPropagation();
											openModal({
												status: {
													id: column.id as Id<"status">,
													name: column.name,
													color: column.color,
													icon: () => null,
												} as any,
												projectId: projectId as Id<"constructionProjects">,
											});
										}}
									>
										<Plus className="h-4 w-4" />
									</Button>
								</KanbanHeader>
								<KanbanCards id={column.id}>
									{(item) => (
										<KanbanCard
											key={item.id}
											id={item.id}
											name={item.name}
											column={item.column}
											className="p-0 transition-shadow hover:shadow-md"
										>
											<div
												onClick={() => openTaskDetails(item.task)}
												className="cursor-pointer p-3"
											>
												<ConstructionKanbanCard task={item.task} />
											</div>
										</KanbanCard>
									)}
								</KanbanCards>
							</KanbanBoard>
						)}
					</KanbanProvider>
				</div>
				<ConstructionTaskDetails
					task={selectedTask}
					open={isOpen}
					onOpenChange={closeTaskDetails}
					orgId={params.orgId}
				/>
			</>
		);
	}

	// Desktop List view
	return (
		<>
			<ConstructionCreateIssueModal />
			<div className="h-full w-full overflow-y-auto">
				<ListProvider onDragEnd={handleListDragEnd} className="w-full">
					{statuses.map((status) => {
						const statusTasks = tasksByStatus[status._id] || [];
						if (statusTasks.length === 0) return null;

						return (
							<ListGroup
								key={status._id}
								id={status._id}
								className="mb-4 w-full bg-container"
							>
								<div
									className="sticky top-0 z-10 h-10 w-full bg-container"
									style={{ backgroundColor: `${status.color}08` }}
								>
									<div className="flex h-full items-center justify-between px-6">
										<div className="flex items-center gap-2">
											<div
												className="h-3.5 w-3.5 rounded-full"
												style={{ backgroundColor: status.color }}
											/>
											<span className="font-medium text-sm">{status.name}</span>
											<span className="text-muted-foreground text-sm">
												{statusTasks.length}
											</span>
										</div>
										<Button
											className="h-6 w-6"
											size="icon"
											variant="ghost"
											onClick={(e) => {
												e.stopPropagation();
												openModal({
													status: {
														id: status._id as Id<"status">,
														name: status.name,
														color: status.color,
														icon: () => null,
													} as any,
													projectId: projectId as Id<"constructionProjects">,
												});
											}}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<ListItems className="space-y-1 px-6 py-2">
									{statusTasks.map((task, index) => (
										<ListItem
											key={task._id}
											id={task._id}
											name={task.title}
											index={index}
											parent={status._id}
											className="cursor-pointer p-0 transition-colors hover:bg-accent/50"
										>
											<div onClick={() => openTaskDetails(task)}>
												<ConstructionIssueLine issue={task} layoutId={true} />
											</div>
										</ListItem>
									))}
								</ListItems>
							</ListGroup>
						);
					})}
				</ListProvider>
			</div>
			<ConstructionTaskDetails
				task={selectedTask}
				open={isOpen}
				onOpenChange={closeTaskDetails}
				orgId={params.orgId}
			/>
		</>
	);
}

// Wrapper component that fetches data and passes it as props
export function ConstructionTasksContainer({
	projectId,
}: {
	projectId?: string;
}) {
	const tasks = projectId
		? useQuery(api.constructionTasks.getByProject, {
				projectId: projectId as Id<"constructionProjects">,
			})
		: useQuery(api.constructionTasks.getAll);

	const statuses = useQuery(api.metadata.getAllStatus);

	if (!tasks || !statuses) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<ConstructionTasks
			tasks={tasks}
			statuses={statuses}
			projectId={projectId}
		/>
	);
}
