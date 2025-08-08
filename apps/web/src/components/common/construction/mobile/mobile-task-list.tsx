"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Circle,
	CircleDot,
	Clock,
	User,
} from "lucide-react";
import { useMemo } from "react";

const statusIcons = {
	"К выполнению": Circle,
	"В работе": CircleDot,
	"На проверке": Clock,
	Завершено: CheckCircle2,
	Отменено: AlertCircle,
};

const statusColors = {
	"К выполнению": "text-gray-500",
	"В работе": "text-yellow-500",
	"На проверке": "text-blue-500",
	Завершено: "text-green-500",
	Отменено: "text-red-500",
};

const priorityColors = {
	Низкий: "bg-gray-100 text-gray-700",
	Средний: "bg-blue-100 text-blue-700",
	Высокий: "bg-orange-100 text-orange-700",
	Критический: "bg-red-100 text-red-700",
};

interface MobileTaskListProps {
	tasks: any[];
	statuses: any[];
	priorities: any[];
	users: any[];
	projectId?: string;
	searchQuery?: string;
	filters?: {
		status: string[];
		priority: string[];
		assignee: string[];
		labels: string[];
	};
}

export function MobileTaskList({
	tasks,
	statuses,
	priorities,
	users,
	projectId,
	searchQuery = "",
	filters = {
		status: [],
		priority: [],
		assignee: [],
		labels: [],
	},
}: MobileTaskListProps) {
	const { openTaskDetails } = useConstructionTaskDetailsStore();
	const navigate = useNavigate();
	const isMobile = useMobile();
	const params = useParams({ from: "/construction/$orgId" });
	const orgId = params.orgId || "";

	// Filter tasks
	const filteredTasks = useMemo(() => {
		if (!tasks) return [];

		let filtered = tasks;

		// Filter by project if we're in a project view
		if (projectId) {
			filtered = filtered.filter(
				(task) => task.constructionProjectId === projectId,
			);
		}

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(task) =>
					task.title.toLowerCase().includes(query) ||
					task.identifier.toLowerCase().includes(query) ||
					task.description?.toLowerCase().includes(query),
			);
		}

		// Apply other filters
		if (filters.status.length > 0) {
			filtered = filtered.filter((task) =>
				filters.status.includes(task.statusId),
			);
		}

		if (filters.priority.length > 0) {
			filtered = filtered.filter((task) =>
				filters.priority.includes(task.priorityId),
			);
		}

		if (filters.assignee.length > 0) {
			filtered = filtered.filter(
				(task) => task.assigneeId && filters.assignee.includes(task.assigneeId),
			);
		}

		if (filters.labels.length > 0) {
			filtered = filtered.filter((task) =>
				task.labelIds?.some((labelId) => filters.labels.includes(labelId)),
			);
		}

		return filtered;
	}, [tasks, projectId, searchQuery, filters]);

	// Group tasks by status
	const groupedTasks = useMemo(() => {
		if (!statuses) return {};

		const groups: Record<string, typeof filteredTasks> = {};

		for (const status of statuses) {
			groups[status._id] = filteredTasks.filter(
				(task) => task.statusId === status._id,
			);
		}

		return groups;
	}, [filteredTasks, statuses]);

	if (!tasks || !statuses || !priorities || !users) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<div className="animate-pulse">
						<div className="mb-2 h-8 w-32 rounded bg-muted" />
						<div className="h-4 w-48 rounded bg-muted" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Status sections */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				{statuses.map((status) => {
					const statusTasks = groupedTasks[status._id] || [];
					const StatusIcon =
						statusIcons[status.name as keyof typeof statusIcons] || Circle;

					if (statusTasks.length === 0) return null;

					return (
						<div key={status._id} className="mb-6">
							<div className="mb-3 flex items-center gap-2">
								<StatusIcon
									className={cn(
										"h-4 w-4",
										statusColors[status.name as keyof typeof statusColors],
									)}
								/>
								<h3 className="font-medium text-sm">{status.name}</h3>
								<span className="text-muted-foreground text-xs">
									{statusTasks.length}
								</span>
							</div>

							<div className="space-y-2">
								{statusTasks.map((task) => {
									const priority = priorities.find(
										(p) => p._id === task.priorityId,
									);
									const assignee = task.assigneeId
										? users.find((u) => u._id === task.assigneeId)
										: null;

									return (
										<Card
											key={task._id}
											className="cursor-pointer p-3 transition-all hover:shadow-md active:scale-[0.98]"
											onClick={() => {
												if (isMobile && orgId) {
													navigate({
														to: "/construction/$orgId/tasks/$taskId",
														params: { orgId, taskId: task.identifier },
													});
												} else {
													openTaskDetails(task);
												}
											}}
										>
											<div className="space-y-2">
												{/* Header */}
												<div className="flex items-start justify-between gap-2">
													<div className="flex-1 space-y-1">
														<div className="flex items-center gap-2">
															<span className="font-medium text-muted-foreground text-xs">
																{task.identifier}
															</span>
															{priority && (
																<Badge
																	variant="secondary"
																	className={cn(
																		"px-1.5 py-0 text-xs",
																		priorityColors[
																			priority.name as keyof typeof priorityColors
																		],
																	)}
																>
																	{priority.name}
																</Badge>
															)}
														</div>
														<h4 className="line-clamp-2 font-medium text-sm">
															{task.title}
														</h4>
													</div>
												</div>

												{/* Footer */}
												<div className="flex items-center justify-between text-muted-foreground text-xs">
													<div className="flex items-center gap-3">
														{assignee && (
															<div className="flex items-center gap-1">
																<User className="h-3 w-3" />
																<span>{assignee.name}</span>
															</div>
														)}
														{task.dueDate && (
															<div className="flex items-center gap-1">
																<Calendar className="h-3 w-3" />
																<span>
																	{format(new Date(task.dueDate), "d MMM", {
																		locale: ru,
																	})}
																</span>
															</div>
														)}
													</div>
													{task.subtaskCount && task.subtaskCount > 0 && (
														<span className="text-muted-foreground">
															{task.subtaskCount} подзадач
														</span>
													)}
												</div>
											</div>
										</Card>
									);
								})}
							</div>
						</div>
					);
				})}

				{filteredTasks.length === 0 && (
					<div className="flex h-64 items-center justify-center">
						<div className="text-center text-muted-foreground">
							<p className="text-sm">Задачи не найдены</p>
							{searchQuery && (
								<p className="mt-1 text-xs">
									Попробуйте изменить поисковый запрос
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
