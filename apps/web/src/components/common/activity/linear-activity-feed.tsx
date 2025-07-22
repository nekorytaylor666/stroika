"use client";

import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	Loader2,
	MessageSquare,
	Minus,
	Plus,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { ScrollArea } from "../../ui/scroll-area";
import { Skeleton } from "../../ui/skeleton";

type ActivityType = "organization" | "project" | "team" | "user";

interface LinearActivityFeedProps {
	type: ActivityType;
	projectId?: Id<"constructionProjects">;
	userId?: Id<"users">;
	departmentId?: Id<"departments">;
	limit?: number;
	showLoadMore?: boolean;
	className?: string;
}

export function LinearActivityFeed({
	type,
	projectId,
	userId,
	departmentId,
	limit = 50,
	showLoadMore = true,
	className,
}: LinearActivityFeedProps) {
	const [activities, setActivities] = useState<any[]>([]);
	const [cursor, setCursor] = useState<number | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [selectedActivity, setSelectedActivity] = useState<any>(null);

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	// Determine which query to use based on type
	let queryFunction;
	let queryArgs: any = { limit, cursor: cursor || undefined };

	switch (type) {
		case "organization":
			queryFunction = api.activities.getOrganizationActivities;
			break;
		case "project":
			queryFunction = api.activities.getConstructionActivities;
			queryArgs = { ...queryArgs, projectId };
			break;
		case "team":
			queryFunction = api.activities.getTeamActivities;
			queryArgs = { ...queryArgs, departmentId };
			break;
		case "user":
			queryFunction = api.activities.getUserActivities;
			queryArgs = { ...queryArgs, userId };
			break;
	}

	const activitiesData = useQuery(queryFunction, queryArgs);

	// Handle initial data load
	useEffect(() => {
		if (activitiesData && !cursor) {
			if ("items" in activitiesData) {
				// Paginated response
				setActivities(activitiesData.items);
				setCursor(activitiesData.nextCursor);
				setHasMore(activitiesData.hasMore);
			} else if (Array.isArray(activitiesData)) {
				// Non-paginated response (project activities)
				setActivities(activitiesData);
				setHasMore(false);
			}
		}
	}, [activitiesData, cursor]);

	// Handle pagination
	useEffect(() => {
		if (inView && hasMore && !isLoadingMore && cursor && showLoadMore) {
			setIsLoadingMore(true);
		}
	}, [inView, hasMore, isLoadingMore, cursor, showLoadMore]);

	// Load more activities when cursor changes
	useEffect(() => {
		if (
			isLoadingMore &&
			activitiesData &&
			cursor &&
			"items" in activitiesData
		) {
			setActivities((prev) => [...prev, ...activitiesData.items]);
			setCursor(activitiesData.nextCursor);
			setHasMore(activitiesData.hasMore);
			setIsLoadingMore(false);
		}
	}, [activitiesData, isLoadingMore, cursor]);

	const getActivityIcon = (type: string) => {
		switch (type) {
			case "created":
				return <Plus className="h-3 w-3" />;
			case "status_changed":
				return <Activity className="h-3 w-3" />;
			case "assignee_changed":
				return <Users className="h-3 w-3" />;
			case "priority_changed":
				return <TrendingUp className="h-3 w-3" />;
			case "completed":
				return <CheckCircle2 className="h-3 w-3" />;
			case "due_date_changed":
				return <Calendar className="h-3 w-3" />;
			case "comment_added":
				return <MessageSquare className="h-3 w-3" />;
			case "subtask_added":
				return <Plus className="h-3 w-3" />;
			case "subtask_removed":
				return <Minus className="h-3 w-3" />;
			default:
				return <Activity className="h-3 w-3" />;
		}
	};

	const getActivityColor = (type: string) => {
		switch (type) {
			case "created":
				return "text-green-600 bg-green-50 border-green-200";
			case "completed":
				return "text-blue-600 bg-blue-50 border-blue-200";
			case "priority_changed":
				return "text-orange-600 bg-orange-50 border-orange-200";
			case "status_changed":
				return "text-purple-600 bg-purple-50 border-purple-200";
			case "assignee_changed":
				return "text-indigo-600 bg-indigo-50 border-indigo-200";
			case "due_date_changed":
				return "text-yellow-600 bg-yellow-50 border-yellow-200";
			case "comment_added":
				return "text-gray-600 bg-gray-50 border-gray-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	const getActivityDescription = (activity: any) => {
		const { type, populatedMetadata, oldValue, newValue, task } = activity;

		switch (type) {
			case "created":
				return (
					<span>
						создал задачу{" "}
						<span className="font-medium text-foreground">
							{task?.identifier} - {task?.title}
						</span>
					</span>
				);
			case "status_changed":
				return (
					<span>
						изменил статус с{" "}
						<Badge variant="outline" className="mx-1">
							{populatedMetadata.oldStatus?.name || oldValue}
						</Badge>{" "}
						на{" "}
						<Badge variant="outline" className="mx-1">
							{populatedMetadata.newStatus?.name || newValue}
						</Badge>
					</span>
				);
			case "assignee_changed":
				return (
					<span>
						{populatedMetadata.oldAssignee ? (
							<>
								переназначил с{" "}
								<span className="font-medium">
									{populatedMetadata.oldAssignee.name}
								</span>{" "}
								на{" "}
								<span className="font-medium">
									{populatedMetadata.newAssignee?.name || "Не назначено"}
								</span>
							</>
						) : (
							<>
								назначил{" "}
								<span className="font-medium">
									{populatedMetadata.newAssignee?.name}
								</span>
							</>
						)}
					</span>
				);
			case "priority_changed":
				return (
					<span>
						изменил приоритет с{" "}
						<Badge
							variant="outline"
							className="mx-1"
							style={{
								borderColor: populatedMetadata.oldPriority?.color,
								color: populatedMetadata.oldPriority?.color,
							}}
						>
							{populatedMetadata.oldPriority?.name}
						</Badge>{" "}
						на{" "}
						<Badge
							variant="outline"
							className="mx-1"
							style={{
								borderColor: populatedMetadata.newPriority?.color,
								color: populatedMetadata.newPriority?.color,
							}}
						>
							{populatedMetadata.newPriority?.name}
						</Badge>
					</span>
				);
			case "completed":
				return <span>завершил задачу</span>;
			case "due_date_changed":
				return (
					<span>
						изменил срок выполнения{" "}
						{oldValue && (
							<>
								с <span className="font-medium">{oldValue}</span>
							</>
						)}{" "}
						{newValue ? (
							<>
								на <span className="font-medium">{newValue}</span>
							</>
						) : (
							"(удалено)"
						)}
					</span>
				);
			case "comment_added":
				return <span>добавил комментарий</span>;
			case "subtask_added":
				return (
					<span>
						добавил подзадачу{" "}
						<span className="font-medium">
							{populatedMetadata.subtask?.title}
						</span>
					</span>
				);
			case "subtask_removed":
				return (
					<span>
						удалил подзадачу{" "}
						<span className="font-medium">
							{populatedMetadata.subtask?.title}
						</span>
					</span>
				);
			default:
				return <span>выполнил действие</span>;
		}
	};

	// Group activities by date
	const groupedActivities = activities.reduce((groups: any, activity: any) => {
		const date = new Date(activity.createdAt).toLocaleDateString("ru-RU", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
		if (!groups[date]) {
			groups[date] = [];
		}
		groups[date].push(activity);
		return groups;
	}, {});

	if (!activitiesData) {
		return (
			<div className={className}>
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<Card key={i} className="p-4">
							<div className="flex items-start gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/4" />
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className={className}>
				<div className="space-y-6">
					{Object.entries(groupedActivities).map(
						([date, dateActivities]: any) => (
							<div key={date}>
								<div className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 py-2 backdrop-blur">
									<div className="h-px flex-1 bg-border" />
									<span className="font-medium text-muted-foreground text-xs">
										{date}
									</span>
									<div className="h-px flex-1 bg-border" />
								</div>

								<AnimatePresence>
									<div className="space-y-2">
										{dateActivities.map((activity: any, index: number) => (
											<motion.div
												key={activity._id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -20 }}
												transition={{ delay: index * 0.05 }}
											>
												<Card
													className="group cursor-pointer p-3 transition-all hover:shadow-sm"
													onClick={() => setSelectedActivity(activity)}
												>
													<div className="flex items-center gap-3">
														<div
															className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${getActivityColor(
																activity.type,
															)}`}
														>
															{getActivityIcon(activity.type)}
														</div>

														<div className="min-w-0 flex-1">
															<div className="flex items-baseline gap-2">
																<span className="font-medium text-sm">
																	{activity.user?.name || "Пользователь"}
																</span>
																<span className="text-muted-foreground text-sm">
																	{getActivityDescription(activity)}
																</span>
															</div>
															{activity.task && (
																<p className="truncate text-muted-foreground text-xs">
																	{activity.task.identifier} •{" "}
																	{activity.task.title}
																</p>
															)}
															{activity.project && (
																<p className="truncate text-muted-foreground text-xs">
																	Проект: {activity.project.name}
																</p>
															)}
														</div>

														<span className="whitespace-nowrap text-muted-foreground text-xs">
															{formatDistanceToNow(
																new Date(activity.createdAt),
																{
																	addSuffix: true,
																	locale: ru,
																},
															)}
														</span>
													</div>
												</Card>
											</motion.div>
										))}
									</div>
								</AnimatePresence>
							</div>
						),
					)}

					{activities.length === 0 && (
						<Card className="p-6">
							<div className="flex flex-col items-center justify-center text-center">
								<Activity className="mb-3 h-10 w-10 text-muted-foreground/40" />
								<h3 className="font-medium">Нет активности</h3>
								<p className="mt-1 text-muted-foreground text-sm">
									Здесь будут отображаться все события и изменения
								</p>
							</div>
						</Card>
					)}

					{/* Load more trigger */}
					{showLoadMore && hasMore && (
						<div ref={loadMoreRef} className="mt-4 flex justify-center">
							{isLoadingMore && (
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							)}
						</div>
					)}
				</div>
			</div>

			<Dialog
				open={!!selectedActivity}
				onOpenChange={() => setSelectedActivity(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Детали события</DialogTitle>
					</DialogHeader>
					{selectedActivity && (
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<Avatar>
									<AvatarImage src={selectedActivity.user?.image} />
									<AvatarFallback>
										{selectedActivity.user?.name?.[0] || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<p className="font-medium">{selectedActivity.user?.name}</p>
									<p className="text-muted-foreground text-sm">
										{getActivityDescription(selectedActivity)}
									</p>
								</div>
							</div>

							<div className="space-y-2 rounded-lg bg-muted/50 p-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="font-medium text-muted-foreground">
											Тип события
										</p>
										<p className="mt-1">{selectedActivity.type}</p>
									</div>
									<div>
										<p className="font-medium text-muted-foreground">Время</p>
										<p className="mt-1">
											{new Date(selectedActivity.createdAt).toLocaleString(
												"ru-RU",
											)}
										</p>
									</div>
									{selectedActivity.task && (
										<>
											<div>
												<p className="font-medium text-muted-foreground">
													Задача
												</p>
												<p className="mt-1">
													{selectedActivity.task.identifier} -{" "}
													{selectedActivity.task.title}
												</p>
											</div>
											{selectedActivity.project && (
												<div>
													<p className="font-medium text-muted-foreground">
														Проект
													</p>
													<p className="mt-1">
														{selectedActivity.project.name}
													</p>
												</div>
											)}
										</>
									)}
								</div>

								{(selectedActivity.oldValue || selectedActivity.newValue) && (
									<div className="mt-4 space-y-2">
										<p className="font-medium text-muted-foreground">
											Изменения
										</p>
										<div className="grid grid-cols-2 gap-4">
											{selectedActivity.oldValue && (
												<div className="rounded border bg-background p-2">
													<p className="text-muted-foreground text-xs">Было</p>
													<p className="text-sm">{selectedActivity.oldValue}</p>
												</div>
											)}
											{selectedActivity.newValue && (
												<div className="rounded border bg-background p-2">
													<p className="text-muted-foreground text-xs">Стало</p>
													<p className="text-sm">{selectedActivity.newValue}</p>
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
