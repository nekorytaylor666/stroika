"use client";

import { type ConstructionTask } from "./construction-tasks";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Calendar, User, Hash, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@stroika/backend";

// Priority color mapping
const priorityColors = {
	urgent: "text-red-500 bg-red-50 dark:bg-red-950",
	high: "text-orange-500 bg-orange-50 dark:bg-orange-950",
	normal: "text-blue-500 bg-blue-50 dark:bg-blue-950",
	low: "text-gray-500 bg-gray-50 dark:bg-gray-950",
};

interface ConstructionKanbanCardProps {
	task: ConstructionTask;
}

export function ConstructionKanbanCard({ task }: ConstructionKanbanCardProps) {
	// Fetch related data
	const assignee = useQuery(
		api.users.get,
		task.assigneeId ? { userId: task.assigneeId } : "skip",
	);
	const priority = useQuery(api.metadata.getPriorityById, {
		id: task.priorityId,
	});
	const labels = useQuery(
		api.labels.getByIds,
		task.labelIds.length > 0 ? { ids: task.labelIds } : "skip",
	);

	return (
		<div className="flex flex-col gap-2">
			{/* Task Identifier and Title */}
			<div className="flex items-start gap-2">
				<span className="text-muted-foreground text-xs font-medium">
					<Hash className="inline h-3 w-3" />
					{task.identifier}
				</span>
			</div>
			<h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

			{/* Labels */}
			{labels && labels.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{labels.slice(0, 2).map((label) => (
						<Badge
							key={label._id}
							variant="secondary"
							className="h-5 px-1.5 text-xs"
							style={{
								backgroundColor: `${label.color}20`,
								color: label.color,
								borderColor: label.color,
							}}
						>
							{label.name}
						</Badge>
					))}
					{labels.length > 2 && (
						<Badge variant="secondary" className="h-5 px-1.5 text-xs">
							+{labels.length - 2}
						</Badge>
					)}
				</div>
			)}

			{/* Footer with metadata */}
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<div className="flex items-center gap-3">
					{/* Priority */}
					{priority && (
						<div
							className={cn(
								"flex items-center gap-0.5 px-1.5 py-0.5 rounded",
								priorityColors[priority.name.toLowerCase() as keyof typeof priorityColors] ||
									"text-gray-500 bg-gray-50",
							)}
						>
							<span className="font-medium capitalize">{priority.name}</span>
						</div>
					)}

					{/* Due Date */}
					{task.dueDate && (
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span>
								{format(new Date(task.dueDate), "d MMM", { locale: ru })}
							</span>
						</div>
					)}

					{/* Attachments */}
					{task.attachments && task.attachments.length > 0 && (
						<div className="flex items-center gap-1">
							<Paperclip className="h-3 w-3" />
							<span>{task.attachments.length}</span>
						</div>
					)}
				</div>

				{/* Assignee */}
				{assignee && (
					<Avatar className="h-5 w-5">
						<AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
						<AvatarFallback className="text-xs">
							{assignee.name
								.split(" ")
								.map((n) => n[0])
								.join("")
								.toUpperCase()}
						</AvatarFallback>
					</Avatar>
				)}
			</div>

			{/* Subtasks indicator */}
			{task.subtaskCount && task.subtaskCount > 0 && (
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					<div className="h-1 w-full rounded-full bg-muted">
						<div
							className="h-1 rounded-full bg-primary"
							style={{ width: "30%" }} // You can calculate actual progress here
						/>
					</div>
					<span>{task.subtaskCount}</span>
				</div>
			)}
		</div>
	);
}

// Export a simpler version for list view (reusing existing ConstructionIssueLine)
export { ConstructionIssueLine as ConstructionListCard } from "./construction-issue-line";