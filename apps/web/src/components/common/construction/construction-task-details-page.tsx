"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	ArrowLeft,
	Calendar,
	ChevronRight,
	Clock,
	FileText,
	MoreHorizontal,
	Paperclip,
	Plus,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionPrioritySelector } from "./construction-priority-selector";
import { ConstructionStatusSelector } from "./construction-status-selector";
import { ConstructionSubtasks } from "./construction-subtasks";
import { ConstructionTaskAttachmentsGrid } from "./construction-task-attachments-grid";
import { ConstructionTaskComments } from "./construction-task-comments";
import { ConstructionTaskDetails } from "./construction-task-details";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionTaskDetailsPageProps {
	taskId: string;
	orgId: string;
}

export function ConstructionTaskDetailsPage({
	taskId,
	orgId,
}: ConstructionTaskDetailsPageProps) {
	const navigate = useNavigate();
	const isMobile = useMobile();
	const { users, priorities, statuses, projects } = useConstructionData();
	const currentUser = useCurrentUser();
	const { openTaskDetails } = useConstructionTaskDetailsStore();

	// Fetch task by identifier
	const task = useQuery(
		api.constructionTasks.getByIdentifier,
		{ identifier: taskId }
	);

	const updateTask = useMutation(api.constructionTasks.update);
	const deleteTask = useMutation(api.constructionTasks.deleteTask);
	const updateTaskAssignee = useMutation(api.issues.updateAssignee);
	const updateTaskPriority = useMutation(api.issues.updatePriority);
	const updateTaskStatus = useMutation(api.issues.updateStatus);

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (task) {
			setTitle(task.title);
			setDescription(task.description || "");
		}
	}, [task]);

	// For desktop, open in modal instead
	useEffect(() => {
		if (!isMobile && task) {
			openTaskDetails(task);
			navigate({ to: `/construction/${orgId}/tasks` });
		}
	}, [isMobile, task, openTaskDetails, navigate, orgId]);

	if (!task) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="animate-pulse">
					<div className="h-8 w-32 bg-muted rounded mb-2" />
					<div className="h-4 w-48 bg-muted rounded" />
				</div>
			</div>
		);
	}

	// If on desktop, render the modal component instead
	if (!isMobile) {
		return <ConstructionTaskDetails task={task} open={true} onOpenChange={() => navigate({ to: `/construction/${orgId}/tasks` })} />;
	}

	const assignee = task.assigneeId
		? users?.find((u) => u._id === task.assigneeId)
		: null;
	const priority = priorities?.find((p) => p._id === task.priorityId);
	const status = statuses?.find((s) => s._id === task.statusId);
	const project = task.constructionProjectId
		? projects?.find((p) => p._id === task.constructionProjectId)
		: null;

	const handleTitleSave = async () => {
		if (title !== task.title) {
			try {
				await updateTask({
					id: task._id as Id<"issues">,
					title,
					userId: currentUser?._id as Id<"users">,
				});
			} catch (error) {
				console.error("Error updating title:", error);
			}
		}
		setIsEditingTitle(false);
	};

	const handleDescriptionSave = async () => {
		if (description !== (task.description || "")) {
			try {
				await updateTask({
					id: task._id as Id<"issues">,
					description,
					userId: currentUser?._id as Id<"users">,
				});
			} catch (error) {
				console.error("Error updating description:", error);
			}
		}
		setIsEditingDescription(false);
	};

	const handleBack = () => {
		navigate({ to: `/construction/${orgId}/tasks` });
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="flex flex-col h-full bg-background"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleBack}
						className="h-8 w-8"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div className="flex items-center gap-2">
						{priority && (
							<ConstructionPrioritySelector
								priority={priority}
								issueId={task._id}
							/>
						)}
						<span className="font-mono text-muted-foreground text-sm">
							{task.identifier}
						</span>
					</div>
				</div>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 space-y-6">
					{/* Title */}
					<div>
						{isEditingTitle ? (
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								onBlur={handleTitleSave}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleTitleSave();
									if (e.key === "Escape") {
										setTitle(task.title);
										setIsEditingTitle(false);
									}
								}}
								className="h-auto border-none px-0 font-semibold text-xl"
								autoFocus
							/>
						) : (
							<button
								type="button"
								className="w-full text-left font-semibold text-xl"
								onClick={() => setIsEditingTitle(true)}
							>
								{title}
							</button>
						)}
					</div>

					{/* Status Row */}
					<div className="flex items-center justify-between p-3 -mx-4 hover:bg-muted/50 cursor-pointer">
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground text-sm">Статус</span>
						</div>
						<div className="flex items-center gap-2">
							{status && (
								<ConstructionStatusSelector
									statusId={task.statusId}
									issueId={task._id}
									showLabel={true}
								/>
							)}
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					{/* Assignee Row */}
					<div className="flex items-center justify-between p-3 -mx-4 hover:bg-muted/50 cursor-pointer">
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground text-sm">Исполнитель</span>
						</div>
						<div className="flex items-center gap-2">
							{assignee ? (
								<>
									<ConstructionAssigneeUser user={assignee} />
									<span className="text-sm">{assignee.name}</span>
								</>
							) : (
								<span className="text-muted-foreground text-sm">Не назначен</span>
							)}
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					{/* Priority Row */}
					<div className="flex items-center justify-between p-3 -mx-4 hover:bg-muted/50 cursor-pointer">
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground text-sm">Приоритет</span>
						</div>
						<div className="flex items-center gap-2">
							{priority && (
								<>
									<ConstructionPrioritySelector
										priority={priority}
										issueId={task._id}
									/>
									<span className="text-sm">{priority.name}</span>
								</>
							)}
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					{/* Due Date Row */}
					<div className="flex items-center justify-between p-3 -mx-4 hover:bg-muted/50 cursor-pointer">
						<div className="flex items-center gap-3">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className="text-muted-foreground text-sm">Срок выполнения</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm">
								{task.dueDate
									? format(new Date(task.dueDate), "d MMM yyyy", {
											locale: ru,
										})
									: "Не указан"}
							</span>
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</div>
					</div>

					{/* Project Row */}
					{project && (
						<div className="flex items-center justify-between p-3 -mx-4 hover:bg-muted/50 cursor-pointer">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">Проект</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm">{project.name}</span>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>
					)}

					<Separator />

					{/* Description */}
					<div>
						<div className="mb-3 flex items-center gap-2">
							<FileText className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-sm">Описание</span>
						</div>
						{isEditingDescription ? (
							<div className="space-y-2">
								<Textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="min-h-[100px] resize-none"
									placeholder="Добавьте описание..."
									autoFocus
								/>
								<div className="flex gap-2">
									<Button size="sm" onClick={handleDescriptionSave}>
										Сохранить
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setDescription(task.description || "");
											setIsEditingDescription(false);
										}}
									>
										Отмена
									</Button>
								</div>
							</div>
						) : (
							<button
								type="button"
								className="min-h-[60px] w-full rounded p-3 text-left hover:bg-muted/50"
								onClick={() => setIsEditingDescription(true)}
							>
								{description || (
									<span className="text-muted-foreground">
										Добавить описание...
									</span>
								)}
							</button>
						)}
					</div>

					<Separator />

					{/* Subtasks */}
					<div>
						<ConstructionSubtasks task={task as ConstructionTask} />
					</div>

					<Separator />

					{/* Attachments */}
					<div>
						<div className="mb-3 flex items-center gap-2">
							<Paperclip className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium text-sm">Вложения</span>
						</div>
						<ConstructionTaskAttachmentsGrid
							task={task}
							onAttachmentsUpdate={() => {}}
						/>
					</div>

					<Separator />

					{/* Comments */}
					<div className="pb-20">
						<ConstructionTaskComments issueId={task._id as Id<"issues">} />
					</div>
				</div>
			</div>

			{/* Bottom Action Bar */}
			<div className="border-t bg-background p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Clock className="h-3 w-3" />
						<span>
							Создано {format(new Date(task.createdAt), "d MMM", { locale: ru })}
						</span>
					</div>
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
								try {
									await deleteTask({ id: task._id as Id<"issues"> });
									handleBack();
								} catch (error) {
									console.error("Error deleting task:", error);
								}
							}
						}}
					>
						Удалить
					</Button>
				</div>
			</div>
		</motion.div>
	);
}