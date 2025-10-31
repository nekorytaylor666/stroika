"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
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
	ArrowUpRight,
	Calendar,
	CheckCircle2,
	Circle,
	ListTree,
	TrendingUp,
	User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConstructionAssigneeUser } from "./construction-assignee-user";
import { ConstructionStatusSelector } from "./construction-status-selector";

interface ParentTaskDisplayProps {
	parentTaskId: string;
}

export function ParentTaskDisplay({ parentTaskId }: ParentTaskDisplayProps) {
	const { openTaskDetails } = useConstructionTaskDetailsStore();
	const { users } = useConstructionData();
	const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

	// Mutations
	const updateTask = useMutation(api.constructionTasks.update);

	// Fetch parent task
	const parentTask = useQuery(api.constructionTasks.getById, {
		id: parentTaskId as Id<"issues">,
	});

	// Fetch subtasks and progress
	const subtasks = useQuery(api.subtasks.getSubtasks, {
		taskId: parentTaskId as Id<"issues">,
	});

	const taskProgress = useQuery(api.subtasks.getTaskProgress, {
		taskId: parentTaskId as Id<"issues">,
	});

	// Calculate planned vs finished for the mini chart
	const chartData = useMemo(() => {
		if (!subtasks) return { planned: 0, finished: 0 };

		const total = subtasks.length;
		const finished = subtasks.filter(
			(task) =>
				task.status?.name === "завершено" || task.status?.name === "Done",
		).length;

		return {
			planned: total,
			finished,
			inProgress: total - finished,
		};
	}, [subtasks]);

	const currentUser = useCurrentUser();
	const handleAssigneeChange = async (userId: string) => {
		if (!parentTask) return;

		try {
			await updateTask({
				id: parentTask._id as Id<"issues">,
				assigneeId: userId ? (userId as Id<"user">) : undefined,
				userId: currentUser?._id as Id<"user">,
			});
			toast.success(userId ? "Исполнитель обновлен" : "Исполнитель удален");
		} catch (error) {
			console.error("Failed to update assignee:", error);
			toast.error("Ошибка при обновлении исполнителя");
		}
	};

	if (!parentTask) return null;

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<ListTree className="h-4 w-4 text-muted-foreground" />
				<span className="font-medium text-sm">Родительская задача</span>
			</div>

			<div className="rounded-lg border bg-muted/30 p-4">
				<div className="space-y-3">
					{/* Parent task info */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex-1 space-y-1">
							<button
								onClick={() => openTaskDetails(parentTask as any)}
								className="group flex items-center gap-2 text-left"
							>
								<span className="font-medium text-sm hover:underline">
									{parentTask.title}
								</span>
								<ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
							</button>
							<div className="flex items-center gap-3 text-muted-foreground text-xs">
								<span>{parentTask.identifier}</span>
								{parentTask.dueDate && (
									<div className="flex items-center gap-1">
										<Calendar className="h-3 w-3" />
										<span>
											{format(new Date(parentTask.dueDate), "d MMM", {
												locale: ru,
											})}
										</span>
									</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="rounded-md ring-1 ring-transparent transition-all hover:ring-border">
											<ConstructionStatusSelector
												statusId={parentTask.statusId}
												issueId={parentTask._id}
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="text-xs">
										Изменить статус
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							{/* Assignee selector */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div>
											<Popover
												open={isAssigneeOpen}
												onOpenChange={setIsAssigneeOpen}
											>
												<PopoverTrigger asChild>
													{parentTask.assignee ? (
														<div className="cursor-pointer rounded-full ring-1 ring-transparent transition-all hover:ring-border">
															<ConstructionAssigneeUser
																user={parentTask.assignee}
															/>
														</div>
													) : (
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 rounded-full ring-1 ring-transparent transition-all hover:ring-border"
														>
															<User className="h-4 w-4 text-muted-foreground" />
														</Button>
													)}
												</PopoverTrigger>
												<PopoverContent className="w-56 p-0" align="end">
													<div className="max-h-64 overflow-y-auto">
														<div className="p-2 font-medium text-muted-foreground text-xs">
															Назначить исполнителя
														</div>
														{users?.map((user) => (
															<button
																key={user.id}
																className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
																onClick={() => {
																	handleAssigneeChange(user.id);
																	setIsAssigneeOpen(false);
																}}
															>
																<ConstructionAssigneeUser user={user} />
																<span className="truncate">{user.name}</span>
																{parentTask.assignee?.id === user.id && (
																	<CheckCircle2 className="ml-auto h-3 w-3 text-primary" />
																)}
															</button>
														))}
														{parentTask.assignee && (
															<>
																<div className="my-1 border-t" />
																<button
																	className="flex w-full items-center gap-2 px-3 py-2 text-muted-foreground text-sm hover:bg-muted"
																	onClick={() => {
																		handleAssigneeChange("");
																		setIsAssigneeOpen(false);
																	}}
																>
																	<User className="h-4 w-4" />
																	<span>Убрать исполнителя</span>
																</button>
															</>
														)}
													</div>
												</PopoverContent>
											</Popover>
										</div>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="text-xs">
										Изменить исполнителя
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>

					{/* Progress bar and stats */}
					{taskProgress && taskProgress.total > 0 && (
						<div className="space-y-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Прогресс</span>
								<span className="font-medium">{taskProgress.percentage}%</span>
							</div>
							<Progress value={taskProgress.percentage} className="h-2" />
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>
									{taskProgress.completed} из {taskProgress.total} выполнено
								</span>
							</div>
						</div>
					)}

					{/* Task statistics */}
					{chartData.planned > 0 && (
						<div className="flex gap-3 rounded-md bg-background/50 p-3 text-xs">
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<Circle className="h-3 w-3 text-blue-500" />
									<span className="text-muted-foreground">Всего подзадач</span>
								</div>
								<div className="font-semibold text-lg">{chartData.planned}</div>
							</div>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-3 w-3 text-green-500" />
									<span className="text-muted-foreground">Выполнено</span>
								</div>
								<div className="font-semibold text-lg">
									{chartData.finished}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
