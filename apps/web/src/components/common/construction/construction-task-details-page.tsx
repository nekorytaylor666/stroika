"use client";

import { LabelSelector } from "@/components/layout/sidebar/create-new-issue/label-selector";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
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
	Copy,
	ExternalLink,
	FileText,
	Hash,
	Link2,
	MoreHorizontal,
	Paperclip,
	Plus,
	Trash2,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ConstructionAssigneeSelector } from "./construction-assignee-selector";
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
	const { users, priorities, statuses, projects, labels } =
		useConstructionData();
	const currentUser = useCurrentUser();
	const { openTaskDetails } = useConstructionTaskDetailsStore();

	// Fetch task by identifier
	const task = useQuery(api.constructionTasks.getByIdentifier, {
		identifier: taskId,
	});

	const updateTask = useMutation(api.constructionTasks.update);
	const deleteTask = useMutation(api.constructionTasks.deleteTask);
	const updateTaskAssignee = useMutation(api.constructionTasks.updateAssignee);
	const updateTaskPriority = useMutation(api.constructionTasks.updatePriority);
	const updateTaskStatus = useMutation(api.constructionTasks.updateStatus);
	const addLabel = useMutation(api.constructionTasks.addLabel);
	const removeLabel = useMutation(api.constructionTasks.removeLabel);

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
					<div className="mb-2 h-8 w-32 rounded bg-muted" />
					<div className="h-4 w-48 rounded bg-muted" />
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
	const taskLabels = task.labelIds
		? task.labelIds
				.map((id) => labels?.find((l) => l._id === id))
				.filter(Boolean)
		: [];

	const handleTitleSave = async () => {
		if (title !== task.title) {
			try {
				await updateTask({
					id: task._id as Id<"issues">,
					title,
					userId: currentUser?._id as Id<"user">,
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
					userId: currentUser?._id as Id<"user">,
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
					userId: currentUser?._id as Id<"user">,
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
				className="flex h-full flex-col bg-background"
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
					<div className="space-y-6 p-4">
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
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
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
						<div className="-mx-4 flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">
									Исполнитель
								</span>
							</div>
							<ConstructionAssigneeSelector
								issueId={task._id}
								currentAssigneeId={task.assigneeId}
								showLabel={true}
							/>
						</div>

						{/* Priority Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
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
						<div className="-mx-4 flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">
									Срок выполнения
								</span>
							</div>
							<Popover
								open={isDatePickerOpen}
								onOpenChange={setIsDatePickerOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 gap-1.5 px-3"
									>
										<span className="text-sm">
											{selectedDate
												? format(selectedDate, "d MMM yyyy", { locale: ru })
												: "Не указан"}
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

						{/* Project Row */}
						{project && (
							<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
								<div className="flex items-center gap-3">
									<span className="text-muted-foreground text-sm">Проект</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm">{project.name}</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</div>
							</div>
						)}

						{/* Labels Row */}
						<div className="-mx-4 p-3">
							<div className="mb-2 flex items-center gap-3">
								<span className="text-muted-foreground text-sm">Метки</span>
							</div>
							<LabelSelector
								selectedLabels={taskLabels}
								onChange={async (newLabels) => {
									// Find labels to add
									const labelsToAdd = newLabels.filter(
										(label) => !taskLabels.some((l) => l._id === label._id),
									);

									// Find labels to remove
									const labelsToRemove = taskLabels.filter(
										(label) => !newLabels.some((l) => l._id === label._id),
									);

									// Add new labels
									for (const label of labelsToAdd) {
										await addLabel({
											taskId: task._id,
											labelId: label._id,
										});
									}

									// Remove unselected labels
									for (const label of labelsToRemove) {
										await removeLabel({
											taskId: task._id,
											labelId: label._id,
										});
									}
								}}
							/>
						</div>

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
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Clock className="h-3 w-3" />
							<span>
								Создано{" "}
								{format(new Date(task.createdAt), "d MMM", { locale: ru })}
							</span>
						</div>
						<Button variant="destructive" size="sm" onClick={handleDelete}>
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
			className="flex h-full w-full bg-background"
		>
			{/* Main Content Area */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top Header Bar */}
				<div className="relative flex h-14 items-center justify-between border-b px-8">
					{/* Linear-style gradient border */}
					<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleBack}
							className="h-8 gap-1.5 px-3"
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
							<span className="font-mono text-muted-foreground text-sm">
								{task.identifier}
							</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopyLink}
							className="h-8 gap-1.5 px-3"
						>
							<Link2 className="h-3.5 w-3.5" />
							<span className="text-sm">Копировать ссылку</span>
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={handleCopyLink}>
									<Copy className="mr-2 h-4 w-4" />
									Копировать ссылку
								</DropdownMenuItem>
								<DropdownMenuItem>
									<ExternalLink className="mr-2 h-4 w-4" />
									Открыть в новой вкладке
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-destructive focus:text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Удалить задачу
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Main Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="mx-auto w-full max-w-[1200px] px-16 py-10">
						{/* Title Section */}
						<div className="mb-10">
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
									className="h-auto border-none px-0 font-semibold text-3xl focus:ring-0 focus-visible:ring-0"
									autoFocus
								/>
							) : (
								<h1
									className="-mx-3 cursor-text rounded-md px-3 py-2 font-semibold text-3xl transition-colors hover:bg-muted/50"
									onClick={() => setIsEditingTitle(true)}
								>
									{title}
								</h1>
							)}
						</div>

						{/* Metadata Grid */}
						<div className="mb-8 grid grid-cols-2 gap-x-12 gap-y-6">
							{/* Status */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Статус</span>
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
								<span className="text-muted-foreground text-sm">
									Исполнитель
								</span>
								<ConstructionAssigneeSelector
									issueId={task._id}
									currentAssigneeId={task.assigneeId}
									showLabel={true}
								/>
							</div>

							{/* Priority */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-sm">Приоритет</span>
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
								<span className="text-muted-foreground text-sm">
									Срок выполнения
								</span>
								<Popover
									open={isDatePickerOpen}
									onOpenChange={setIsDatePickerOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-8 gap-1.5 px-3"
										>
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
								<div className="col-span-2 flex items-center justify-between">
									<span className="text-muted-foreground text-sm">Проект</span>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 px-3"
										onClick={() =>
											navigate({
												to: `/construction/${orgId}/projects/${project._id}/tasks`,
											})
										}
									>
										<Hash className="mr-1.5 h-3.5 w-3.5" />
										{project.name}
									</Button>
								</div>
							)}
						</div>

						<Separator className="my-10" />

						{/* Description Section */}
						<div className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium text-base">Описание</span>
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
									className="min-h-[100px] cursor-text rounded-lg border border-transparent p-4 transition-all hover:border-border hover:bg-muted/50"
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

						<Separator className="my-10" />

						{/* Subtasks Section */}
						<div className="mb-10">
							<ConstructionSubtasks task={task as ConstructionTask} />
						</div>

						<Separator className="my-10" />

						{/* Attachments Section */}
						<div className="mb-10">
							<div className="mb-4 flex items-center gap-2">
								<Paperclip className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium text-base">Вложения</span>
							</div>
							<ConstructionTaskAttachmentsGrid
								task={task}
								onAttachmentsUpdate={() => {}}
							/>
						</div>

						<Separator className="my-10" />

						{/* Comments Section */}
						<div>
							<ConstructionTaskComments issueId={task._id as Id<"issues">} />
						</div>
					</div>
				</div>
			</div>

			{/* Right Sidebar */}
			<div className="w-[450px] flex-shrink-0 overflow-y-auto border-l bg-muted/20">
				<div className="space-y-8 p-8">
					{/* Activity */}
					<div>
						<h3 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Активность
						</h3>
						<div className="space-y-3">
							<div className="flex items-start gap-3">
								<div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
									<User className="h-3.5 w-3.5" />
								</div>
								<div className="flex-1">
									<p className="text-sm">
										<span className="font-medium">{currentUser?.name}</span>{" "}
										создал(а) задачу
									</p>
									<p className="text-muted-foreground text-xs">
										{format(new Date(task.createdAt), "d MMM в HH:mm", {
											locale: ru,
										})}
									</p>
								</div>
							</div>
							{task.updatedAt && task.updatedAt !== task.createdAt && (
								<div className="flex items-start gap-3">
									<div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
										<Clock className="h-3.5 w-3.5" />
									</div>
									<div className="flex-1">
										<p className="text-sm">Задача обновлена</p>
										<p className="text-muted-foreground text-xs">
											{format(new Date(task.updatedAt), "d MMM в HH:mm", {
												locale: ru,
											})}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Related Tasks */}
					<div>
						<h3 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Связанные задачи
						</h3>
						<p className="text-muted-foreground text-sm">Нет связанных задач</p>
					</div>

					{/* Labels */}
					<div>
						<h3 className="mb-4 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Метки
						</h3>
						<LabelSelector
							selectedLabels={taskLabels}
							onChange={async (newLabels) => {
								// Find labels to add
								const labelsToAdd = newLabels.filter(
									(label) => !taskLabels.some((l) => l._id === label._id),
								);

								// Find labels to remove
								const labelsToRemove = taskLabels.filter(
									(label) => !newLabels.some((l) => l._id === label._id),
								);

								// Add new labels
								for (const label of labelsToAdd) {
									await addLabel({
										taskId: task._id,
										labelId: label._id,
									});
								}

								// Remove unselected labels
								for (const label of labelsToRemove) {
									await removeLabel({
										taskId: task._id,
										labelId: label._id,
									});
								}
							}}
						/>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
