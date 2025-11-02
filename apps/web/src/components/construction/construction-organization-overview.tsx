"use client";

import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	Activity,
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRouter } from "@tanstack/react-router";

export function ConstructionOrganizationOverview() {
	const router = useRouter();
	const overview = useQuery(api.constructionProjects.getOrganizationOverview);
	const monthlyRevenue = useQuery(
		api.constructionProjects.getOrganizationMonthlyRevenue,
	);
	const timeline = useQuery(api.constructionProjects.getOrganizationTimeline);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
		}).format(value);
	};

	const formatPercent = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 1,
		}).format(value / 100);
	};

	// Prepare chart data
	const projectHealthData = useMemo(() => {
		if (!overview?.projects) return [];

		const healthCounts = {
			"На плане": 0,
			"Под риском": 0,
			Задерживается: 0,
		};

		overview.projects.forEach((project) => {
			if (project.isDelayed) {
				healthCounts["Задерживается"]++;
			} else if (project.taskStats.overdue > 0) {
				healthCounts["Под риском"]++;
			} else {
				healthCounts["На плане"]++;
			}
		});

		return Object.entries(healthCounts).map(([name, value]) => ({
			name,
			value,
			color:
				name === "На плане"
					? "#10b981"
					: name === "Под риском"
						? "#f59e0b"
						: "#ef4444",
		}));
	}, [overview]);

	const monthlyRevenueData = useMemo(() => {
		if (!monthlyRevenue?.monthlyRevenue) return [];

		return monthlyRevenue.monthlyRevenue.map((month) => ({
			month: format(new Date(month.month + "-01"), "MMM yyyy", {
				locale: ru,
			}),
			planned: month.totalPlanned,
			actual: month.totalActual,
			variance: month.variance,
		}));
	}, [monthlyRevenue]);

	if (!overview || !monthlyRevenue || !timeline) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl space-y-6">
					<Skeleton className="h-32 w-full" />
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-32 w-full" />
						))}
					</div>
					<Skeleton className="h-96 w-full" />
				</div>
			</div>
		);
	}

	const { orgStats, projects } = overview;

	return (
		<div className="h-full overflow-auto bg-background p-6">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Page Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="mb-8"
				>
					<h1 className="text-3xl font-bold">Обзор организации</h1>
					<p className="text-muted-foreground">
						Мониторинг всех строительных проектов
					</p>
				</motion.div>

				{/* Key Metrics */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Всего проектов
								</CardTitle>
								<Activity className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{orgStats.totalProjects}
								</div>
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<span className="text-green-600">
										{orgStats.activeProjects} активных
									</span>
									<span>•</span>
									<span className="text-blue-600">
										{orgStats.completedProjects} завершённых
									</span>
								</div>
								{orgStats.delayedProjects > 0 && (
									<Badge variant="destructive" className="mt-2">
										{orgStats.delayedProjects} с задержкой
									</Badge>
								)}
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: 0.2 }}
					>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Средний прогресс
								</CardTitle>
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{formatPercent(orgStats.averageProgress)}
								</div>
								<Progress value={orgStats.averageProgress} className="mt-2" />
								<p className="mt-1 text-xs text-muted-foreground">
									По всем активным проектам
								</p>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: 0.3 }}
					>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Статус задач
								</CardTitle>
								<CheckCircle className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{orgStats.completedTasks} / {orgStats.totalTasks}
								</div>
								<div className="mt-2 space-y-1">
									<div className="flex items-center gap-2 text-xs">
										<div className="h-2 w-2 rounded-full bg-green-500" />
										<span>Завершено: {orgStats.completedTasks}</span>
									</div>
									<div className="flex items-center gap-2 text-xs">
										<div className="h-2 w-2 rounded-full bg-yellow-500" />
										<span>В работе: {orgStats.inProgressTasks}</span>
									</div>
									{orgStats.overdueTasks > 0 && (
										<div className="flex items-center gap-2 text-xs text-red-600">
											<div className="h-2 w-2 rounded-full bg-red-500" />
											<span>Просрочено: {orgStats.overdueTasks}</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: 0.4 }}
					>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Общая стоимость
								</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{formatCurrency(orgStats.totalContractValue)}
								</div>
								{monthlyRevenue && (
									<div className="mt-2 text-xs">
										<div
											className={cn(
												"flex items-center gap-1",
												monthlyRevenue.totalVariance >= 0
													? "text-green-600"
													: "text-red-600",
											)}
										>
											{monthlyRevenue.totalVariance >= 0 ? (
												<TrendingUp className="h-3 w-3" />
											) : (
												<TrendingDown className="h-3 w-3" />
											)}
											<span>
												{formatCurrency(Math.abs(monthlyRevenue.totalVariance))}
											</span>
										</div>
										<p className="text-muted-foreground">Отклонение от плана</p>
									</div>
								)}
							</CardContent>
						</Card>
					</motion.div>
				</div>

				{/* Risk Alert */}
				{orgStats.projectsAtRisk > 0 && (
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, delay: 0.5 }}
					>
						<Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2">
									<AlertCircle className="h-5 w-5 text-yellow-600" />
									<CardTitle className="text-lg">Внимание</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm">
									<span className="font-semibold">
										{orgStats.projectsAtRisk}
									</span>{" "}
									{orgStats.projectsAtRisk === 1 ? "проект" : "проектов"}{" "}
									требуют внимания из-за задержек или просроченных задач
								</p>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{/* Main Content Tabs */}
				<Tabs defaultValue="projects" className="space-y-4">
					<TabsList>
						<TabsTrigger value="projects">Проекты</TabsTrigger>
						<TabsTrigger value="timeline">План vs Факт</TabsTrigger>
						<TabsTrigger value="revenue">Финансы</TabsTrigger>
					</TabsList>

					{/* Projects Grid */}
					<TabsContent value="projects" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Все проекты</CardTitle>
							</CardHeader>
							<CardContent>
								<AnimatePresence mode="wait">
									<div className="space-y-4">
										{projects
											.sort((a, b) => {
												// Sort by delay status, then by overdue tasks
												if (a.isDelayed !== b.isDelayed) {
													return a.isDelayed ? -1 : 1;
												}
												return b.taskStats.overdue - a.taskStats.overdue;
											})
											.map((project, index) => (
												<motion.div
													key={project._id}
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -20 }}
													transition={{ duration: 0.3, delay: index * 0.05 }}
													className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
												>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<h3 className="font-semibold">
																	{project.name}
																</h3>
																{project.isDelayed && (
																	<Badge variant="destructive">
																		Задержка {project.daysDelayed} дн.
																	</Badge>
																)}
																{project.taskStats.overdue > 0 && (
																	<Badge
																		variant="outline"
																		className="text-yellow-600"
																	>
																		{project.taskStats.overdue} просроченных
																		задач
																	</Badge>
																)}
															</div>
															<p className="mt-1 text-sm text-muted-foreground">
																{project.client} • {project.location}
															</p>
														</div>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => {
																router.navigate({
																	to: "/construction/$orgId/projects/$projectId/overview",
																	params: {
																		orgId: overview.organization.id,
																		projectId: project._id as string,
																	},
																});
															}}
														>
															Подробнее
														</Button>
													</div>

													<div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
														<div>
															<p className="text-xs text-muted-foreground">
																Прогресс
															</p>
															<div className="mt-1 flex items-center gap-2">
																<Progress
																	value={project.percentComplete}
																	className="flex-1"
																/>
																<span className="text-sm font-medium">
																	{project.percentComplete}%
																</span>
															</div>
														</div>

														<div>
															<p className="text-xs text-muted-foreground">
																Задачи
															</p>
															<p className="text-sm font-medium">
																{project.taskStats.completed} /{" "}
																{project.taskStats.total}
															</p>
														</div>

														<div>
															<p className="text-xs text-muted-foreground">
																Стоимость
															</p>
															<p className="text-sm font-medium">
																{formatCurrency(project.contractValue)}
															</p>
														</div>

														<div>
															<p className="text-xs text-muted-foreground">
																Срок
															</p>
															<p className="text-sm font-medium">
																{project.targetDate
																	? format(
																			new Date(project.targetDate),
																			"dd.MM.yyyy",
																		)
																	: "Не указан"}
															</p>
														</div>
													</div>

													{/* Task breakdown */}
													<div className="mt-3 flex gap-4 text-xs">
														<span className="flex items-center gap-1">
															<div className="h-2 w-2 rounded-full bg-green-500" />
															Завершено: {project.taskStats.completed}
														</span>
														<span className="flex items-center gap-1">
															<div className="h-2 w-2 rounded-full bg-yellow-500" />
															В работе: {project.taskStats.inProgress}
														</span>
														<span className="flex items-center gap-1">
															<div className="h-2 w-2 rounded-full bg-gray-300" />
															Не начато: {project.taskStats.notStarted}
														</span>
														{project.taskStats.overdue > 0 && (
															<span className="flex items-center gap-1 text-red-600">
																<div className="h-2 w-2 rounded-full bg-red-500" />
																Просрочено: {project.taskStats.overdue}
															</span>
														)}
													</div>
												</motion.div>
											))}
									</div>
								</AnimatePresence>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Timeline Tab */}
					<TabsContent value="timeline" className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-3">
							{/* Summary Cards */}
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">
										На плане
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-green-600">
										{timeline.summary.onTrack}
									</div>
									<p className="text-xs text-muted-foreground">проектов</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">
										Под риском
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-yellow-600">
										{timeline.summary.atRisk}
									</div>
									<p className="text-xs text-muted-foreground">проектов</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm font-medium">
										С задержкой
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold text-red-600">
										{timeline.summary.delayed}
									</div>
									<p className="text-xs text-muted-foreground">проектов</p>
								</CardContent>
							</Card>
						</div>

						{/* Timeline Chart */}
						<Card>
							<CardHeader>
								<CardTitle>План выполнения vs Факт</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{timeline.timelines.map((project) => (
										<div
											key={project.projectId}
											className={cn(
												"rounded-lg border p-4",
												project.delayStatus === "delayed" &&
													"border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20",
												project.delayStatus === "at-risk" &&
													"border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20",
											)}
										>
											<div className="mb-2 flex items-center justify-between">
												<h4 className="font-semibold">{project.projectName}</h4>
												<Badge
													variant={
														project.delayStatus === "on-track"
															? "success"
															: project.delayStatus === "at-risk"
																? "warning"
																: "destructive"
													}
												>
													{project.delayStatus === "on-track"
														? "На плане"
														: project.delayStatus === "at-risk"
															? "Под риском"
															: `Задержка ${project.daysDelayed} дн.`}
												</Badge>
											</div>

											<div className="space-y-2">
												{/* Expected Progress */}
												<div>
													<div className="mb-1 flex justify-between text-xs">
														<span className="text-muted-foreground">
															Ожидаемый прогресс
														</span>
														<span>{Math.round(project.expectedProgress)}%</span>
													</div>
													<Progress
														value={project.expectedProgress}
														className="h-2 bg-gray-200"
													/>
												</div>

												{/* Actual Progress */}
												<div>
													<div className="mb-1 flex justify-between text-xs">
														<span className="text-muted-foreground">
															Фактический прогресс
														</span>
														<span>{Math.round(project.percentComplete)}%</span>
													</div>
													<Progress
														value={project.percentComplete}
														className={cn(
															"h-2",
															project.delayStatus === "delayed" &&
																"[&>div]:bg-red-500",
															project.delayStatus === "at-risk" &&
																"[&>div]:bg-yellow-500",
															project.delayStatus === "on-track" &&
																"[&>div]:bg-green-500",
														)}
													/>
												</div>
											</div>

											<div className="mt-3 flex gap-4 text-xs text-muted-foreground">
												<span>
													Начало:{" "}
													{format(new Date(project.startDate), "dd.MM.yyyy")}
												</span>
												{project.targetDate && (
													<span>
														Плановый срок:{" "}
														{format(new Date(project.targetDate), "dd.MM.yyyy")}
													</span>
												)}
												<span>
													Задач: {project.completedTasks}/{project.totalTasks}
												</span>
												{project.delayedTasks > 0 && (
													<span className="text-red-600">
														Просрочено задач: {project.delayedTasks}
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Revenue Tab */}
					<TabsContent value="revenue" className="space-y-4">
						<div className="grid gap-4 lg:grid-cols-2">
							{/* Monthly Revenue Chart */}
							<Card>
								<CardHeader>
									<CardTitle>Помесячная выручка</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<BarChart data={monthlyRevenueData}>
											<CartesianGrid strokeDasharray="3 3" />
											<XAxis dataKey="month" />
											<YAxis />
											<Tooltip
												formatter={(value: number) => formatCurrency(value)}
											/>
											<Legend />
											<Bar dataKey="planned" fill="#94a3b8" name="План" />
											<Bar dataKey="actual" fill="#3b82f6" name="Факт" />
										</BarChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Project Health Distribution */}
							<Card>
								<CardHeader>
									<CardTitle>Распределение по статусу</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={projectHealthData}
												cx="50%"
												cy="50%"
												labelLine={false}
												label={(entry) => `${entry.name}: ${entry.value}`}
												outerRadius={80}
												fill="#8884d8"
												dataKey="value"
											>
												{projectHealthData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip />
										</PieChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</div>

						{/* Revenue by Project Table */}
						<Card>
							<CardHeader>
								<CardTitle>Выручка по проектам</CardTitle>
							</CardHeader>
							<CardContent>
								{monthlyRevenue.monthlyRevenue.length > 0 ? (
									<div className="space-y-4">
										{monthlyRevenue.monthlyRevenue
											.slice(-3) // Show last 3 months
											.map((month) => (
												<div key={month.month} className="space-y-2">
													<h4 className="font-medium">
														{format(
															new Date(month.month + "-01"),
															"LLLL yyyy",
															{
																locale: ru,
															},
														)}
													</h4>
													<div className="space-y-1">
														{month.projects.map((project) => (
															<div
																key={project.projectId}
																className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
															>
																<span className="truncate">
																	{project.projectName}
																</span>
																<div className="flex gap-4">
																	<span className="text-muted-foreground">
																		План: {formatCurrency(project.planned)}
																	</span>
																	<span
																		className={cn(
																			project.actual >= project.planned
																				? "text-green-600"
																				: "text-red-600",
																		)}
																	>
																		Факт: {formatCurrency(project.actual)}
																	</span>
																</div>
															</div>
														))}
													</div>
													<div className="flex justify-between border-t pt-2 font-medium">
														<span>Итого за месяц:</span>
														<div className="flex gap-4">
															<span>
																План: {formatCurrency(month.totalPlanned)}
															</span>
															<span
																className={cn(
																	month.variance >= 0
																		? "text-green-600"
																		: "text-red-600",
																)}
															>
																Факт: {formatCurrency(month.totalActual)}
															</span>
														</div>
													</div>
												</div>
											))}
									</div>
								) : (
									<p className="text-center text-muted-foreground">
										Нет данных о выручке
									</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
