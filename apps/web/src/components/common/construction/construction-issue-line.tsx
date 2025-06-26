"use client";

import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { IssueContextMenu } from "../issues/issue-context-menu";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionLabelBadge } from "./construction-label-badge";
import { ConstructionPrioritySelector } from "./construction-priority-selector";
import { ConstructionProjectBadge } from "./construction-project-badge";
import { ConstructionStatusSelector } from "./construction-status-selector";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionIssueLineProps {
	issue: ConstructionTask;
	layoutId?: boolean;
}

export function ConstructionIssueLine({
	issue,
	layoutId = false,
}: ConstructionIssueLineProps) {
	const { users, labels, priorities, projects } = useConstructionData();
	const { openTaskDetails } = useConstructionTaskDetailsStore();
	const [isStatusChanging, setIsStatusChanging] = useState(false);
	const [prevStatusId, setPrevStatusId] = useState(issue.statusId);

	// Detect status changes for animation
	useEffect(() => {
		if (issue.statusId !== prevStatusId) {
			setIsStatusChanging(true);
			setPrevStatusId(issue.statusId);

			// Reset animation state after animation completes
			const timer = setTimeout(() => {
				setIsStatusChanging(false);
			}, 600);

			return () => clearTimeout(timer);
		}
	}, [issue.statusId, prevStatusId]);

	const handleClick = (e: React.MouseEvent) => {
		// Don't open details if clicking on interactive elements
		const target = e.target as HTMLElement;
		if (target.closest("button") || target.closest('[role="combobox"]')) {
			return;
		}
		openTaskDetails(issue);
	};

	// Find related entities
	const assignee = issue.assigneeId
		? users?.find((u) => u._id === issue.assigneeId)
		: null;
	const taskLabels = issue.labelIds
		.map((id) => labels?.find((l) => l._id === id))
		.filter(Boolean);
	const priority = priorities?.find((p) => p._id === issue.priorityId);
	const project = issue.projectId
		? projects?.find((p) => p._id === issue.projectId)
		: null;

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<motion.div
					{...(layoutId && { layoutId: `issue-line-${issue.identifier}` })}
					className="w-full"
					initial={false}
					animate={
						isStatusChanging
							? {
									scale: [1, 1.02, 1],
									backgroundColor: [
										"transparent",
										"rgba(59, 130, 246, 0.1)",
										"transparent",
									],
								}
							: {}
					}
					transition={{
						duration: 0.6,
						ease: "easeInOut",
					}}
				>
					<div
						className="flex h-11 w-full cursor-pointer items-center justify-start px-6 hover:bg-sidebar/50"
						onClick={handleClick}
					>
						<div className="flex items-center gap-0.5">
							{priority && (
								<ConstructionPrioritySelector
									priority={priority}
									issueId={issue._id}
								/>
							)}
							<span className="mr-0.5 hidden w-[66px] shrink-0 truncate font-medium text-muted-foreground text-sm sm:inline-block">
								{issue.identifier}
							</span>
							<AnimatePresence mode="wait">
								<motion.div
									key={issue.statusId}
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.8, opacity: 0 }}
									transition={{ duration: 0.2 }}
								>
									<ConstructionStatusSelector
										statusId={issue.statusId}
										issueId={issue._id}
									/>
								</motion.div>
							</AnimatePresence>
						</div>
						<span className="mr-1 ml-0.5 flex min-w-0 items-center justify-start">
							<span className="truncate font-medium text-xs sm:font-semibold sm:text-sm">
								{issue.title}
							</span>
						</span>
						<div className="ml-auto flex items-center justify-end gap-2 sm:w-fit">
							<div className="w-3 shrink-0"></div>
							<div className="-space-x-5 hidden items-center justify-end transition-all duration-200 hover:space-x-1 sm:flex lg:space-x-1">
								{taskLabels.length > 0 && (
									<ConstructionLabelBadge labels={taskLabels as any} />
								)}
								{project && <ConstructionProjectBadge project={project} />}
							</div>
							<span className="hidden shrink-0 text-muted-foreground text-xs sm:inline-block">
								{format(new Date(issue.createdAt), "MMM dd")}
							</span>
							<ConstructionAssigneeUser user={assignee} />
						</div>
					</div>
				</motion.div>
			</ContextMenuTrigger>
			{/* <IssueContextMenu issueId={issue._id} /> */}
		</ContextMenu>
	);
}
