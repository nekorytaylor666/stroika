"use client";

import { DocumentDetailsModal } from "@/components/documents/document-details-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Calendar,
	Clock,
	Copy,
	FileText,
	Link2,
	MessageSquare,
	MoreHorizontal,
	Paperclip,
	Plus,
	Send,
	User,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionPrioritySelector } from "./construction-priority-selector";
import { ConstructionStatusSelector } from "./construction-status-selector";
import { ConstructionTaskAttachmentsGrid } from "./construction-task-attachments-grid";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionTaskDetailsProps {
	task: ConstructionTask | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ConstructionTaskDetails({
	task,
	open,
	onOpenChange,
}: ConstructionTaskDetailsProps) {
	const { users, priorities, labels, projects, updateTask } =
		useConstructionData();
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isEditingDescription, setIsEditingDescription] = useState(false);
	const [title, setTitle] = useState(task?.title || "");
	const [description, setDescription] = useState(task?.description || "");
	const [comment, setComment] = useState("");

	// Query to get fresh task data
	const freshTask = useQuery(
		api.constructionTasks.getById,
		task?._id ? { id: task._id as Id<"issues"> } : "skip",
	);

	// Use fresh task data if available, otherwise fall back to prop
	const currentTask = freshTask || task;

	useEffect(() => {
		if (currentTask) {
			setTitle(currentTask.title);
			setDescription(currentTask.description);
		}
	}, [currentTask]);

	if (!currentTask) return null;

	const assignee = currentTask.assigneeId
		? users?.find((u) => u._id === currentTask.assigneeId)
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
							<Button variant="ghost" size="sm" onClick={handleCopyLink}>
								<Link2 className="h-4 w-4" />
							</Button>
							<Button variant="ghost" size="sm">
								<Copy className="h-4 w-4" />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="sm">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>Дублировать</DropdownMenuItem>
									<DropdownMenuItem>Переместить</DropdownMenuItem>
									<DropdownMenuItem className="text-red-600">
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

								{/* Attachments Section */}
								<div>
									<div className="mb-4 flex items-center gap-2">
										<Paperclip className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium text-sm">Вложения</span>
									</div>
									<ConstructionTaskAttachmentsGrid
										task={currentTask}
										onAttachmentsUpdate={() => {
											// Optionally refresh task data here
										}}
									/>
								</div>

								<Separator />

								{/* Comments Section */}
								<div>
									<div className="mb-4 flex items-center gap-2">
										<MessageSquare className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium text-sm">Комментарии</span>
									</div>

									{/* Comment Input */}
									<div className="mb-4 flex gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src="/api/placeholder/32/32" />
											<AvatarFallback>ME</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<Textarea
												value={comment}
												onChange={(e) => setComment(e.target.value)}
												placeholder="Написать комментарий..."
												className="min-h-[80px] resize-none"
											/>
											{comment && (
												<div className="mt-2 flex justify-end gap-2">
													<Button
														size="sm"
														variant="ghost"
														onClick={() => setComment("")}
													>
														Отмена
													</Button>
													<Button size="sm">
														<Send className="mr-1 h-3 w-3" />
														Отправить
													</Button>
												</div>
											)}
										</div>
									</div>

									{/* Comments List */}
									<div className="space-y-4">
										<motion.div
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											className="flex gap-3"
										>
											<Avatar className="h-8 w-8">
												<AvatarImage src="/api/placeholder/32/32" />
												<AvatarFallback>АИ</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="mb-1 flex items-center gap-2">
													<span className="font-medium text-sm">
														Александр Иванов
													</span>
													<span className="text-muted-foreground text-xs">
														2 часа назад
													</span>
												</div>
												<p className="text-sm">Начал работу над задачей</p>
											</div>
										</motion.div>
									</div>
								</div>
							</div>
						</div>

						{/* Sidebar */}
						<div className="w-80 space-y-4 overflow-y-auto border-l bg-muted/30 p-4">
							{/* Status */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Статус
								</span>
								<ConstructionStatusSelector
									statusId={currentTask.statusId}
									issueId={currentTask._id}
								/>
							</div>

							{/* Assignee */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Исполнитель
								</span>
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
							</div>

							{/* Priority */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Приоритет
								</span>
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
							</div>

							{/* Due Date */}
							<div>
								<span className="mb-1 block font-medium text-muted-foreground text-xs">
									Срок выполнения
								</span>
								<Button
									variant="ghost"
									className="h-8 w-full justify-start px-2"
								>
									<Calendar className="mr-2 h-4 w-4" />
									<span className="text-sm">
										{currentTask.dueDate
											? format(new Date(currentTask.dueDate), "d MMM", {
													locale: ru,
												})
											: "Не указан"}
									</span>
								</Button>
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
