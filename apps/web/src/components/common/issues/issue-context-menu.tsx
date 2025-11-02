import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useIssuesStore } from "@/store/issues-store";
import { type Id, api } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	AlarmClock,
	ArrowRightLeft,
	BarChart3,
	Bell,
	CalendarClock,
	CheckCircle2,
	CircleCheck,
	Clipboard,
	Clock,
	Copy as CopyIcon,
	FileText,
	Flag,
	Folder,
	Link as LinkIcon,
	MessageSquare,
	Pencil,
	PlusSquare,
	Repeat2,
	Star,
	Tag,
	Trash2,
	User,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface IssueContextMenuProps {
	issueId?: string;
}

export function IssueContextMenu({ issueId }: IssueContextMenuProps) {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);

	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const users = useQuery(api.users.getAll);
	const labels = useQuery(api.metadata.getAllLabels);
	const projects = useQuery(api.constructionProjects.getAll);
	const updateStatus = useMutation(api.issues.updateStatus);
	const updateAssignee = useMutation(api.constructionTasks.updateAssignee);
	const updatePriority = useMutation(api.constructionTasks.updatePriority);
	const updateLabel = useMutation(api.constructionTasks.addLabel);
	const updateProject = useMutation(api.constructionTasks.updateProject);

	const handleAddLink = () => {
		toast.success("Link added");
	};

	const handleMakeCopy = () => {
		toast.success("Issue copied");
	};

	const handleCreateRelated = () => {
		toast.success("Related issue created");
	};

	const handleMarkAs = (type: string) => {
		toast.success(`Marked as ${type}`);
	};

	const handleMove = () => {
		toast.success("Issue moved");
	};

	const handleSubscribe = () => {
		setIsSubscribed(!isSubscribed);
		toast.success(
			isSubscribed ? "Unsubscribed from issue" : "Subscribed to issue",
		);
	};

	const handleFavorite = () => {
		setIsFavorite(!isFavorite);
		toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
	};

	const handleCopy = () => {
		if (!issueId) return;
		const issue = issues.find((i) => i.id === issueId);
		if (issue) {
			navigator.clipboard.writeText(issue.title);
			toast.success("Copied to clipboard");
		}
	};

	const handleStatusChange = (statusId: Id<"status">) => {
		toast.success(`Status changed to ${statusId}`);
	};
	const handleAssigneeChange = async (assigneeId: string | null) => {
		toast.success(`Assignee changed to ${assigneeId}`);
		console.log("assigneeId", assigneeId);
		try {
			await updateAssignee({
				id: issueId,
				assigneeId: assigneeId || undefined,
			});
		} catch (error) {
			toast.error(`Failed to update assignee: ${error}`);
		}
	};
	const handlePriorityChange = (priorityId: Id<"priorities">) => {
		toast.success(`Priority changed to ${priorityId}`);
	};
	const handleLabelToggle = (labelId: Id<"labels">) => {
		toast.success(`Label toggled to ${labelId}`);
	};

	const handleRemindMe = () => {
		toast.success("Reminder set");
	};

	const isLoading = !statuses || !priorities || !users || !labels || !projects;

	if (isLoading) return <div>Загрузка...</div>;

	return (
		<ContextMenuContent className="w-64">
			<ContextMenuGroup>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<CircleCheck className="mr-2 size-4" /> Статус
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{statuses.map((s) => {
							const Icon = s.icon;
							return (
								<ContextMenuItem
									key={s.id}
									onClick={() => handleStatusChange(s.id)}
								>
									<Icon /> {s.name}
								</ContextMenuItem>
							);
						})}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<User className="mr-2 size-4" /> Ответственный
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem onClick={() => handleAssigneeChange(null)}>
							<User className="size-4" /> Не назначен
						</ContextMenuItem>
						{users.map((user) => (
							<ContextMenuItem
								key={user.id}
								onClick={() => handleAssigneeChange(user.id)}
							>
								<Avatar className="size-4">
									<AvatarImage src={user.image} alt={user.name} />
									<AvatarFallback>{user.name[0]}</AvatarFallback>
								</Avatar>
								{user.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BarChart3 className="mr-2 size-4" /> Приоритет
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{priorities.map((priority) => (
							<ContextMenuItem
								key={priority.id}
								onClick={() => handlePriorityChange(priority.id)}
							>
								<priority.icon className="size-4" /> {priority.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Tag className="mr-2 size-4" /> Метки
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{labels.map((label) => (
							<ContextMenuItem
								key={label.id}
								onClick={() => handleLabelToggle(label.id)}
							>
								<span
									className="inline-block size-3 rounded-full"
									style={{ backgroundColor: label.color }}
									aria-hidden="true"
								/>
								{label.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Folder className="mr-2 size-4" /> Проект
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-64">
						<ContextMenuItem onClick={() => handleProjectChange(null)}>
							<Folder className="size-4" /> Нет проекта
						</ContextMenuItem>
						{projects.slice(0, 5).map((project) => (
							<ContextMenuItem
								key={project.id}
								onClick={() => handleProjectChange(project.id)}
							>
								<project.icon className="size-4" /> {project.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem onClick={handleSetDueDate}>
					<CalendarClock className="size-4" /> Установить срок...
					<ContextMenuShortcut>D</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem>
					<Pencil className="size-4" /> Переименовать...
					<ContextMenuShortcut>R</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleAddLink}>
					<LinkIcon className="size-4" /> Добавить ссылку...
					<ContextMenuShortcut>Ctrl L</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Repeat2 className="mr-2 size-4" /> Преобразовать в
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem>
							<FileText className="size-4" /> Документ
						</ContextMenuItem>
						<ContextMenuItem>
							<MessageSquare className="size-4" /> Комментарий
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem onClick={handleMakeCopy}>
					<CopyIcon className="size-4" /> Создать копию...
				</ContextMenuItem>
			</ContextMenuGroup>

			<ContextMenuSeparator />

			<ContextMenuItem onClick={handleCreateRelated}>
				<PlusSquare className="size-4" /> Создать связанную
			</ContextMenuItem>

			<ContextMenuSub>
				<ContextMenuSubTrigger>
					<Flag className="mr-2 size-4" /> Отметить как
				</ContextMenuSubTrigger>
				<ContextMenuSubContent className="w-48">
					<ContextMenuItem onClick={() => handleMarkAs("Completed")}>
						<CheckCircle2 className="size-4" /> Завершено
					</ContextMenuItem>
					<ContextMenuItem onClick={() => handleMarkAs("Duplicate")}>
						<CopyIcon className="size-4" /> Дубликат
					</ContextMenuItem>
					<ContextMenuItem onClick={() => handleMarkAs("Won't Fix")}>
						<Clock className="size-4" /> Не будет исправлено
					</ContextMenuItem>
				</ContextMenuSubContent>
			</ContextMenuSub>

			<ContextMenuItem onClick={handleMove}>
				<ArrowRightLeft className="size-4" /> Переместить
			</ContextMenuItem>

			<ContextMenuSeparator />

			<ContextMenuItem onClick={handleSubscribe}>
				<Bell className="size-4" />{" "}
				{isSubscribed ? "Отписаться" : "Подписаться"}
				<ContextMenuShortcut>S</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuItem onClick={handleFavorite}>
				<Star className="size-4" />{" "}
				{isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
				<ContextMenuShortcut>F</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuItem onClick={handleCopy}>
				<Clipboard className="size-4" /> Копировать
			</ContextMenuItem>

			<ContextMenuItem onClick={handleRemindMe}>
				<AlarmClock className="size-4" /> Напомнить
				<ContextMenuShortcut>H</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuSeparator />

			<ContextMenuItem variant="destructive">
				<Trash2 className="size-4" /> Удалить...
				<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
