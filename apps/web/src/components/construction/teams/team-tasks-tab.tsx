"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@backend/convex/_generated/dataModel";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	FolderOpen,
	Search,
	User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface TeamTasksTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamTasksTab({ teamId }: TeamTasksTabProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch team tasks
	const tasks = useQuery(api.constructionTasks.getTeamTasks, { teamId });

	// Filter tasks
	const filteredTasks = tasks?.filter((task) =>
		task.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Group tasks by status
	const tasksByStatus = {
		todo: filteredTasks?.filter((t) => t.status?.key === "todo") || [],
		in_progress:
			filteredTasks?.filter((t) => t.status?.key === "in_progress") || [],
		done: filteredTasks?.filter((t) => t.status?.key === "done") || [],
	};

	const getStatusIcon = (statusKey: string) => {
		switch (statusKey) {
			case "todo":
				return <Clock className="h-4 w-4" />;
			case "in_progress":
				return <AlertCircle className="h-4 w-4" />;
			case "done":
				return <CheckCircle2 className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const getPriorityColor = (priorityKey: string) => {
		switch (priorityKey) {
			case "urgent":
				return "destructive";
			case "high":
				return "default";
			case "medium":
				return "secondary";
			case "low":
				return "outline";
			default:
				return "secondary";
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b p-6">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-medium text-lg">Задачи команды</h3>
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<span>Всего: {tasks?.length || 0}</span>
					</div>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск задач..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Stats */}
				<div className="mt-4 grid grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-2xl">
										{tasksByStatus.todo.length}
									</p>
									<p className="text-muted-foreground text-sm">К выполнению</p>
								</div>
								<Clock className="h-8 w-8 text-muted-foreground/20" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-2xl text-orange-500">
										{tasksByStatus.in_progress.length}
									</p>
									<p className="text-muted-foreground text-sm">В работе</p>
								</div>
								<AlertCircle className="h-8 w-8 text-orange-500/20" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-2xl text-green-500">
										{tasksByStatus.done.length}
									</p>
									<p className="text-muted-foreground text-sm">Выполнено</p>
								</div>
								<CheckCircle2 className="h-8 w-8 text-green-500/20" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Tasks List */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					{!tasks ? (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-24" />
							))}
						</div>
					) : filteredTasks?.length === 0 ? (
						<div className="py-12 text-center">
							<FolderOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">
								{searchQuery ? "Задачи не найдены" : "У команды пока нет задач"}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{filteredTasks.map((task, index) => (
								<motion.div
									key={task._id}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
								>
									<Card className="transition-shadow hover:shadow-md">
										<CardContent className="p-4">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1 space-y-2">
													<div className="flex items-start gap-3">
														<div
															className={`rounded p-1 ${
																task.status?.name.toLowerCase() === "done" ||
																task.status?.name.toLowerCase() ===
																	"completed" ||
																task.status?.name.toLowerCase() === "выполнено"
																	? "bg-green-500/10 text-green-500"
																	: task.status?.name.toLowerCase() ===
																				"in progress" ||
																			task.status?.name.toLowerCase() ===
																				"в работе"
																		? "bg-orange-500/10 text-orange-500"
																		: "bg-muted"
															}`}
														>
															{getStatusIcon(task.status?.name)}
														</div>
														<div className="flex-1">
															<h4 className="font-medium">{task.title}</h4>
															{task.description && (
																<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
																	{task.description}
																</p>
															)}
														</div>
													</div>

													<div className="flex items-center gap-4 text-sm">
														{task.assignee && (
															<div className="flex items-center gap-1">
																<User className="h-3 w-3" />
																<span>{task.assignee.name}</span>
															</div>
														)}
														{task.project && (
															<div className="flex items-center gap-1">
																<FolderOpen className="h-3 w-3" />
																<span>{task.project.name}</span>
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
												</div>

												<div className="flex flex-col items-end gap-2">
													<Badge
														variant={getPriorityColor(task.priority?.level)}
														className="text-xs"
													>
														{task.priority?.name}
													</Badge>
													<Badge variant="outline" className="text-xs">
														{task.status?.name}
													</Badge>
												</div>
											</div>

											{/* Progress */}
											{task.progress !== undefined && (
												<div className="mt-3">
													<div className="mb-1 flex items-center justify-between text-sm">
														<span className="text-muted-foreground">
															Прогресс
														</span>
														<span>{task.progress}%</span>
													</div>
													<Progress value={task.progress} className="h-2" />
												</div>
											)}
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
