"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { differenceInDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Building2,
	Calendar,
	CheckCircle2,
	ChevronDown,
	Circle,
	CircleDot,
	Clock,
	DollarSign,
	Loader2,
	MapPin,
	MoreHorizontal,
	Plus,
	Tag,
	Target,
	User,
	Users,
	Wallet,
	FileText,
	TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { lazy, Suspense, useState } from "react";

// Lazy load finance component
const ProjectFinanceTab = lazy(() => import("../project-finance/finance-overview").then(m => ({ default: m.ProjectFinanceTab })));
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface ConstructionProjectOverviewProps {
	projectId: Id<"constructionProjects">;
}

const statusStyles = {
	"В работе": {
		icon: CircleDot,
		color: "text-yellow-600",
		bg: "bg-yellow-100",
		borderColor: "border-yellow-200",
	},
	завершено: {
		icon: CheckCircle2,
		color: "text-green-600",
		bg: "bg-green-100",
		borderColor: "border-green-200",
	},
	"Не начато": {
		icon: Circle,
		color: "text-gray-600",
		bg: "bg-gray-100",
		borderColor: "border-gray-200",
	},
	Приостановлено: {
		icon: Clock,
		color: "text-blue-600",
		bg: "bg-blue-100",
		borderColor: "border-blue-200",
	},
};

const priorityStyles = {
	Низкий: "bg-gray-100 text-gray-700",
	Средний: "bg-blue-100 text-blue-700",
	Высокий: "bg-orange-100 text-orange-700",
	Критический: "bg-red-100 text-red-700",
};

const projectTypeLabels = {
	residential: "Жилое",
	commercial: "Коммерческое",
	industrial: "Промышленное",
	infrastructure: "Инфраструктура",
};

export function ConstructionProjectOverview({
	projectId,
}: ConstructionProjectOverviewProps) {
	const isMobile = useMobile();
	const [expandedSections, setExpandedSections] = useState({
		charts: true,
		tasks: true,
	});
	const project = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId,
	});

	if (!project) {
		return <ProjectSkeleton />;
	}

	const { taskStats } = project;
	const progressPercentage = project.percentComplete;
	const daysUntilTarget = project.targetDate
		? differenceInDays(parseISO(project.targetDate), new Date())
		: null;

	const StatusIcon = project.status?.name
		? statusStyles[project.status.name as keyof typeof statusStyles]?.icon ||
			Circle
		: Circle;

	// Data for pie chart
	const pieData = [
		{
			name: "завершено",
			value: taskStats.completed,
			color: "hsl(142, 76%, 36%)",
		},
		{
			name: "В работе",
			value: taskStats.inProgress,
			color: "hsl(45, 93%, 47%)",
		},
		{
			name: "Не начато",
			value: taskStats.notStarted,
			color: "hsl(var(--muted))",
		},
	];

	// Monthly revenue data for chart
	const revenueChartData =
		project.monthlyRevenue
			?.sort((a, b) => a.month.localeCompare(b.month))
			.map((rev) => ({
				month: format(parseISO(rev.month + "-01"), "MMM", { locale: ru }),
				planned: rev.planned,
				actual: rev.actual,
			})) || [];

	// Format currency
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	// Mobile view
	if (isMobile) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="space-y-4 p-4">
					{/* Mobile Header */}
					<motion.div
						className="space-y-3"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<h1 className="font-semibold text-xl">{project.name}</h1>
								<p className="text-muted-foreground text-sm">
									Клиент: {project.client}
								</p>
							</div>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</div>

						{/* Status Bar - Mobile */}
						<div className="flex flex-wrap items-center gap-2 text-xs">
							{project.status && (
								<div
									className={cn(
										"flex items-center gap-1 rounded-md px-2 py-1",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.bg || "bg-gray-100",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.borderColor || "border-gray-200",
										"border",
									)}
								>
									<StatusIcon
										className={cn(
											"h-3 w-3",
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600",
										)}
									/>
									<span
										className={
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600"
										}
									>
										{project.status.name}
									</span>
								</div>
							)}

							{project.priority && (
								<Badge
									className={cn(
										"border-0 text-xs",
										priorityStyles[
											project.priority.name as keyof typeof priorityStyles
										] || "bg-gray-100",
									)}
								>
									{project.priority.name}
								</Badge>
							)}

							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 text-muted-foreground" />
								<span className="text-muted-foreground">
									{format(parseISO(project.startDate), "d MMM", { locale: ru })}
									{project.targetDate && (
										<>
											{" → "}
											{format(parseISO(project.targetDate), "d MMM", {
												locale: ru,
											})}
										</>
									)}
								</span>
							</div>
						</div>
					</motion.div>

					<Separator />

					{/* Quick Stats - Mobile */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
					>
						<div className="grid grid-cols-3 gap-2">
							<Card className="border-muted p-3">
								<div className="space-y-1">
									<p className="font-semibold text-xl">{taskStats.total}</p>
									<p className="text-muted-foreground text-xs">Всего</p>
								</div>
							</Card>

							<Card className="border-yellow-200 bg-yellow-50/50 p-3">
								<div className="space-y-1">
									<p className="font-semibold text-xl">
										{taskStats.inProgress}
									</p>
									<p className="text-muted-foreground text-xs">В работе</p>
								</div>
							</Card>

							<Card className="border-green-200 bg-green-50/50 p-3">
								<div className="space-y-1">
									<p className="font-semibold text-xl">{taskStats.completed}</p>
									<p className="text-muted-foreground text-xs">Готово</p>
								</div>
							</Card>
						</div>

						{/* Progress Bar - Mobile */}
						<div className="mt-4">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Прогресс</span>
								<span className="font-medium text-xs">
									{Math.round(progressPercentage)}%
								</span>
							</div>
							<div className="h-2 w-full rounded-full bg-muted">
								<motion.div
									className="h-full rounded-full bg-primary"
									initial={{ width: 0 }}
									animate={{ width: `${progressPercentage}%` }}
									transition={{ duration: 0.5 }}
								/>
							</div>
						</div>
					</motion.div>

					{/* Project Details - Mobile */}
					<Card className="p-4">
						<h3 className="mb-3 font-medium text-sm">Детали проекта</h3>
						<div className="space-y-3">
							{/* Contract Value */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Стоимость</span>
								<span className="font-medium text-sm">
									{formatCurrency(project.contractValue)}
								</span>
							</div>

							{/* Location */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Локация</span>
								<span className="text-sm">{project.location}</span>
							</div>

							{/* Type */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Тип</span>
								<Badge variant="secondary" className="text-xs">
									{projectTypeLabels[project.projectType]}
								</Badge>
							</div>

							{/* Lead */}
							{project.lead && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-xs">
										Руководитель
									</span>
									<div className="flex items-center gap-2">
										<Avatar className="h-5 w-5">
											<AvatarImage src={project.lead.avatarUrl} />
											<AvatarFallback>{project.lead.name[0]}</AvatarFallback>
										</Avatar>
										<span className="text-sm">{project.lead.name}</span>
									</div>
								</div>
							)}

							{/* Timeline */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Сроки</span>
								<span className="text-sm">
									{format(parseISO(project.startDate), "d MMM", { locale: ru })}{" "}
									-{" "}
									{project.targetDate
										? format(parseISO(project.targetDate), "d MMM", {
												locale: ru,
											})
										: "Не определено"}
								</span>
							</div>

							{/* Days Left */}
							{daysUntilTarget !== null && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground text-xs">
										Осталось
									</span>
									<span
										className={cn(
											"font-medium text-sm",
											daysUntilTarget < 0 && "text-red-600",
										)}
									>
										{daysUntilTarget > 0
											? `${daysUntilTarget} дней`
											: "Просрочено"}
									</span>
								</div>
							)}

							{/* Health Status */}
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground text-xs">Состояние</span>
								<div className="flex items-center gap-2">
									<div
										className="h-2.5 w-2.5 rounded-full"
										style={{ backgroundColor: project.healthColor }}
									/>
									<span className="text-sm">{project.healthName}</span>
								</div>
							</div>

							{/* Team */}
							{project.teamMembers && project.teamMembers.length > 0 && (
								<div>
									<p className="mb-2 text-muted-foreground text-xs">Команда</p>
									<div className="-space-x-1 flex">
										{project.teamMembers.slice(0, 6).map((member) => (
											<Avatar
												key={member._id}
												className="h-6 w-6 border-2 border-background"
											>
												<AvatarImage src={member.avatarUrl} />
												<AvatarFallback className="text-xs">
													{member.name[0]}
												</AvatarFallback>
											</Avatar>
										))}
										{project.teamMembers.length > 6 && (
											<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
												+{project.teamMembers.length - 6}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</Card>

					{/* Charts Section - Mobile */}
					<div className="space-y-4">
						{/* Pie Chart - Mobile */}
						<Card className="p-4">
							<h3 className="mb-3 font-medium text-sm">Распределение задач</h3>
							<div className="h-[180px]">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={pieData}
											cx="50%"
											cy="50%"
											innerRadius={40}
											outerRadius={60}
											paddingAngle={2}
											dataKey="value"
										>
											{pieData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											formatter={(value: number) => `${value} задач`}
											contentStyle={{
												backgroundColor: "var(--background)",
												border: "1px solid var(--border)",
												borderRadius: "6px",
												fontSize: "12px",
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="mt-3 flex flex-wrap items-center justify-center gap-3">
								{pieData.map((item) => (
									<div key={item.name} className="flex items-center gap-1.5">
										<div
											className="h-2.5 w-2.5 rounded-sm"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-muted-foreground text-xs">
											{item.name} ({item.value})
										</span>
									</div>
								))}
							</div>
						</Card>

						{/* Revenue Chart - Mobile */}
						{revenueChartData.length > 0 && (
							<Card className="p-4">
								<div className="mb-3 flex items-center justify-between">
									<h3 className="font-medium text-sm">Выручка</h3>
									<span className="text-muted-foreground text-xs">
										План vs Факт
									</span>
								</div>
								<div className="h-[200px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={revenueChartData}>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="hsl(var(--border))"
											/>
											<XAxis
												dataKey="month"
												stroke="hsl(var(--muted-foreground))"
												fontSize={10}
												tickLine={false}
												axisLine={false}
											/>
											<YAxis hide />
											<Tooltip
												formatter={(value: number) => formatCurrency(value)}
												contentStyle={{
													backgroundColor: "var(--background)",
													border: "1px solid var(--border)",
													borderRadius: "6px",
													fontSize: "12px",
												}}
											/>
											<Bar
												dataKey="planned"
												fill="hsl(var(--muted))"
												radius={[4, 4, 0, 0]}
											/>
											<Bar
												dataKey="actual"
												fill="hsl(var(--primary))"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</Card>
						)}
					</div>

					{/* Recent Tasks - Mobile */}
					{project.tasks.length > 0 && (
						<div>
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-medium text-sm">Последние задачи</h3>
								<Button variant="ghost" size="sm" className="h-7 text-xs">
									<Plus className="mr-1 h-3 w-3" />
									Добавить
								</Button>
							</div>

							<Card className="divide-y">
								{project.tasks.slice(0, 3).map((task) => (
									<div
										key={task._id}
										className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
									>
										<div className="flex min-w-0 items-center gap-3">
											<div
												className={cn(
													"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
													task.status?.name.includes("завершено")
														? "bg-green-100"
														: "bg-gray-100",
												)}
											>
												{task.status?.name.includes("завершено") ? (
													<CheckCircle2 className="h-3 w-3 text-green-600" />
												) : (
													<Circle className="h-3 w-3 text-gray-600" />
												)}
											</div>
											<div className="min-w-0">
												<p className="truncate font-medium text-sm">
													{task.title}
												</p>
												<p className="text-muted-foreground text-xs">
													{task.identifier}
												</p>
											</div>
										</div>
										{task.dueDate && (
											<span className="flex-shrink-0 text-muted-foreground text-xs">
												{format(parseISO(task.dueDate), "d MMM", {
													locale: ru,
												})}
											</span>
										)}
									</div>
								))}
								{project.tasks.length > 3 && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-full text-xs"
									>
										Показать все {project.tasks.length} задач
									</Button>
								)}
							</Card>
						</div>
					)}

					{/* Notes - Mobile */}
					{project.notes && (
						<Card className="p-4">
							<h3 className="mb-2 font-medium text-sm">Заметки</h3>
							<p className="text-muted-foreground text-sm">{project.notes}</p>
						</Card>
					)}
				</div>
			</div>
		);
	}

	// Desktop view
	return (
		<div className="h-full overflow-auto">
			<Tabs defaultValue="overview" className="h-full">
				<div className="border-b px-6 pt-4">
					<TabsList className="grid w-full max-w-md grid-cols-3">
						<TabsTrigger value="overview" className="flex items-center gap-2">
							<TrendingUp className="h-4 w-4" />
							Обзор
						</TabsTrigger>
						<TabsTrigger value="finance" className="flex items-center gap-2">
							<Wallet className="h-4 w-4" />
							Финансы
						</TabsTrigger>
						<TabsTrigger value="documents" className="flex items-center gap-2">
							<FileText className="h-4 w-4" />
							Документы
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="overview" className="h-full mt-0">
					<div className="flex h-full">
						{/* Main Content */}
						<div className="flex-1 overflow-auto">
				<div className="space-y-6 p-6">
					{/* Header */}
					<motion.div
						className="space-y-4"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<h1 className="font-semibold text-2xl">{project.name}</h1>
								<p className="text-muted-foreground">
									Клиент: {project.client}
								</p>
								{project.notes && (
									<p className="mt-2 text-muted-foreground text-sm">
										{project.notes}
									</p>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Status Bar */}
						<div className="flex items-center gap-4 text-sm">
							{project.status && (
								<div
									className={cn(
										"flex items-center gap-1.5 rounded-md px-2 py-1",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.bg || "bg-gray-100",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.borderColor || "border-gray-200",
										"border",
									)}
								>
									<StatusIcon
										className={cn(
											"h-3.5 w-3.5",
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600",
										)}
									/>
									<span
										className={
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600"
										}
									>
										{project.status.name}
									</span>
								</div>
							)}

							{project.priority && (
								<Badge
									className={cn(
										"border-0",
										priorityStyles[
											project.priority.name as keyof typeof priorityStyles
										] || "bg-gray-100",
									)}
								>
									{project.priority.name} приоритет
								</Badge>
							)}

							{project.lead && (
								<div className="flex items-center gap-2">
									<User className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-muted-foreground">
										{project.lead.name}
									</span>
								</div>
							)}

							<div className="flex items-center gap-2">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="text-muted-foreground">
									{format(parseISO(project.startDate), "d MMM", { locale: ru })}{" "}
									→{" "}
									{project.targetDate
										? format(parseISO(project.targetDate), "d MMM yyyy", {
												locale: ru,
											})
										: "Не определено"}
								</span>
							</div>

							{daysUntilTarget !== null && (
								<div className="flex items-center gap-2">
									<Target className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-muted-foreground">
										{daysUntilTarget > 0
											? `${daysUntilTarget} дней до завершения`
											: "Просрочено"}
									</span>
								</div>
							)}
						</div>
					</motion.div>

					<Separator />

					{/* Progress Section */}
					<motion.div
						className="space-y-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
					>
						<div>
							<h2 className="mb-4 font-medium text-base">Прогресс проекта</h2>

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
								{/* Stats Cards */}
								<div className="space-y-4">
									<div className="grid grid-cols-3 gap-4">
										<Card className="border-muted p-4">
											<div className="mb-2 flex items-center justify-between">
												<div className="h-2 w-2 rounded-full bg-muted" />
												<span className="text-muted-foreground text-xs">
													Всего задач
												</span>
											</div>
											<div className="space-y-1">
												<p className="font-semibold text-2xl">
													{taskStats.total}
												</p>
												<p className="text-muted-foreground text-xs">
													В проекте
												</p>
											</div>
										</Card>

										<Card className="border-yellow-200 bg-yellow-50/50 p-4">
											<div className="mb-2 flex items-center justify-between">
												<div className="h-2 w-2 rounded-full bg-yellow-500" />
												<span className="text-muted-foreground text-xs">
													В работе
												</span>
											</div>
											<div className="space-y-1">
												<div className="flex items-baseline gap-2">
													<p className="font-semibold text-2xl">
														{taskStats.inProgress}
													</p>
													<span className="text-muted-foreground text-xs">
														•{" "}
														{taskStats.total > 0
															? Math.round(
																	(taskStats.inProgress / taskStats.total) *
																		100,
																)
															: 0}
														%
													</span>
												</div>
												<p className="text-muted-foreground text-xs">
													Выполняется
												</p>
											</div>
										</Card>

										<Card className="border-green-200 bg-green-50/50 p-4">
											<div className="mb-2 flex items-center justify-between">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span className="text-muted-foreground text-xs">
													завершено
												</span>
											</div>
											<div className="space-y-1">
												<div className="flex items-baseline gap-2">
													<p className="font-semibold text-2xl">
														{taskStats.completed}
													</p>
													<span className="text-muted-foreground text-xs">
														•{" "}
														{taskStats.total > 0
															? Math.round(
																	(taskStats.completed / taskStats.total) * 100,
																)
															: 0}
														%
													</span>
												</div>
												<p className="text-muted-foreground text-xs">
													завершено
												</p>
											</div>
										</Card>
									</div>

									{/* Overall Progress */}
									<Card className="p-4">
										<div className="mb-2 flex items-center justify-between">
											<h3 className="font-medium text-sm">Общий прогресс</h3>
											<span className="font-medium text-sm">
												{Math.round(progressPercentage)}%
											</span>
										</div>
										<div className="h-2 overflow-hidden rounded-full bg-muted">
											<motion.div
												className="h-full rounded-full bg-primary"
												initial={{ width: 0 }}
												animate={{ width: `${progressPercentage}%` }}
												transition={{ duration: 0.5 }}
											/>
										</div>
									</Card>

									{/* Pie Chart */}
									<Card className="p-4">
										<h3 className="mb-4 font-medium text-sm">
											Распределение задач
										</h3>
										<div className="h-[200px]">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={pieData}
														cx="50%"
														cy="50%"
														innerRadius={60}
														outerRadius={80}
														paddingAngle={2}
														dataKey="value"
													>
														{pieData.map((entry, index) => (
															<Cell key={`cell-${index}`} fill={entry.color} />
														))}
													</Pie>
													<Tooltip
														formatter={(value: number) => `${value} задач`}
														contentStyle={{
															backgroundColor: "var(--background)",
															border: "1px solid var(--border)",
															borderRadius: "6px",
															fontSize: "12px",
														}}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
										<div className="mt-4 flex items-center justify-center gap-4">
											{pieData.map((item) => (
												<div
													key={item.name}
													className="flex items-center gap-2"
												>
													<div
														className="h-3 w-3 rounded-sm"
														style={{ backgroundColor: item.color }}
													/>
													<span className="text-muted-foreground text-xs">
														{item.name} ({item.value})
													</span>
												</div>
											))}
										</div>
									</Card>
								</div>

								{/* Revenue Chart */}
								{revenueChartData.length > 0 && (
									<Card className="p-4">
										<div className="mb-4 flex items-center justify-between">
											<h3 className="font-medium text-sm">
												Выручка по месяцам
											</h3>
											<span className="text-muted-foreground text-xs">
												План vs Факт
											</span>
										</div>
										<div className="h-[300px]">
											<ResponsiveContainer width="100%" height="100%">
												<BarChart data={revenueChartData}>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke="hsl(var(--border))"
													/>
													<XAxis
														dataKey="month"
														stroke="hsl(var(--muted-foreground))"
														fontSize={12}
														tickLine={false}
														axisLine={false}
													/>
													<YAxis
														stroke="hsl(var(--muted-foreground))"
														fontSize={12}
														tickLine={false}
														axisLine={false}
														tickFormatter={(value) => `${value / 1000000}M`}
													/>
													<Tooltip
														formatter={(value: number) => formatCurrency(value)}
														contentStyle={{
															backgroundColor: "var(--background)",
															border: "1px solid var(--border)",
															borderRadius: "6px",
															fontSize: "12px",
														}}
													/>
													<Bar
														dataKey="planned"
														fill="hsl(var(--muted))"
														radius={[4, 4, 0, 0]}
													/>
													<Bar
														dataKey="actual"
														fill="hsl(var(--primary))"
														radius={[4, 4, 0, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</Card>
								)}
							</div>
						</div>

						{/* Recent Tasks */}
						{project.tasks.length > 0 && (
							<div>
								<div className="mb-4 flex items-center justify-between">
									<h2 className="font-medium text-base">Последние задачи</h2>
									<Button variant="ghost" size="sm" className="h-8">
										<Plus className="mr-1 h-3.5 w-3.5" />
										Добавить задачу
									</Button>
								</div>

								<Card className="divide-y">
									{project.tasks.slice(0, 5).map((task) => (
										<div
											key={task._id}
											className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
										>
											<div className="flex items-center gap-3">
												<div
													className={cn(
														"flex h-8 w-8 items-center justify-center rounded-full",
														task.status?.name.includes("завершено")
															? "bg-green-100"
															: "bg-gray-100",
													)}
												>
													{task.status?.name.includes("завершено") ? (
														<CheckCircle2 className="h-4 w-4 text-green-600" />
													) : (
														<Circle className="h-4 w-4 text-gray-600" />
													)}
												</div>
												<div>
													<p className="font-medium text-sm">{task.title}</p>
													<p className="text-muted-foreground text-xs">
														{task.identifier} •{" "}
														{task.assignee?.name || "Не назначено"}
													</p>
												</div>
											</div>
											{task.dueDate && (
												<span className="text-muted-foreground text-xs">
													{format(parseISO(task.dueDate), "d MMM", {
														locale: ru,
													})}
												</span>
											)}
										</div>
									))}
								</Card>
							</div>
						)}
							</motion.div>
						</div>
					</div>

					{/* Sidebar */}
					<div className="w-80 space-y-6 border-l bg-muted/10 p-6">
				<div>
					<h3 className="mb-4 font-medium text-sm">Свойства проекта</h3>
					<div className="space-y-4">
						{/* Contract Value */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">
								Стоимость контракта
							</p>
							<div className="flex items-center gap-2">
								<DollarSign className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium text-sm">
									{formatCurrency(project.contractValue)}
								</span>
							</div>
						</div>

						{/* Location */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Местоположение</p>
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm">{project.location}</span>
							</div>
						</div>

						{/* Project Type */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Тип проекта</p>
							<div className="flex items-center gap-2">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<Badge variant="secondary" className="font-normal">
									{projectTypeLabels[project.projectType]}
								</Badge>
							</div>
						</div>

						{/* Status */}
						{project.status && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Статус</p>
								<div
									className={cn(
										"inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.bg || "bg-gray-100",
										statusStyles[
											project.status.name as keyof typeof statusStyles
										]?.borderColor || "border-gray-200",
										"border",
									)}
								>
									<StatusIcon
										className={cn(
											"h-3.5 w-3.5",
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600",
										)}
									/>
									<span
										className={
											statusStyles[
												project.status.name as keyof typeof statusStyles
											]?.color || "text-gray-600"
										}
									>
										{project.status.name}
									</span>
								</div>
							</div>
						)}

						{/* Priority */}
						{project.priority && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Приоритет</p>
								<Badge
									className={cn(
										"border-0",
										priorityStyles[
											project.priority.name as keyof typeof priorityStyles
										] || "bg-gray-100",
									)}
								>
									{project.priority.name}
								</Badge>
							</div>
						)}

						{/* Lead */}
						{project.lead && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Руководитель</p>
								<div className="flex items-center gap-2">
									<Avatar className="h-6 w-6">
										<AvatarImage src={project.lead.avatarUrl} />
										<AvatarFallback>{project.lead.name[0]}</AvatarFallback>
									</Avatar>
									<span className="text-sm">{project.lead.name}</span>
								</div>
							</div>
						)}

						{/* Team Members */}
						{project.teamMembers && project.teamMembers.length > 0 && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Команда</p>
								<div className="-space-x-2 flex">
									{project.teamMembers.slice(0, 5).map((member) => (
										<Avatar
											key={member._id}
											className="h-6 w-6 border-2 border-background"
										>
											<AvatarImage src={member.avatarUrl} />
											<AvatarFallback>{member.name[0]}</AvatarFallback>
										</Avatar>
									))}
									{project.teamMembers.length > 5 && (
										<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
											+{project.teamMembers.length - 5}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Dates */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Сроки</p>
							<div className="flex items-center gap-1 text-sm">
								<span>
									{format(parseISO(project.startDate), "d MMM yyyy", {
										locale: ru,
									})}
								</span>
								<span className="text-muted-foreground">→</span>
								<span>
									{project.targetDate
										? format(parseISO(project.targetDate), "d MMM yyyy", {
												locale: ru,
											})
										: "Не определено"}
								</span>
							</div>
						</div>

						{/* Health Status */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Состояние проекта</p>
							<div className="flex items-center gap-2">
								<div
									className="h-3 w-3 rounded-full"
									style={{ backgroundColor: project.healthColor }}
								/>
								<span className="text-sm">{project.healthName}</span>
							</div>
							{project.healthDescription && (
								<p className="mt-1 text-muted-foreground text-xs">
									{project.healthDescription}
								</p>
							)}
								</div>
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="finance" className="h-full mt-0">
					<Suspense fallback={<ProjectSkeleton />}>
						<ProjectFinanceTab projectId={projectId} />
					</Suspense>
				</TabsContent>

				<TabsContent value="documents" className="h-full mt-0">
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 className="font-medium text-lg">Документы проекта</h3>
							<p className="text-muted-foreground text-sm mt-2">Раздел документов в разработке</p>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function ProjectSkeleton() {
	return (
		<div className="flex h-full">
			<div className="flex-1 space-y-6 p-6">
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-48" />
					<div className="flex gap-4">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-6 w-24" />
					</div>
				</div>
				<Separator />
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4">
							<Skeleton className="h-24" />
							<Skeleton className="h-24" />
							<Skeleton className="h-24" />
						</div>
						<Skeleton className="h-64" />
					</div>
					<Skeleton className="h-96" />
				</div>
			</div>
			<div className="w-80 border-l p-6">
				<Skeleton className="h-full" />
			</div>
		</div>
	);
}
