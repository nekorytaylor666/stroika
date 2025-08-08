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
	Hash,
	MoreHorizontal,
	Paperclip,
	Plus,
	User,
	Trash2,
	Copy,
	Link2,
	ExternalLink,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>();

	useEffect(() => {
		if (task) {
			setTitle(task.title);
			setDescription(task.description || "");
			if (task.dueDate) {
				setSelectedDate(new Date(task.dueDate));
			}
		}
	}, [task]);

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

	const handleDateChange = async (date: Date | undefined) => {
		setSelectedDate(date);
		setIsDatePickerOpen(false);
		if (date) {
			try {
				await updateTask({
					id: task._id as Id<"issues">,
					dueDate: date.toISOString(),
					userId: currentUser?._id as Id<"users">,
				});
			} catch (error) {
				console.error("Error updating due date:", error);
			}
		}
	};

	const handleCopyLink = () => {
		const url = window.location.href;
		navigator.clipboard.writeText(url);
	};

	const handleDelete = async () => {
		if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
			try {
				await deleteTask({ id: task._id as Id<"issues"> });
				handleBack();
			} catch (error) {
				console.error("Error deleting task:", error);
			}
		}
	};

	// Mobile view
	if (isMobile) {
		return (
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: -20 }}
				className="flex flex-col h-full bg-background"
			>
				{/* Mobile Header */}
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

				{/* Mobile Content */}
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
							onClick={handleDelete}
						>
							Удалить
						</Button>
					</div>
				</div>
			</motion.div>
		);
	}

	// Desktop view - Linear style
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex h-full bg-background"
		>
			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top Header Bar */}
				<div className="relative flex h-12 items-center justify-between border-b px-6">
					{/* Linear-style gradient border */}
					<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
					
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleBack}
							className="h-7 px-2 gap-1"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							<span className="text-sm">Задачи</span>
						</Button>

						<div className="h-4 w-px bg-border" />

						<div className="flex items-center gap-2">
							{priority && (
								<ConstructionPrioritySelector
									priority={priority}
									issueId={task._id}
								/>
							)}
							<span className="font-mono text-sm text-muted-foreground">
								{task.identifier}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopyLink}
							className="h-7 px-2 gap-1.5"
						>
							<Link2 className="h-3.5 w-3.5" />
							<span className="text-sm">Копировать ссылку</span>
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-7 w-7">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={handleCopyLink}>
									<Copy className="h-4 w-4 mr-2" />
									Копировать ссылку
								</DropdownMenuItem>
								<DropdownMenuItem>
									<ExternalLink className="h-4 w-4 mr-2" />
									Открыть в новой вкладке
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Удалить задачу
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="max-w-4xl mx-auto p-8">
						{/* Title Section */}
						<div className="mb-8">
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
									className="h-auto border-none px-0 font-semibold text-2xl focus:ring-0 focus-visible:ring-0"
									autoFocus
								/>
							) : (
								<h1
									className="font-semibold text-2xl cursor-text hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
									onClick={() => setIsEditingTitle(true)}
								>
									{title}
								</h1>
							)}
						</div>

						{/* Metadata Grid */}
						<div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
							{/* Status */}
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Статус</span>
								{status && (
									<ConstructionStatusSelector
										statusId={task.statusId}
										issueId={task._id}
										showLabel={true}
									/>
								)}
							</div>

							{/* Assignee */}
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Исполнитель</span>
								<div className="flex items-center gap-2">
									{assignee ? (
										<>
											<ConstructionAssigneeUser user={assignee} />
											<span className="text-sm">{assignee.name}</span>
										</>
									) : (
										<Button variant="ghost" size="sm" className="h-7 px-2">
											<User className="h-3.5 w-3.5 mr-1.5" />
											Назначить
										</Button>
									)}
								</div>
							</div>

							{/* Priority */}
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Приоритет</span>
								{priority && (
									<div className="flex items-center gap-2">
										<ConstructionPrioritySelector
											priority={priority}
											issueId={task._id}
										/>
										<span className="text-sm">{priority.name}</span>
									</div>
								)}
							</div>

							{/* Due Date */}
							<div className="flex items-center justify-between">
								<span className="text-sm text-muted-foreground">Срок выполнения</span>
								<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
									<PopoverTrigger asChild>
										<Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5">
											<Calendar className="h-3.5 w-3.5" />
											<span className="text-sm">
												{selectedDate
													? format(selectedDate, "d MMM yyyy", { locale: ru })
													: "Выбрать дату"}
											</span>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="end">
										<CalendarComponent
											mode="single"
											selected={selectedDate}
											onSelect={handleDateChange}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							{/* Project */}
							{project && (
								<div className="flex items-center justify-between col-span-2">
									<span className="text-sm text-muted-foreground">Проект</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-7 px-2"
										onClick={() => navigate({ to: `/construction/${orgId}/projects/${project._id}/tasks` })}
									>
										<Hash className="h-3.5 w-3.5 mr-1.5" />
										{project.name}
									</Button>
								</div>
							)}
						</div>

						<Separator className="mb-8" />

						{/* Description Section */}
						<div className="mb-8">
							<div className="mb-4 flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Описание</span>
							</div>
							{isEditingDescription ? (
								<div className="space-y-3">
									<Textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										className="min-h-[120px] resize-none"
										placeholder="Добавьте описание задачи..."
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
								<div
									className="min-h-[80px] rounded-md border border-transparent hover:border-border hover:bg-muted/50 p-3 cursor-text transition-all"
									onClick={() => setIsEditingDescription(true)}
								>
									{description ? (
										<p className="whitespace-pre-wrap">{description}</p>
									) : (
										<span className="text-muted-foreground">
											Нажмите, чтобы добавить описание...
										</span>
									)}
								</div>
							)}
						</div>

						<Separator className="mb-8" />

						{/* Subtasks Section */}
						<div className="mb-8">
							<ConstructionSubtasks task={task as ConstructionTask} />
						</div>

						<Separator className="mb-8" />

						{/* Attachments Section */}
						<div className="mb-8">
							<div className="mb-4 flex items-center gap-2">
								<Paperclip className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">Вложения</span>
							</div>
							<ConstructionTaskAttachmentsGrid
								task={task}
								onAttachmentsUpdate={() => {}}
							/>
						</div>

						<Separator className="mb-8" />

						{/* Comments Section */}
						<div>
							<ConstructionTaskComments issueId={task._id as Id<"issues">} />
						</div>
					</div>
				</div>
			</div>

			{/* Right Sidebar */}
			<div className="w-80 border-l bg-muted/30 p-6 overflow-y-auto">
				<div className="space-y-6">
					{/* Activity */}
					<div>
						<h3 className="font-medium text-sm mb-3">Активность</h3>
						<div className="space-y-3">
							<div className="flex items-start gap-3">
								<div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
									<User className="h-3.5 w-3.5" />
								</div>
								<div className="flex-1">
									<p className="text-sm">
										<span className="font-medium">{currentUser?.name}</span> создал(а) задачу
									</p>
									<p className="text-xs text-muted-foreground">
										{format(new Date(task.createdAt), "d MMM в HH:mm", { locale: ru })}
									</p>
								</div>
							</div>
							{task.updatedAt && task.updatedAt !== task.createdAt && (
								<div className="flex items-start gap-3">
									<div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
										<Clock className="h-3.5 w-3.5" />
									</div>
									<div className="flex-1">
										<p className="text-sm">Задача обновлена</p>
										<p className="text-xs text-muted-foreground">
											{format(new Date(task.updatedAt), "d MMM в HH:mm", { locale: ru })}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Related Tasks */}
					<div>
						<h3 className="font-medium text-sm mb-3">Связанные задачи</h3>
						<p className="text-sm text-muted-foreground">Нет связанных задач</p>
					</div>

					{/* Labels */}
					<div>
						<h3 className="font-medium text-sm mb-3">Метки</h3>
						<Button variant="outline" size="sm" className="h-7 px-2 gap-1.5">
							<Plus className="h-3.5 w-3.5" />
							Добавить метку
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}