"use client";

import { DocumentDetailsModal } from "@/components/documents/document-details-modal";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Calendar,
	Clock,
	Copy,
	FileText,
	Link2,
	Maximize2,
	MoreHorizontal,
	Paperclip,
	Plus,
	User,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ParentTaskDisplay } from "./construction-parent-task";
import { ConstructionPrioritySelector } from "./construction-priority-selector";
import { ConstructionStatusSelector } from "./construction-status-selector";
import { ConstructionSubtasks } from "./construction-subtasks";
import { ConstructionTaskAttachmentsGrid } from "./construction-task-attachments-grid";
import { ConstructionTaskComments } from "./construction-task-comments";
import type { ConstructionTask } from "./construction-tasks";
import { TimelineChart } from "./construction-timeline-chart";
import type { UserWithRole } from "better-auth/plugins";

interface ConstructionTaskDetailsProps {
	task: ConstructionTask | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgId?: string;
}

export function ConstructionTaskDetails({
	task,
	open,
	onOpenChange,
	orgId,
}: ConstructionTaskDetailsProps) {
	const navigate = useNavigate();
	const {
		users,
		priorities,
		labels,
		projects,
		// updateTask,
		updateTaskAssignee,
		updateTaskPriority,
	} = useConstructionData();
	const updateTask = useMutation(api.constructionTasks.update);
	const deleteTask = useMutation(api.constructionTasks.deleteTask);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [title, setTitle] = useState(task?.title || "");
	const [description, setDescription] = useState(task?.description || "");
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const currentUser = useCurrentUser();

	// Query to get fresh task data
	const freshTask = useQuery(
		api.constructionTasks.getById,
		task?._id ? { id: task._id as Id<"issues"> } : "skip",
	);

	// Use fresh task data if available, otherwise fall back to prop
	const currentTask = freshTask || task;

	// Fetch subtasks for timeline chart
	const subtasks = useQuery(
		api.subtasks.getSubtasks,
		currentTask?._id ? { taskId: currentTask._id as Id<"issues"> } : "skip",
	);

	useEffect(() => {
		if (currentTask) {
			setTitle(currentTask.title);
			setDescription(currentTask.description);
		}
	}, [currentTask]);

	if (!currentTask) return null;

	const assignee = currentTask.assigneeId
		? users?.find((u) => u.id === currentTask.assigneeId)
		: null;
	const priority = priorities?.find((p) => p._id === currentTask.priorityId);
	const taskLabels = currentTask.labelIds
		.map((id) => labels?.find((l) => l._id === id))
		.filter(Boolean);
	const project = currentTask.projectId
		? projects?.find((p) => p._id === currentTask.projectId)
		: null;
	const handleTitleSave = async () => {
		if (title !== currentTask.title && updateTask) {
			try {
				await (updateTask as any)({
					id: currentTask._id as Id<"issues">,
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
		if (description !== currentTask.description && updateTask) {
			try {
				await (updateTask as any)({
					id: currentTask._id as Id<"issues">,
					description,
					userId: currentUser?._id as Id<"users">,
				});
			} catch (error) {
				console.error("Error updating description:", error);
			}
		}
		setIsEditingDescription(false);
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(
			`${window.location.origin}/task/${currentTask.identifier}`,
		);
	};

	const handleFullscreen = () => {
		if (orgId && currentTask) {
			onOpenChange(false);
			navigate({
				to: "/construction/$orgId/tasks/$taskId",
				params: { orgId, taskId: currentTask.identifier },
			});
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className="!max-w-6xl flex h-[85vh] w-full flex-col gap-0 overflow-hidden p-0"
					hideCloseButton
				>
					{/* Header */}
					<div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
						<div className="flex items-center gap-3">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
							>
								{priority && (
									<ConstructionPrioritySelector
										priority={priority}
										issueId={currentTask._id}
									/>
								)}
							</motion.div>
							<span className="font-mono text-muted-foreground text-sm">
								{currentTask.identifier}
							</span>
						</div>
						<div className="flex items-center gap-1">
							{orgId && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleFullscreen}
									title="Открыть в полноэкранном режиме"
								>
									<Maximize2 className="h-4 w-4" />
								</Button>
							)}
							<Button variant="ghost" size="sm" onClick={handleCopyLink}>
								<Link2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm" onClick={handleCopyLink}>
								<Copy className="h-4 w-4" />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										onClick={() => {
											// TODO: Implement duplicate functionality
											console.log(
												"Duplicate functionality not implemented yet",
											);
										}}
									>
										Дублировать
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											// TODO: Implement move functionality
											console.log("Move functionality not implemented yet");
										}}
									>
										Переместить
									</DropdownMenuItem>
									<DropdownMenuItem
										className="text-red-600"
										onClick={async () => {
											if (
												confirm("Вы уверены, что хотите удалить эту задачу?")
											) {
												try {
													await deleteTask({
														id: currentTask._id as Id<"issues">,
													});
													onOpenChange(false);
												} catch (error) {
													console.error("Error deleting task:", error);
												}
											}
										}}
									>
										Удалить
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onOpenChange(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="flex flex-1 overflow-hidden">
						{/* Main Content */}
						<div className="flex-1 overflow-y-auto">
							<div className="space-y-6 p-6">
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
													setTitle(currentTask.title);
													setIsEditingTitle(false);
												}
											}}
											className="h-auto border-none px-0 font-semibold text-2xl"
											autoFocus
										/>
									) : (
										<button
											type="button"
											className="-mx-2 w-full cursor-text rounded px-2 py-1 text-left font-semibold text-2xl hover:bg-muted/50"
											onClick={() => setIsEditingTitle(true)}
										>
											{title}
										</button>
									)}
								</div>

								{/* Description */}
								<div>
									<div className="mb-2 flex items-center gap-2">
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
														setDescription(currentTask.description);
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
											className="min-h-[60px] w-full cursor-text rounded p-3 text-left hover:bg-muted/50"
											onClick={() => setIsEditingDescription(true)}
										>
											{description || (
												<span className="text-muted-foreground">
													Нажмите для добавления описания...
												</span>
											)}
										</button>
									)}
								</div>

								<Separator />

								{/* Parent Task Section - show if this is a subtask */}
								{(currentTask as any).parentTaskId && (
									<>
										<div>
											<ParentTaskDisplay
												parentTaskId={(currentTask as any).parentTaskId}
											/>
										</div>
										<Separator />
									</>
								)}

								{/* Subtasks Section */}
								<div className="space-y-4">
									<ConstructionSubtasks
										task={currentTask as ConstructionTask}
									/>

									{/* Timeline chart - show if task has subtasks */}
									{subtasks && subtasks.length > 0 && (
										<TimelineChart
											subtasks={subtasks}
											parentTask={currentTask}
										/>
									)}
								</div>

								<Separator />

								{/* Attachments Section */}
								<div>
									<div className="mb-4 flex items-center gap-2">
										<Paperclip className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium text-sm">Вложения</span>
									</div>
									<ConstructionTaskAttachmentsGrid
										task={currentTask}
										projectId={
											currentTask.projectId as Id<"constructionProjects">
										}
										onAttachmentsUpdate={() => {
											// Optionally refresh task data here
										}}
									/>
								</div>

								<Separator />

								{/* Comments Section */}
								<div>
									<ConstructionTaskComments
										issueId={currentTask._id as Id<"issues">}
									/>
								</div>
							</div>
						</div>

						{/* Sidebar */}
						<div className="w-80 space-y-4 overflow-y-auto border-l bg-muted/30 p-4">
							{/* Status */}
							<div>
								<span className="mb-2 block font-medium text-muted-foreground text-xs">
									Статус
								</span>
								<ConstructionStatusSelector
									statusId={currentTask.statusId}
									issueId={currentTask._id}
									showLabel={true}
								/>
							</div>

							{/* Assignee */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Исполнитель
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-full justify-start px-2"
										>
											{assignee ? (
												<>
													<ConstructionAssigneeUser user={assignee} />
													<span className="ml-2 text-sm">{assignee.name}</span>
												</>
											) : (
												<>
													<User className="mr-2 h-4 w-4" />
													<span className="text-muted-foreground text-sm">
														Не назначен
													</span>
												</>
											)}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="w-[200px]">
										<DropdownMenuItem
											onClick={async () => {
												if (updateTaskAssignee && currentUser) {
													await updateTaskAssignee({
														id: currentTask._id as Id<"issues">,
														assigneeId: undefined,
														userId: currentUser._id,
													});
												}
											}}
										>
											<User className="mr-2 h-4 w-4" />
											Не назначен
										</DropdownMenuItem>
										{users?.map((user: UserWithRole) => (
											<DropdownMenuItem
												key={user.id}
												onClick={async () => {
													if (updateTaskAssignee && currentUser) {
														await updateTaskAssignee({
															id: currentTask._id as Id<"issues">,
															assigneeId: user.id as Id<"users">,
															userId: currentUser._id,
														});
													}
												}}
											>
												<ConstructionAssigneeUser user={user} />
												<span className="ml-2">{user.name}</span>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Priority */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Приоритет
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-full justify-start px-2"
										>
											{priority && (
												<>
													<ConstructionPrioritySelector
														priority={priority}
														issueId={currentTask._id}
													/>
													<span className="ml-2 text-sm">{priority.name}</span>
												</>
											)}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="w-[200px]">
										{priorities?.map((p) => (
											<DropdownMenuItem
												key={p._id}
												onClick={async () => {
													if (updateTaskPriority && currentUser) {
														await updateTaskPriority({
															id: currentTask._id as Id<"issues">,
															priorityId: p._id as Id<"priorities">,
															userId: currentUser._id,
														});
													}
												}}
											>
												<ConstructionPrioritySelector
													priority={p}
													issueId={currentTask._id}
												/>
												<span className="ml-2">{p.name}</span>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Due Date */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Срок выполнения
								</span>
								<Popover
									open={isDatePickerOpen}
									onOpenChange={setIsDatePickerOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-full justify-start px-2"
										>
											<Calendar className="mr-2 h-4 w-4" />
											<span className="text-sm">
												{currentTask.dueDate
													? format(
															new Date(currentTask.dueDate),
															"d MMM yyyy",
															{
																locale: ru,
															},
														)
													: "Не указан"}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<CalendarComponent
											mode="single"
											selected={
												currentTask.dueDate
													? new Date(currentTask.dueDate)
													: undefined
											}
											onSelect={async (date) => {
												if (updateTask) {
													await updateTask({
														id: currentTask._id as Id<"issues">,
														dueDate: date
															? date.toISOString().split("T")[0]
															: undefined,
														userId: currentUser?._id as Id<"users">,
													});
													setIsDatePickerOpen(false);
												}
											}}
											locale={ru}
										/>
										{currentTask.dueDate && (
											<div className="border-t p-3">
												<Button
													variant="ghost"
													size="sm"
													className="w-full justify-start text-muted-foreground"
													onClick={async () => {
														if (updateTask) {
															await updateTask({
																id: currentTask._id as Id<"issues">,
																dueDate: undefined,
																userId: currentUser?._id as Id<"users">,
															});
															setIsDatePickerOpen(false);
														}
													}}
												>
													<X className="mr-2 h-4 w-4" />
													Очистить дату
												</Button>
											</div>
										)}
									</PopoverContent>
								</Popover>
							</div>

							{/* Labels */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Метки
								</span>
								<div className="flex flex-wrap gap-1">
									{taskLabels.map((label) => {
										if (!label) return null;
										return (
											<span
												key={label._id}
												className="inline-flex items-center rounded px-2 py-1 text-xs"
												style={{
													backgroundColor: `${label.color}20`,
													color: label.color,
												}}
											>
												{label.name}
											</span>
										);
									})}
									<Button variant="ghost" size="sm" className="h-6 px-2">
										<Plus className="h-3 w-3" />
									</Button>
								</div>
							</div>

							{/* Project */}
							{project && (
								<div>
									<span className="mb-1 block font-medium text-muted-foreground text-xs">
										Проект
									</span>
									<Button
										variant="ghost"
										className="h-8 w-full justify-start px-2"
									>
										<span className="text-sm">{project.name}</span>
									</Button>
								</div>
							)}

							<Separator />

							{/* Activity */}
							<div>
								<span className="mb-2 block font-medium text-muted-foreground text-xs">
									Активность
								</span>
								<div className="space-y-3">
									<div className="flex items-center gap-2 text-xs">
										<Clock className="h-3 w-3 text-muted-foreground" />
										<span className="text-muted-foreground">Создано</span>
										<span>
											{format(new Date(currentTask.createdAt), "d MMM yyyy", {
												locale: ru,
											})}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<DocumentDetailsModal />
		</>
	);
}
