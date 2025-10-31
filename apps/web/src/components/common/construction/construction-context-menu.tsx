import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
	BacklogIcon,
	CompletedIcon,
	InProgressIcon,
	PausedIcon,
	TechnicalReviewIcon,
	ToDoIcon,
} from "@/lib/status";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlarmClock,
	AlertTriangle,
	ArrowRightLeft,
	BarChart3,
	Bell,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Circle,
	CircleCheck,
	Clipboard,
	Clock,
	Copy as CopyIcon,
	FileText,
	Flag,
	Folder,
	Link as LinkIcon,
	MessageSquare,
	Minus,
	Pencil,
	PlusSquare,
	Repeat2,
	Star,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import React, { useState, type FC } from "react";
import { toast } from "sonner";
import type { ConstructionTask } from "./construction-tasks";

// Status icon mapping
const StatusIconMap = {
	BacklogIcon: BacklogIcon,
	PausedIcon: PausedIcon,
	ToDoIcon: ToDoIcon,
	InProgressIcon: InProgressIcon,
	TechnicalReviewIcon: TechnicalReviewIcon,
	CompletedIcon: CompletedIcon,
};

// Priority icon mapping
const PriorityIconMap = {
	"alert-triangle": AlertTriangle,
	"chevron-up": ChevronUp,
	minus: Minus,
	"chevron-down": ChevronDown,
};

const StatusIcon: FC<{ iconName: string; color?: string }> = ({
	iconName,
	color,
}) => {
	const IconComponent =
		StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
	return (
		<IconComponent style={color ? { color } : undefined} className="h-4 w-4" />
	);
};

const PriorityIcon: FC<{ iconName: string; color?: string }> = ({
	iconName,
	color,
}) => {
	const IconComponent =
		PriorityIconMap[iconName as keyof typeof PriorityIconMap] || Minus;
	return (
		<IconComponent style={color ? { color } : undefined} className="h-4 w-4" />
	);
};

interface ConstructionContextMenuProps {
	task: ConstructionTask;
}

export function ConstructionContextMenu({
	task,
}: ConstructionContextMenuProps) {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		task.dueDate ? new Date(task.dueDate) : undefined,
	);

	const { statuses, priorities, users, labels, projects } =
		useConstructionData();
	const currentUser = useCurrentUser();

	const updateStatus = useMutation(api.constructionTasks.updateStatus);
	const updateAssignee = useMutation(api.constructionTasks.updateAssignee);
	const updatePriority = useMutation(api.constructionTasks.updatePriority);
	const addLabel = useMutation(api.constructionTasks.addLabel);
	const removeLabel = useMutation(api.constructionTasks.removeLabel);
	const deleteTask = useMutation(api.constructionTasks.deleteTask);
	const updateTask = useMutation(api.constructionTasks.update);
	const addComment = useMutation(api.issueComments.create);

	const handleStatusChange = async (statusId: Id<"status">) => {
		try {
			if (!currentUser) {
				toast.error("Пользователь не авторизован");
				return;
			}
			await updateStatus({
				id: task._id,
				statusId,
				userId: currentUser.id as Id<"user">,
			});
			toast.success("Статус обновлен");
		} catch (error) {
			toast.error("Не удалось обновить статус");
		}
	};

	const handleAssigneeChange = async (assigneeId: Id<"user"> | null) => {
		try {
			await updateAssignee({
				id: task._id,
				assigneeId: assigneeId || undefined,
			});
			toast.success("Исполнитель обновлен");
		} catch (error) {
			toast.error("Не удалось обновить исполнителя");
		}
	};

	const handlePriorityChange = async (priorityId: Id<"priorities">) => {
		try {
			await updatePriority({
				id: task._id as Id<"issues">,
				priorityId,
				userId: currentUser.id as Id<"user">,
			});
			toast.success("Приоритет обновлен");
		} catch (error) {
			toast.error("Не удалось обновить приоритет");
		}
	};

	const handleLabelToggle = async (labelId: Id<"labels">) => {
		try {
			if (task.labelIds.includes(labelId)) {
				await removeLabel({ taskId: task._id as Id<"issues">, labelId });
				toast.success("Метка удалена");
			} else {
				await addLabel({ taskId: task._id as Id<"issues">, labelId });
				toast.success("Метка добавлена");
			}
		} catch (error) {
			toast.error("Не удалось обновить метки");
		}
	};

	const handleAddComment = async () => {
		const comment = prompt("Введите комментарий:");
		if (comment && currentUser) {
			try {
				await addComment({
					issueId: task._id as Id<"issues">,
					authorId: currentUser.id as Id<"user">,
					content: comment,
				});
				toast.success("Комментарий добавлен");
			} catch (error) {
				toast.error("Не удалось добавить комментарий");
			}
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(task.title);
		toast.success("Скопировано в буфер обмена");
	};

	const handleCopyLink = () => {
		const url = `${window.location.origin}/construction/${task.projectId}/tasks/${task._id}`;
		navigator.clipboard.writeText(url);
		toast.success("Ссылка скопирована");
	};

	const handleDelete = async () => {
		if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
			try {
				await deleteTask({ id: task._id as Id<"issues"> });
				toast.success("Задача удалена");
			} catch (error) {
				toast.error("Не удалось удалить задачу");
			}
		}
	};

	const handleSubscribe = () => {
		setIsSubscribed(!isSubscribed);
		toast.success(
			isSubscribed ? "Вы отписались от задачи" : "Вы подписались на задачу",
		);
	};

	const handleFavorite = () => {
		setIsFavorite(!isFavorite);
		toast.success(
			isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
		);
	};

	const handleSetDueDate = async (date: Date | undefined) => {
		try {
			if (!currentUser) {
				toast.error("Пользователь не авторизован");
				return;
			}
			await updateTask({
				id: task._id as Id<"issues">,
				dueDate: date ? format(date, "yyyy-MM-dd") : undefined,
				userId: currentUser.id as Id<"user">,
			});
			setSelectedDate(date);
			setIsDatePickerOpen(false);
			toast.success(date ? "Срок установлен" : "Срок удален");
		} catch (error) {
			toast.error("Не удалось обновить срок");
		}
	};

	const handleRename = () => {
		toast.info("Функция переименования в разработке");
	};

	const handleRemindMe = () => {
		toast.info("Функция напоминаний в разработке");
	};

	const isLoading = !statuses || !priorities || !users || !labels || !projects;

	if (isLoading) return null;

	return (
		<ContextMenuContent className="w-64">
			<ContextMenuGroup>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<CircleCheck className="mr-2 size-4" /> Статус
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{statuses.map((status) => {
							return (
								<ContextMenuItem
									key={status._id}
									onClick={() => handleStatusChange(status._id)}
									className="flex items-center gap-2"
								>
									<StatusIcon iconName={status.iconName} color={status.color} />
									<span>{status.name}</span>
									{task.statusId === status._id && (
										<CheckCircle2 className="ml-auto size-3 text-muted-foreground" />
									)}
								</ContextMenuItem>
							);
						})}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<User className="mr-2 size-4" /> Исполнитель
						{task.assigneeId && (
							<span className="ml-auto text-muted-foreground text-xs">
								{users.find((u) => u.id === task.assigneeId)?.name || ""}
							</span>
						)}
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-64 p-0">
						<Command>
							<CommandInput placeholder="Поиск сотрудника..." className="h-9" />
							<CommandList className="max-h-[300px] overflow-y-auto">
								<CommandEmpty>Сотрудник не найден</CommandEmpty>
								<CommandGroup>
									<CommandItem
										value="unassigned"
										onSelect={() => handleAssigneeChange(null)}
										className="flex items-center gap-2"
									>
										<User className="size-4 text-muted-foreground" />
										<span>Не назначен</span>
										{!task.assigneeId && (
											<CheckCircle2 className="ml-auto size-4 text-muted-foreground" />
										)}
									</CommandItem>
								</CommandGroup>
								<CommandSeparator />
								<CommandGroup heading="Сотрудники">
									{users.map((user) => (
										<CommandItem
											key={user.id}
											value={user.name || user.id}
											onSelect={() => handleAssigneeChange(user.id)}
											className="flex items-center gap-2"
										>
											<Avatar className="size-6">
												<AvatarImage src={user.image || undefined} />
												<AvatarFallback className="text-xs">
													{user.name?.slice(0, 2).toUpperCase() || "??"}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="text-sm">
													{user.name || "Без имени"}
												</span>
												{user.email && (
													<span className="text-muted-foreground text-xs">
														{user.email}
													</span>
												)}
											</div>
											{task.assigneeId === user.id && (
												<CheckCircle2 className="ml-auto size-4 text-muted-foreground" />
											)}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BarChart3 className="mr-2 size-4" /> Приоритет
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{priorities.map((priority) => {
							return (
								<ContextMenuItem
									key={priority._id}
									onClick={() => handlePriorityChange(priority._id)}
									className="flex items-center gap-2"
								>
									<PriorityIcon
										iconName={priority.iconName}
										color={priority.color}
									/>
									<span>{priority.name}</span>
									{task.priorityId === priority._id && (
										<CheckCircle2 className="ml-auto size-3 text-muted-foreground" />
									)}
								</ContextMenuItem>
							);
						})}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Tag className="mr-2 size-4" /> Метки
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{labels.map((label) => (
							<ContextMenuItem
								key={label._id}
								onClick={() => handleLabelToggle(label._id)}
								className="flex items-center gap-2"
							>
								<span
									className="size-3 rounded-full"
									style={{ backgroundColor: label.color }}
								/>
								<span>{label.name}</span>
								{task.labelIds.includes(label._id) && (
									<CheckCircle2 className="ml-auto size-3 text-muted-foreground" />
								)}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem onClick={handleAddComment}>
					<MessageSquare className="mr-2 size-4" />
					Добавить комментарий...
					<ContextMenuShortcut>C</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<CalendarClock className="mr-2 size-4" />
						Срок выполнения
						{task.dueDate && (
							<span className="ml-auto text-muted-foreground text-xs">
								{format(new Date(task.dueDate), "d MMM", { locale: ru })}
							</span>
						)}
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="p-0">
						<div className="p-3">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={handleSetDueDate}
								locale={ru}
							/>
							{selectedDate && (
								<div className="mt-3 flex items-center justify-between border-t pt-3">
									<span className="text-muted-foreground text-sm">
										{format(selectedDate, "d MMMM yyyy", { locale: ru })}
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleSetDueDate(undefined)}
									>
										Удалить срок
									</Button>
								</div>
							)}
						</div>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem onClick={handleRename}>
					<Pencil className="mr-2 size-4" />
					Переименовать...
					<ContextMenuShortcut>R</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuGroup>

			<ContextMenuSeparator />

			<ContextMenuGroup>
				<ContextMenuItem onClick={handleCopyLink}>
					<LinkIcon className="mr-2 size-4" />
					Копировать ссылку
					<ContextMenuShortcut>⌘L</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem onClick={handleCopy}>
					<Clipboard className="mr-2 size-4" />
					Копировать название
					<ContextMenuShortcut>⌘C</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuGroup>

			<ContextMenuSeparator />

			<ContextMenuGroup>
				<ContextMenuItem onClick={handleSubscribe}>
					<Bell className="mr-2 size-4" />
					{isSubscribed ? "Отписаться" : "Подписаться"}
					<ContextMenuShortcut>S</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem onClick={handleFavorite}>
					<Star className="mr-2 size-4" />
					{isFavorite ? "Удалить из избранного" : "В избранное"}
					<ContextMenuShortcut>F</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem onClick={handleRemindMe}>
					<AlarmClock className="mr-2 size-4" />
					Напомнить мне
					<ContextMenuShortcut>H</ContextMenuShortcut>
				</ContextMenuItem>
			</ContextMenuGroup>

			<ContextMenuSeparator />

			<ContextMenuItem
				onClick={handleDelete}
				className="text-destructive focus:text-destructive"
			>
				<Trash2 className="mr-2 size-4" />
				Удалить...
				<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
