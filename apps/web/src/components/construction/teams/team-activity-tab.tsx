"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@backend/convex/_generated/dataModel";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle2,
	Clock,
	MessageSquare,
	Plus,
	TrendingUp,
	Users,
} from "lucide-react";
import { motion } from "motion/react";

interface TeamActivityTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamActivityTab({ teamId }: TeamActivityTabProps) {
	// Get team details
	const team = useQuery(api.constructionTeams.getTeamWithStats, { teamId });

	// Get activities for all team members
	const activities = useQuery(
		api.constructionTeams.getTeamActivities,
		team ? { teamId } : "skip",
	);

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
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	const getActivityDescription = (activity: any) => {
		const { type, oldValue, newValue, task } = activity;

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
							{oldValue}
						</Badge>{" "}
						на{" "}
						<Badge variant="outline" className="mx-1">
							{newValue}
						</Badge>
					</span>
				);
			case "assignee_changed":
				return <span>изменил исполнителя</span>;
			case "priority_changed":
				return <span>изменил приоритет</span>;
			case "completed":
				return <span>завершил задачу</span>;
			case "due_date_changed":
				return <span>изменил срок выполнения</span>;
			case "comment_added":
				return <span>добавил комментарий</span>;
			default:
				return <span>выполнил действие</span>;
		}
	};

	// Group activities by date
	const groupedActivities =
		activities?.reduce((groups: any, activity: any) => {
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
		}, {}) || {};

	if (!activities) {
		return (
			<div className="h-full p-6">
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
		<ScrollArea className="h-full">
			<div className="p-6">
				{activities.length === 0 ? (
					<Card className="p-6">
						<div className="flex flex-col items-center justify-center text-center">
							<Activity className="mb-3 h-10 w-10 text-muted-foreground/40" />
							<h3 className="font-medium">Нет активности</h3>
							<p className="mt-1 text-muted-foreground text-sm">
								Здесь будут отображаться все события команды
							</p>
						</div>
					</Card>
				) : (
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

									<div className="space-y-2">
										{dateActivities.map((activity: any, index: number) => (
											<motion.div
												key={activity._id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
											>
												<Card className="p-3">
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
																<Avatar className="h-6 w-6">
																	<AvatarImage
																		src={activity.user?.profileImageUrl}
																	/>
																	<AvatarFallback>
																		{activity.user?.name
																			?.slice(0, 2)
																			.toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<span className="font-medium text-sm">
																	{activity.user?.name || "Пользователь"}
																</span>
																<span className="text-muted-foreground text-sm">
																	{getActivityDescription(activity)}
																</span>
															</div>
															{activity.task && (
																<p className="mt-1 truncate text-muted-foreground text-xs">
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
								</div>
							),
						)}
					</div>
				)}
			</div>
		</ScrollArea>
	);
}
