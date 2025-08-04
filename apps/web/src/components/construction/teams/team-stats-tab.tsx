"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@backend/convex/_generated/dataModel";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	BarChart3,
	Calendar,
	CheckCircle2,
	Clock,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";

interface TeamStatsTabProps {
	teamId: Id<"constructionTeams">;
}

export function TeamStatsTab({ teamId }: TeamStatsTabProps) {
	// Fetch team statistics
	const teamStats = useQuery(api.constructionTeams.getTeamStatistics, {
		teamId,
	});

	if (!teamStats) {
		return (
			<div className="space-y-6 p-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					{[1, 2].map((i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			</div>
		);
	}

	const completionRate =
		teamStats.totalTasks > 0
			? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100)
			: 0;

	const overdueRate =
		teamStats.totalTasks > 0
			? Math.round((teamStats.overdueTasks / teamStats.totalTasks) * 100)
			: 0;

	return (
		<ScrollArea className="h-full">
			<div className="space-y-6 p-6">
				{/* Key Metrics */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-sm">
										Общая эффективность
									</p>
									<p className="font-bold text-3xl">{completionRate}%</p>
									<div className="flex items-center gap-1 text-sm">
										{completionRate >= 75 ? (
											<>
												<TrendingUp className="h-4 w-4 text-green-500" />
												<span className="text-green-500">Высокая</span>
											</>
										) : (
											<>
												<TrendingDown className="h-4 w-4 text-orange-500" />
												<span className="text-orange-500">
													Требует внимания
												</span>
											</>
										)}
									</div>
								</div>
								<div className="rounded-full bg-primary/10 p-3">
									<BarChart3 className="h-6 w-6 text-primary" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-sm">
										Активные задачи
									</p>
									<p className="font-bold text-3xl">{teamStats.activeTasks}</p>
									<p className="text-muted-foreground text-sm">
										из {teamStats.totalTasks} всего
									</p>
								</div>
								<div className="rounded-full bg-blue-500/10 p-3">
									<Activity className="h-6 w-6 text-blue-500" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-sm">
										Выполнено за месяц
									</p>
									<p className="font-bold text-3xl">
										{teamStats.completedThisMonth}
									</p>
									<p className="text-green-500 text-sm">
										+{teamStats.monthlyGrowth}% к прошлому
									</p>
								</div>
								<div className="rounded-full bg-green-500/10 p-3">
									<CheckCircle2 className="h-6 w-6 text-green-500" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="font-medium text-muted-foreground text-sm">
										Просроченные
									</p>
									<p className="font-bold text-3xl text-destructive">
										{teamStats.overdueTasks}
									</p>
									<p className="text-muted-foreground text-sm">
										{overdueRate}% от общего числа
									</p>
								</div>
								<div className="rounded-full bg-destructive/10 p-3">
									<Clock className="h-6 w-6 text-destructive" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Detailed Stats */}
				<div className="grid gap-6 md:grid-cols-2">
					{/* Task Distribution */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Распределение задач</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div>
									<div className="mb-1 flex items-center justify-between">
										<span className="text-sm">К выполнению</span>
										<span className="font-medium text-sm">
											{teamStats.todoTasks}
										</span>
									</div>
									<Progress
										value={(teamStats.todoTasks / teamStats.totalTasks) * 100}
										className="h-2"
									/>
								</div>
								<div>
									<div className="mb-1 flex items-center justify-between">
										<span className="text-sm">В работе</span>
										<span className="font-medium text-sm">
											{teamStats.inProgressTasks}
										</span>
									</div>
									<Progress
										value={
											(teamStats.inProgressTasks / teamStats.totalTasks) * 100
										}
										className="h-2 [&>div]:bg-orange-500"
									/>
								</div>
								<div>
									<div className="mb-1 flex items-center justify-between">
										<span className="text-sm">Выполнено</span>
										<span className="font-medium text-sm">
											{teamStats.completedTasks}
										</span>
									</div>
									<Progress
										value={
											(teamStats.completedTasks / teamStats.totalTasks) * 100
										}
										className="h-2 [&>div]:bg-green-500"
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Member Performance */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Производительность участников
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{teamStats.memberStats?.slice(0, 5).map((member, index) => (
									<div key={member.userId} className="flex items-center gap-3">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-sm">
											{index + 1}
										</div>
										<div className="flex-1">
											<p className="font-medium text-sm">{member.userName}</p>
											<p className="text-muted-foreground text-xs">
												{member.completedTasks} задач выполнено
											</p>
										</div>
										<div className="text-right">
											<p className="font-medium text-sm">
												{member.efficiency}%
											</p>
											<Progress
												value={member.efficiency}
												className="h-1 w-16"
											/>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Time-based Stats */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Временная статистика</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										Среднее время выполнения
									</span>
								</div>
								<p className="font-semibold text-2xl">
									{teamStats.avgCompletionTime} дней
								</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										Задач в день
									</span>
								</div>
								<p className="font-semibold text-2xl">
									{teamStats.tasksPerDay}
								</p>
							</div>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="text-muted-foreground text-sm">
										Загрузка команды
									</span>
								</div>
								<p className="font-semibold text-2xl">
									{teamStats.teamWorkload}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}
