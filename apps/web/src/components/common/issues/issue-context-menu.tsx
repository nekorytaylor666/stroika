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
import { api } from "@stroika/backend";
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
		const issue = getIssueById(issueId);
		if (issue) {
			navigator.clipboard.writeText(issue.title);
			toast.success("Copied to clipboard");
		}
	};

	const handleRemindMe = () => {
		toast.success("Reminder set");
	};

	const isLoading = !statuses || !priorities || !users || !labels || !projects;

	if (isLoading) return <div>Loading...</div>;

	return (
		<ContextMenuContent className="w-64">
			<ContextMenuGroup>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<CircleCheck className="mr-2 size-4" /> Status
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
						<User className="mr-2 size-4" /> Assignee
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem onClick={() => handleAssigneeChange(null)}>
							<User className="size-4" /> Unassigned
						</ContextMenuItem>
						{users
							.filter((user) => user.teamIds.includes("CORE"))
							.map((user) => (
								<ContextMenuItem
									key={user.id}
									onClick={() => handleAssigneeChange(user.id)}
								>
									<Avatar className="size-4">
										<AvatarImage src={user.avatarUrl} alt={user.name} />
										<AvatarFallback>{user.name[0]}</AvatarFallback>
									</Avatar>
									{user.name}
								</ContextMenuItem>
							))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<BarChart3 className="mr-2 size-4" /> Priority
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
						<Tag className="mr-2 size-4" /> Labels
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
						<Folder className="mr-2 size-4" /> Project
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-64">
						<ContextMenuItem onClick={() => handleProjectChange(null)}>
							<Folder className="size-4" /> No Project
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
					<CalendarClock className="size-4" /> Set due date...
					<ContextMenuShortcut>D</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuItem>
					<Pencil className="size-4" /> Rename...
					<ContextMenuShortcut>R</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSeparator />

				<ContextMenuItem onClick={handleAddLink}>
					<LinkIcon className="size-4" /> Add link...
					<ContextMenuShortcut>Ctrl L</ContextMenuShortcut>
				</ContextMenuItem>

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Repeat2 className="mr-2 size-4" /> Convert into
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem>
							<FileText className="size-4" /> Document
						</ContextMenuItem>
						<ContextMenuItem>
							<MessageSquare className="size-4" /> Comment
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem onClick={handleMakeCopy}>
					<CopyIcon className="size-4" /> Make a copy...
				</ContextMenuItem>
			</ContextMenuGroup>

			<ContextMenuSeparator />

			<ContextMenuItem onClick={handleCreateRelated}>
				<PlusSquare className="size-4" /> Create related
			</ContextMenuItem>

			<ContextMenuSub>
				<ContextMenuSubTrigger>
					<Flag className="mr-2 size-4" /> Mark as
				</ContextMenuSubTrigger>
				<ContextMenuSubContent className="w-48">
					<ContextMenuItem onClick={() => handleMarkAs("Completed")}>
						<CheckCircle2 className="size-4" /> Completed
					</ContextMenuItem>
					<ContextMenuItem onClick={() => handleMarkAs("Duplicate")}>
						<CopyIcon className="size-4" /> Duplicate
					</ContextMenuItem>
					<ContextMenuItem onClick={() => handleMarkAs("Won't Fix")}>
						<Clock className="size-4" /> Won&apos;t Fix
					</ContextMenuItem>
				</ContextMenuSubContent>
			</ContextMenuSub>

			<ContextMenuItem onClick={handleMove}>
				<ArrowRightLeft className="size-4" /> Move
			</ContextMenuItem>

			<ContextMenuSeparator />

			<ContextMenuItem onClick={handleSubscribe}>
				<Bell className="size-4" /> {isSubscribed ? "Unsubscribe" : "Subscribe"}
				<ContextMenuShortcut>S</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuItem onClick={handleFavorite}>
				<Star className="size-4" /> {isFavorite ? "Unfavorite" : "Favorite"}
				<ContextMenuShortcut>F</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuItem onClick={handleCopy}>
				<Clipboard className="size-4" /> Copy
			</ContextMenuItem>

			<ContextMenuItem onClick={handleRemindMe}>
				<AlarmClock className="size-4" /> Remind me
				<ContextMenuShortcut>H</ContextMenuShortcut>
			</ContextMenuItem>

			<ContextMenuSeparator />

			<ContextMenuItem variant="destructive">
				<Trash2 className="size-4" /> Delete...
				<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
			</ContextMenuItem>
		</ContextMenuContent>
	);
}
