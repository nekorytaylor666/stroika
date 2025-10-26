"use client";

import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { ListTree } from "lucide-react";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionContextMenu } from "./construction-context-menu";
import { ConstructionLabelBadge } from "./construction-label-badge";
import { ConstructionPrioritySelector } from "./construction-priority-selector";
import { ConstructionProjectBadge } from "./construction-project-badge";
import { ConstructionStatusSelector } from "./construction-status-selector";
import type { ConstructionTask } from "./construction-tasks";
import type { UserWithRole } from "better-auth/plugins";

interface ConstructionIssueLineProps {
	issue: ConstructionTask;
	layoutId?: boolean;
}

export function ConstructionIssueLine({
	issue,
	layoutId = false,
}: ConstructionIssueLineProps) {
	const { users, labels, priorities, projects, isLoading } =
		useConstructionData();
	const { openTaskDetails } = useConstructionTaskDetailsStore();

	// Don't render if data is still loading
	if (isLoading || !users || !labels || !priorities) {
		return (
			<div className="flex h-12 w-full items-center justify-start border-border/40 border-b px-0 py-1">
				<div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
				<div className="ml-4 h-4 flex-1 animate-pulse rounded bg-muted"></div>
				<div className="ml-auto h-6 w-6 animate-pulse rounded-full bg-muted"></div>
			</div>
		);
	}

	const handleClick = (e: React.MouseEvent) => {
		// Don't open details if clicking on interactive elements
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest('[role="combobox"]')) {
			return;
		}
		openTaskDetails(issue);
	};

	// Find related entities with null checks
	const assignee =
		issue.assigneeId && users
			? users.find((u: UserWithRole) => u.id === issue.assigneeId) || null
			: null;
	const taskLabels =
		issue.labelIds && labels
			? issue.labelIds
					.map((id) => labels.find((l) => l._id === id))
					.filter(Boolean)
			: [];
	const priority =
		issue.priorityId && priorities
			? priorities.find((p) => p._id === issue.priorityId) || null
			: null;
	const project =
		issue.projectId && projects
			? projects.find((p) => p._id === issue.projectId) || null
			: null;

	// Calculate days until deadline
	const daysUntilDeadline = issue.dueDate
		? differenceInDays(new Date(issue.dueDate), new Date())
		: null;
	const isNearDeadline = daysUntilDeadline !== null && daysUntilDeadline <= 1;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className="flex h-12 w-full cursor-pointer items-center justify-start border-border/40 border-b px-2 py-1 transition-all duration-150 hover:rounded-md hover:bg-sidebar/50"
					onClick={handleClick}
				>
					<div className="flex items-center gap-2">
						{priority && (
							<ConstructionPrioritySelector
								priority={priority}
								issueId={issue._id}
							/>
						)}
						<span className="w-[80px] shrink-0 truncate font-medium text-muted-foreground text-sm">
							{issue.identifier}
						</span>
						<ConstructionStatusSelector
							statusId={issue.statusId}
							issueId={issue._id}
						/>
					</div>
					<div className="ml-2 flex min-w-0 flex-1 items-center gap-3">
						<span className="truncate font-medium text-sm">{issue.title}</span>
						{issue.subtaskCount !== undefined && issue.subtaskCount > 0 && (
							<span className="flex items-center gap-1 text-muted-foreground text-xs">
								<ListTree className="h-3 w-3" />
								<span>{issue.subtaskCount}</span>
							</span>
						)}
					</div>
					<div className="ml-auto flex items-center justify-end gap-3">
						<div className="flex items-center gap-2">
							{taskLabels.length > 0 && (
								<ConstructionLabelBadge labels={taskLabels as any} />
							)}
							{project && <ConstructionProjectBadge project={project} />}
						</div>
						<div className="flex items-center gap-2">
							{issue.dueDate && (
								<span
									className={cn(
										"shrink-0 text-xs",
										isNearDeadline
											? "font-semibold text-red-600"
											: "text-muted-foreground",
									)}
								>
									{format(new Date(issue.dueDate), "d MMM", { locale: ru })}
								</span>
							)}
							<span className="shrink-0 text-muted-foreground text-xs">
								{format(new Date(issue.createdAt), "MMM dd", { locale: ru })}
							</span>
						</div>
						<ConstructionAssigneeUser user={assignee || null} />
					</div>
				</div>
			</ContextMenuTrigger>
			<ConstructionContextMenu task={issue} />
		</ContextMenu>
	);
}
