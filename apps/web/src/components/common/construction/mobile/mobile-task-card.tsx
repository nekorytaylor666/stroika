"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	ChevronRight,
	Circle,
	Clock,
	XCircle,
} from "lucide-react";
import type { FC } from "react";
import { ConstructionAssigneeUser } from "../construction-assignee-user";
import type { ConstructionTask } from "../construction-tasks";

// Status icon mapping
const StatusIconMap = {
	circle: Circle,
	timer: Clock,
	"alert-circle": AlertCircle,
	"check-circle": CheckCircle,
	"x-circle": XCircle,
};

const StatusIcon: FC<{
	iconName: string;
	color: string;
	className?: string;
}> = ({ iconName, color, className = "h-4 w-4" }) => {
	const IconComponent =
		StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
	return <IconComponent style={{ color }} className={className} />;
};

interface MobileTaskCardProps {
	task: ConstructionTask;
}

export function MobileTaskCard({ task }: MobileTaskCardProps) {
	const { users, priorities, statuses } = useConstructionData();
	const { openTaskDetails } = useConstructionTaskDetailsStore();

	// Find related entities
	const assignee = task.assigneeId
		? users?.find((u) => u._id === task.assigneeId) || null
		: null;
	const priority = task.priorityId
		? priorities?.find((p) => p._id === task.priorityId) || null
		: null;
	const status = task.statusId
		? statuses?.find((s) => s._id === task.statusId) || null
		: null;

	// Calculate days until deadline
	const daysUntilDeadline = task.dueDate
		? differenceInDays(new Date(task.dueDate), new Date())
		: null;
	const isNearDeadline = daysUntilDeadline !== null && daysUntilDeadline <= 1;

	return (
		<div
			className="flex items-center gap-3 border-b bg-background px-4 py-3 transition-colors active:bg-accent/50"
			onClick={() => openTaskDetails(task)}
		>
			{/* Status Icon */}
			{status && (
				<div className="flex-shrink-0">
					<StatusIcon
						iconName={status.iconName}
						color={status.color}
						className="h-5 w-5"
					/>
				</div>
			)}

			{/* Main Content */}
			<div className="min-w-0 flex-1">
				{/* Title and Priority */}
				<div className="flex items-start gap-2">
					<h3 className="line-clamp-2 flex-1 font-medium text-sm">
						{task.title}
					</h3>
					{priority && (
						<div
							className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
							style={{ backgroundColor: priority.color }}
							title={priority.name}
						/>
					)}
				</div>

				{/* Metadata */}
				<div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
					<span className="font-mono">{task.identifier}</span>

					{task.dueDate && (
						<div className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							<span
								className={cn(isNearDeadline && "font-medium text-red-600")}
							>
								{format(new Date(task.dueDate), "d MMM", { locale: ru })}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Right Side */}
			<div className="flex items-center gap-2">
				<ConstructionAssigneeUser user={assignee} size="sm" />
				<ChevronRight className="h-4 w-4 text-muted-foreground" />
			</div>
		</div>
	);
}
