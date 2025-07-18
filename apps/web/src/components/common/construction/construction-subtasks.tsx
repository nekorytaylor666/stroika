"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	ListTree,
	Plus,
	Trash2,
	Unlink,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionStatusSelector } from "./construction-status-selector";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionSubtasksProps {
	task: ConstructionTask;
}

export function ConstructionSubtasks({ task }: ConstructionSubtasksProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
	const [selectedAssigneeId, setSelectedAssigneeId] = useState<
		string | undefined
	>(task.assigneeId);
	const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>();
	const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const [openDatePickers, setOpenDatePickers] = useState<
		Record<string, boolean>
	>({});
	const { openTaskDetails } = useConstructionTaskDetailsStore();
	const { users } = useConstructionData();
	const currentUser = useCurrentUser();

	// Fetch subtasks
	const subtasks = useQuery(api.subtasks.getSubtasks, {
		taskId: task._id as Id<"issues">,
	});

	const taskProgress = useQuery(api.subtasks.getTaskProgress, {
		taskId: task._id as Id<"issues">,
	});

	// Mutations
	const createSubtask = useMutation(api.subtasks.createSubtask);
	const updateTaskStatus = useMutation(api.constructionTasks.updateStatus);
	const updateTask = useMutation(api.constructionTasks.update);
	const removeFromParent = useMutation(api.subtasks.removeFromParent);

	// Get default status for new subtasks
	const statuses = useQuery(api.metadata.getAllStatus);
	// Try to find a default status, fallback to first available
	const defaultStatus =
		statuses?.find(
			(s) =>
				s.name === "К выполнению" ||
				s.name === "To Do" ||
				s.name === "Backlog" ||
				s.name === "Новая",
		) || statuses?.[0];
	const doneStatus = statuses?.find(
		(s) =>
			s.name === "завершено" ||
			s.name === "Done" ||
			s.name === "Completed" ||
			s.name === "Выполнено",
	);

	const handleCreateSubtask = async () => {
		if (!newSubtaskTitle.trim()) return;

		// Debug logging
		console.log("Available statuses:", statuses);
		console.log("Default status:", defaultStatus);
		console.log("Task:", task);
		console.log(
			"Task priority ID:",
			task.priorityId || (task as any).priority?._id,
		);

		if (!defaultStatus) {
			toast.error(
				"Не удалось найти статус по умолчанию. Доступные статусы: " +
					(statuses?.map((s) => s.name).join(", ") || "нет"),
			);
			return;
		}

		// Get priorityId - it might be in task.priorityId or task.priority._id
		const priorityId = task.priorityId || (task as any).priority?._id;

		if (!priorityId) {
			toast.error("У родительской задачи не установлен приоритет");
			return;
		}

		try {
			if (!currentUser) {
				toast.error("Пользователь не авторизован");
				return;
			}
			await createSubtask({
				parentTaskId: task._id as Id<"issues">,
				title: newSubtaskTitle.trim(),
				description: "",
				statusId: defaultStatus._id,
				assigneeId: selectedAssigneeId as Id<"users"> | undefined,
				priorityId: priorityId as Id<"priorities">,
				labelIds: [],
				projectId: task.projectId as Id<"constructionProjects"> | undefined,
				dueDate: selectedDueDate?.toISOString(),
				userId: currentUser._id as Id<"users">,
			});

			toast.success("Подзадача создана");
			setNewSubtaskTitle("");
			setSelectedAssigneeId(task.assigneeId);
			setSelectedDueDate(undefined);
			setIsCreating(false);
		} catch (error) {
			console.error("Failed to create subtask:", error);
			toast.error("Ошибка при создании подзадачи");
		}
	};

	const handleStatusToggle = async (subtask: any) => {
		if (!doneStatus || !defaultStatus) return;

		const newStatusId =
			subtask.statusId === doneStatus._id ? defaultStatus._id : doneStatus._id;

		try {
			if (!currentUser) {
				toast.error("Ошибка: пользователь не авторизован");
				return;
			}
			await updateTaskStatus({
				id: subtask._id,
				statusId: newStatusId,
				userId: currentUser._id as Id<"users">,
			});
		} catch (error) {
			console.error("Failed to update subtask status:", error);
			toast.error("Ошибка при обновлении статуса");
		}
	};

	const handleRemoveFromParent = async (subtaskId: string) => {
		try {
			await removeFromParent({
				taskId: subtaskId as Id<"issues">,
			});
			toast.success("Подзадача отсоединена");
		} catch (error) {
			console.error("Failed to remove from parent:", error);
			toast.error("Ошибка при отсоединении подзадачи");
		}
	};

	if (!subtasks || subtasks.length === 0) {
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<ListTree className="h-4 w-4" />
						<span>Подзадачи</span>
					</div>
					<Button
						size="xs"
						variant="ghost"
						onClick={() => setIsCreating(true)}
						className="h-6 px-2"
					>
						<Plus className="mr-1 h-3 w-3" />
						Добавить
					</Button>
				</div>

				{isCreating && (
					<div className="space-y-2 rounded-md border p-3">
						<Input
							value={newSubtaskTitle}
							onChange={(e) => setNewSubtaskTitle(e.target.value)}
							placeholder="Название подзадачи..."
							className="h-8"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setIsCreating(false);
									setNewSubtaskTitle("");
									setSelectedAssigneeId(task.assigneeId);
									setSelectedDueDate(undefined);
								}
							}}
						/>
						<div className="flex gap-2">
							{/* Assignee selector */}
							<Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 justify-start"
									>
										{selectedAssigneeId ? (
											<>
												<User className="mr-2 h-3 w-3" />
												{users?.find((u) => u._id === selectedAssigneeId)
													?.name || "Не назначен"}
											</>
										) : (
											<>
												<User className="mr-2 h-3 w-3" />
												Назначить
											</>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-56 p-0" align="start">
									<div className="max-h-64 overflow-y-auto">
										{users?.map((user) => (
											<button
												key={user._id}
												className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
												onClick={() => {
													setSelectedAssigneeId(user._id);
													setIsAssigneeOpen(false);
												}}
											>
												<ConstructionAssigneeUser user={user} />
												<span className="truncate">{user.name}</span>
											</button>
										))}
									</div>
								</PopoverContent>
							</Popover>

							{/* Date picker */}
							<Popover
								open={isDatePickerOpen}
								onOpenChange={setIsDatePickerOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="h-8 justify-start"
									>
										<Calendar className="mr-2 h-3 w-3" />
										{selectedDueDate
											? format(selectedDueDate, "d MMM", { locale: ru })
											: "Срок"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<CalendarComponent
										mode="single"
										selected={selectedDueDate}
										onSelect={setSelectedDueDate}
										locale={ru}
									/>
								</PopoverContent>
							</Popover>

							<div className="ml-auto flex gap-2">
								<Button
									size="sm"
									onClick={handleCreateSubtask}
									disabled={!newSubtaskTitle.trim()}
									className="h-8"
								>
									Создать
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										setIsCreating(false);
										setNewSubtaskTitle("");
										setSelectedAssigneeId(task.assigneeId);
										setSelectedDueDate(undefined);
									}}
									className="h-8"
								>
									Отмена
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{/* Header with progress */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex items-center gap-2 font-medium text-sm hover:text-foreground/80"
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
					<ListTree className="h-4 w-4" />
					<span>
						Подзадачи ({taskProgress?.completed}/{taskProgress?.total})
					</span>
				</button>

				<div className="flex items-center gap-3">
					{taskProgress && taskProgress.total > 0 && (
						<>
							{/* Mini timeline indicator */}
							<div className="flex items-center gap-2">
								<div className="relative h-6 w-24 rounded bg-muted/50">
									{/* Background progress */}
									<div
										className="absolute inset-y-0 left-0 rounded-l bg-blue-500/20"
										style={{ width: "100%" }}
									/>
									{/* Actual progress */}
									<div
										className="absolute inset-y-0 left-0 rounded-l bg-green-500/30"
										style={{ width: `${taskProgress.percentage}%` }}
									/>
									{/* Today marker if we have dates */}
									<div className="absolute inset-y-0 flex w-full items-center justify-center">
										<span className="font-medium text-[10px]">
											{taskProgress.completed}/{taskProgress.total}
										</span>
									</div>
								</div>
								<span className="text-muted-foreground text-xs">
									{taskProgress.percentage}%
								</span>
							</div>
						</>
					)}
					<Button
						size="xs"
						variant="ghost"
						onClick={() => setIsCreating(true)}
						className="h-6 px-2"
					>
						<Plus className="mr-1 h-3 w-3" />
						Добавить
					</Button>
				</div>
			</div>

			{/* Subtasks list */}
			{isExpanded && (
				<div className="space-y-1 pl-6">
					{subtasks.map((subtask) => (
						<div
							key={subtask._id}
							className={cn(
								"group flex items-center gap-2 rounded-md border border-transparent p-2 transition-all hover:border-border hover:bg-muted/50",
								subtask.status?.name === "завершено" && "opacity-60",
							)}
						>
							<Checkbox
								checked={subtask.status?.name === "завершено"}
								onCheckedChange={() => handleStatusToggle(subtask)}
								className="h-4 w-4"
							/>

							<button
								onClick={() => openTaskDetails(subtask as ConstructionTask)}
								className="flex-1 text-left"
							>
								<div className="flex items-center gap-2">
									<span
										className={cn(
											"text-sm",
											subtask.status?.name === "завершено" && "line-through",
										)}
									>
										{subtask.title}
									</span>
									{subtask.subtaskCount > 0 && (
										<span className="text-muted-foreground text-xs">
											({subtask.subtaskCount})
										</span>
									)}
								</div>
							</button>

							<div className="flex items-center gap-2">
								{/* Always visible status */}
								<ConstructionStatusSelector
									status={subtask.status}
									onChange={async (newStatus) => {
										if (!newStatus || !currentUser) return;
										try {
											await updateTaskStatus({
												id: subtask._id,
												statusId: newStatus._id,
												userId: currentUser._id as Id<"users">,
											});
										} catch (error) {
											console.error("Failed to update status:", error);
											toast.error("Ошибка при обновлении статуса");
										}
									}}
									size="xs"
								/>

								{/* Deadline selector */}
								<Popover
									open={openDatePickers[subtask._id] || false}
									onOpenChange={(open) =>
										setOpenDatePickers((prev) => ({
											...prev,
											[subtask._id]: open,
										}))
									}
								>
									<PopoverTrigger asChild>
										<Button
											variant={
												subtask.dueDate &&
												new Date(subtask.dueDate) < new Date()
													? "destructive"
													: "ghost"
											}
											size="xs"
											className={cn(
												"h-6 gap-1 px-2 text-xs",
												!subtask.dueDate && "text-muted-foreground",
											)}
										>
											<Calendar className="h-3 w-3" />
											{subtask.dueDate
												? format(new Date(subtask.dueDate), "d MMM", {
														locale: ru,
													})
												: "Срок"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="end">
										<CalendarComponent
											mode="single"
											selected={
												subtask.dueDate ? new Date(subtask.dueDate) : undefined
											}
											onSelect={async (date) => {
												try {
													if (!currentUser) {
														toast.error("Ошибка: пользователь не авторизован");
														return;
													}
													await updateTask({
														id: subtask._id,
														dueDate: date?.toISOString(),
														userId: currentUser._id as Id<"users">,
													});
													toast.success("Срок обновлен");
													setOpenDatePickers((prev) => ({
														...prev,
														[subtask._id]: false,
													}));
												} catch (error) {
													console.error("Failed to update due date:", error);
													toast.error("Ошибка при обновлении срока");
												}
											}}
											locale={ru}
										/>
									</PopoverContent>
								</Popover>

								{/* Assignee */}
								{subtask.assignee && (
									<ConstructionAssigneeUser user={subtask.assignee} />
								)}

								{/* Remove from parent button - only on hover */}
								<Button
									size="xs"
									variant="ghost"
									onClick={() => handleRemoveFromParent(subtask._id)}
									className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<Unlink className="h-3 w-3" />
								</Button>
							</div>
						</div>
					))}

					{isCreating && (
						<div className="space-y-2 rounded-md border p-3">
							<Input
								value={newSubtaskTitle}
								onChange={(e) => setNewSubtaskTitle(e.target.value)}
								placeholder="Название подзадачи..."
								className="h-8"
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Escape") {
										setIsCreating(false);
										setNewSubtaskTitle("");
										setSelectedAssigneeId(task.assigneeId);
										setSelectedDueDate(undefined);
									}
								}}
							/>
							<div className="flex gap-2">
								{/* Assignee selector */}
								<Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="h-8 justify-start"
										>
											{selectedAssigneeId ? (
												<>
													<User className="mr-2 h-3 w-3" />
													{users?.find((u) => u._id === selectedAssigneeId)
														?.name || "Не назначен"}
												</>
											) : (
												<>
													<User className="mr-2 h-3 w-3" />
													Назначить
												</>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-56 p-0" align="start">
										<div className="max-h-64 overflow-y-auto">
											{users?.map((user) => (
												<button
													key={user._id}
													className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
													onClick={() => {
														setSelectedAssigneeId(user._id);
														setIsAssigneeOpen(false);
													}}
												>
													<ConstructionAssigneeUser user={user} />
													<span className="truncate">{user.name}</span>
												</button>
											))}
										</div>
									</PopoverContent>
								</Popover>

								{/* Date picker */}
								<Popover
									open={isDatePickerOpen}
									onOpenChange={setIsDatePickerOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="h-8 justify-start"
										>
											<Calendar className="mr-2 h-3 w-3" />
											{selectedDueDate
												? format(selectedDueDate, "d MMM", { locale: ru })
												: "Срок"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<CalendarComponent
											mode="single"
											selected={selectedDueDate}
											onSelect={setSelectedDueDate}
											locale={ru}
										/>
									</PopoverContent>
								</Popover>

								<div className="ml-auto flex gap-2">
									<Button
										size="sm"
										onClick={handleCreateSubtask}
										disabled={!newSubtaskTitle.trim()}
										className="h-8"
									>
										Создать
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setIsCreating(false);
											setNewSubtaskTitle("");
											setSelectedAssigneeId(task.assigneeId);
											setSelectedDueDate(undefined);
										}}
										className="h-8"
									>
										Отмена
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
