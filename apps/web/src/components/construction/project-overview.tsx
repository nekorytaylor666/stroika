"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Building2,
	Calendar,
	CheckCircle2,
	Circle,
	CircleDot,
	Clock,
	DollarSign,
	MapPin,
	MoreHorizontal,
	Plus,
	Tag,
	Target,
	User,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	EditableDate,
	EditableNumber,
	EditableSelect,
	EditableText,
	EditableTextarea,
	EditableUserSelect,
	type SelectOption,
} from "./project-overview/editable";

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
	Завершено: {
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
	Срочный: "bg-red-100 text-red-700",
};

const projectTypeTranslations = {
	residential: "Жилое",
	commercial: "Коммерческое",
	industrial: "Промышленное",
	infrastructure: "Инфраструктура",
};

export function ConstructionProjectOverview({
	projectId,
}: ConstructionProjectOverviewProps) {
	const projectData = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId,
	});
	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const users = useQuery(api.users.getAll);

	const updateProject = useMutation(api.constructionProjects.update);
	const updateStatus = useMutation(api.constructionProjects.updateStatus);

	const navigate = useNavigate();
	const params = useParams({
		from: "/construction/$orgId/projects/$projectId/overview",
	});

	if (!projectData) {
		return <ProjectOverviewSkeleton />;
	}

	const { taskStats } = projectData;
	const progressPercentage =
		taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;
	const targetDate = projectData.targetDate
		? new Date(projectData.targetDate)
		: new Date();
	const daysUntilTarget = differenceInDays(targetDate, new Date());

	const StatusIcon =
		statusStyles[projectData.status?.name as keyof typeof statusStyles]?.icon ||
		Circle;

	// Generate progress data from monthly revenue
	const progressChartData = generateProgressDataFromRevenue(
		projectData.monthlyRevenue || [],
	);

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
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
								<EditableText
									value={projectData.name}
									onSave={async (value) => {
										await updateProject({ id: projectId, name: value });
									}}
									variant="h1"
									placeholder="Project name"
								/>
								<div className="flex items-center gap-4 text-muted-foreground text-sm">
									<div className="flex items-center gap-1">
										<Building2 className="h-3.5 w-3.5" />
										<EditableText
											value={projectData.client}
											onSave={async (value) => {
												await updateProject({ id: projectId, client: value });
											}}
											placeholder="Client name"
											className="text-sm"
										/>
									</div>
									<div className="flex items-center gap-1">
										<MapPin className="h-3.5 w-3.5" />
										<EditableText
											value={projectData.location}
											onSave={async (value) => {
												await updateProject({ id: projectId, location: value });
											}}
											placeholder="Location"
											className="text-sm"
										/>
									</div>
									<div className="flex items-center gap-1">
										<DollarSign className="h-3.5 w-3.5" />
										<EditableNumber
											value={projectData.contractValue}
											onSave={async (value) => {
												await updateProject({
													id: projectId,
													contractValue: value,
												});
											}}
											formatValue={formatCurrency}
											min={0}
											step={1000000}
											className="text-sm"
										/>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Status Bar */}
						<div className="flex items-center gap-4 text-sm">
							{statuses && (
								<EditableSelect
									value={projectData.status?._id || ""}
									options={statuses.map((status) => {
										const Icon =
											statusStyles[status.name as keyof typeof statusStyles]
												?.icon || Circle;
										return {
											value: status._id,
											label: status.name,
											icon: <Icon className="h-3.5 w-3.5" />,
											className: cn(
												statusStyles[status.name as keyof typeof statusStyles]
													?.bg,
												statusStyles[status.name as keyof typeof statusStyles]
													?.borderColor,
												statusStyles[status.name as keyof typeof statusStyles]
													?.color,
												"border",
											),
										};
									})}
									onSave={async (value) => {
										await updateStatus({
											id: projectId,
											statusId: value as Id<"status">,
										});
									}}
									placeholder="Select status"
									searchable={false}
								/>
							)}

							{priorities && (
								<EditableSelect
									value={projectData.priority?._id || ""}
									options={priorities.map((priority) => ({
										value: priority._id,
										label: `${priority.name} приоритет`,
										className: cn(
											"border-0",
											priorityStyles[
												priority.name as keyof typeof priorityStyles
											],
										),
									}))}
									onSave={async (value) => {
										await updateProject({
											id: projectId,
											priorityId: value as Id<"priorities">,
										});
									}}
									placeholder="Select priority"
									searchable={false}
								/>
							)}

							{users && (
								<EditableUserSelect
									value={projectData.lead?._id || null}
									users={users}
									onSave={async (value) => {
										if (value) {
											await updateProject({ id: projectId, leadId: value });
										}
									}}
									placeholder="Select lead"
									multiple={false}
								/>
							)}

							<div className="flex items-center gap-2">
								<Calendar className="h-3.5 w-3.5 text-muted-foreground" />
								<EditableDate
									value={projectData.startDate}
									onSave={async (value) => {
										await updateProject({
											id: projectId,
											startDate: value || new Date().toISOString(),
										});
									}}
									placeholder="Start date"
									allowClear={false}
								/>
								<span className="text-muted-foreground">→</span>
								<EditableDate
									value={projectData.targetDate}
									onSave={async (value) => {
										await updateProject({
											id: projectId,
											targetDate: value || undefined,
										});
									}}
									placeholder="Target date"
									minDate={new Date(projectData.startDate)}
								/>
							</div>
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
							<h2 className="mb-4 font-medium text-base">Прогресс</h2>

							<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
								{/* Stats Cards */}
								<div className="space-y-4">
									<div className="grid grid-cols-3 gap-4">
										<Card className="border-muted p-4">
											<div className="mb-2 flex items-center justify-between">
												<div className="h-2 w-2 rounded-full bg-muted" />
												<span className="text-muted-foreground text-xs">
													Всего
												</span>
											</div>
											<div className="space-y-1">
												<p className="font-semibold text-2xl">
													{taskStats.total}
												</p>
												<p className="text-muted-foreground text-xs">
													Всего задач
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
													Завершено
												</span>
											</div>
											<div className="space-y-1">
												<div className="flex items-baseline gap-2">
													<p className="font-semibold text-2xl">
														{taskStats.completed}
													</p>
													<span className="text-muted-foreground text-xs">
														• {Math.round(progressPercentage)}%
													</span>
												</div>
												<p className="text-muted-foreground text-xs">Готово</p>
											</div>
										</Card>
									</div>

									{/* Timeline Chart */}
									<Card className="p-4">
										<h3 className="mb-4 font-medium text-sm">
											Прогресс по времени
										</h3>
										<div className="h-[200px]">
											<ResponsiveContainer width="100%" height="100%">
												<AreaChart data={generateTimelineData(projectData)}>
													<defs>
														<linearGradient
															id="colorTotal"
															x1="0"
															y1="0"
															x2="0"
															y2="1"
														>
															<stop
																offset="5%"
																stopColor="#E5E7EB"
																stopOpacity={0.3}
															/>
															<stop
																offset="95%"
																stopColor="#E5E7EB"
																stopOpacity={0}
															/>
														</linearGradient>
														<linearGradient
															id="colorInProgress"
															x1="0"
															y1="0"
															x2="0"
															y2="1"
														>
															<stop
																offset="5%"
																stopColor="hsl(45, 93%, 47%)"
																stopOpacity={0.3}
															/>
															<stop
																offset="95%"
																stopColor="hsl(45, 93%, 47%)"
																stopOpacity={0}
															/>
														</linearGradient>
														<linearGradient
															id="colorCompleted"
															x1="0"
															y1="0"
															x2="0"
															y2="1"
														>
															<stop
																offset="5%"
																stopColor="hsl(142, 76%, 36%)"
																stopOpacity={0.3}
															/>
															<stop
																offset="95%"
																stopColor="hsl(142, 76%, 36%)"
																stopOpacity={0}
															/>
														</linearGradient>
													</defs>
													<XAxis
														dataKey="date"
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
													/>
													<Tooltip
														formatter={(value: number) => `${value} задач`}
														contentStyle={{
															backgroundColor: "var(--background)",
															border: "1px solid var(--border)",
															borderRadius: "6px",
															fontSize: "12px",
														}}
													/>
													<Area
														type="monotone"
														dataKey="notStarted"
														stroke="#E5E7EB"
														fillOpacity={1}
														fill="url(#colorTotal)"
														strokeWidth={2}
													/>
													<Area
														type="monotone"
														dataKey="inProgress"
														stroke="hsl(45, 93%, 47%)"
														fillOpacity={1}
														fill="url(#colorInProgress)"
														strokeWidth={2}
													/>
													<Area
														type="monotone"
														dataKey="completed"
														stroke="hsl(142, 76%, 36%)"
														fillOpacity={1}
														fill="url(#colorCompleted)"
														strokeWidth={2}
													/>
												</AreaChart>
											</ResponsiveContainer>
										</div>
										<div className="mt-4 flex items-center justify-center gap-4">
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-sm"
													style={{ backgroundColor: "#E5E7EB" }}
												/>
												<span className="text-muted-foreground text-xs">
													Не начато
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-sm"
													style={{ backgroundColor: "hsl(45, 93%, 47%)" }}
												/>
												<span className="text-muted-foreground text-xs">
													В работе
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div
													className="h-3 w-3 rounded-sm"
													style={{ backgroundColor: "hsl(142, 76%, 36%)" }}
												/>
												<span className="text-muted-foreground text-xs">
													Завершено
												</span>
											</div>
										</div>
									</Card>
								</div>

								{/* Revenue Chart */}
								<Card className="p-4">
									<div className="mb-4 flex items-center justify-between">
										<h3 className="font-medium text-sm">Финансовый прогресс</h3>
										<span className="text-muted-foreground text-xs">
											{daysUntilTarget > 0
												? `${daysUntilTarget} дней осталось`
												: "Просрочено"}
										</span>
									</div>
									<div className="h-[300px]">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={progressChartData}>
												<CartesianGrid
													strokeDasharray="3 3"
													className="stroke-muted"
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
													fill="hsl(var(--primary))"
													opacity={0.5}
												/>
												<Bar dataKey="actual" fill="hsl(142, 76%, 36%)" />
											</BarChart>
										</ResponsiveContainer>
									</div>
								</Card>
							</div>
						</div>

						{/* Recent Tasks */}
						{projectData.tasks && projectData.tasks.length > 0 && (
							<div>
								<div className="mb-4 flex items-center justify-between">
									<h2 className="font-medium text-base">Последние задачи</h2>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											className="h-8"
											onClick={() =>
												navigate({
													to: "/construction/$orgId/projects/$projectId/tasks",
													params: {
														orgId: params.orgId,
														projectId: projectData._id,
													},
												})
											}
										>
											Все задачи
										</Button>
										<Button variant="ghost" size="sm" className="h-8">
											<Plus className="mr-1 h-3.5 w-3.5" />
											Добавить задачу
										</Button>
									</div>
								</div>

								<Card className="p-4">
									<div className="space-y-3">
										{projectData.tasks.slice(0, 5).map((task) => (
											<div
												key={task._id}
												className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
											>
												<div className="flex items-center gap-3">
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded font-medium text-xs",
															task.priority?.name === "Срочный"
																? "bg-red-100 text-red-700"
																: task.priority?.name === "Высокий"
																	? "bg-orange-100 text-orange-700"
																	: task.priority?.name === "Средний"
																		? "bg-blue-100 text-blue-700"
																		: "bg-gray-100 text-gray-700",
														)}
													>
														{task.identifier}
													</div>
													<div>
														<p className="font-medium text-sm">{task.title}</p>
														<div className="flex items-center gap-2 text-muted-foreground text-xs">
															{task.assignee && (
																<span>{task.assignee.name}</span>
															)}
															{task.dueDate && (
																<span>
																	•{" "}
																	{format(new Date(task.dueDate), "d MMM", {
																		locale: ru,
																	})}
																</span>
															)}
														</div>
													</div>
												</div>
												<Badge variant="outline" className="text-xs">
													{task.status?.name}
												</Badge>
											</div>
										))}
									</div>
								</Card>
							</div>
						)}
					</motion.div>
				</div>
			</div>

			{/* Sidebar */}
			<div className="w-80 space-y-6 border-l bg-muted/10 p-6">
				<div>
					<h3 className="mb-4 font-medium text-sm">Свойства</h3>
					<div className="space-y-4">
						{/* Status */}
						{statuses && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Статус</p>
								<EditableSelect
									value={projectData.status?._id || ""}
									options={statuses.map((status) => {
										const Icon =
											statusStyles[status.name as keyof typeof statusStyles]
												?.icon || Circle;
										return {
											value: status._id,
											label: status.name,
											icon: <Icon className="h-3.5 w-3.5" />,
											className: cn(
												statusStyles[status.name as keyof typeof statusStyles]
													?.bg,
												statusStyles[status.name as keyof typeof statusStyles]
													?.borderColor,
												statusStyles[status.name as keyof typeof statusStyles]
													?.color,
												"border",
											),
										};
									})}
									onSave={async (value) => {
										await updateStatus({
											id: projectId,
											statusId: value as Id<"status">,
										});
									}}
									placeholder="Select status"
									searchable={false}
								/>
							</div>
						)}

						{/* Priority */}
						{priorities && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Приоритет</p>
								<EditableSelect
									value={projectData.priority?._id || ""}
									options={priorities.map((priority) => ({
										value: priority._id,
										label: priority.name,
										className: cn(
											"border-0",
											priorityStyles[
												priority.name as keyof typeof priorityStyles
											],
										),
									}))}
									onSave={async (value) => {
										await updateProject({
											id: projectId,
											priorityId: value as Id<"priorities">,
										});
									}}
									placeholder="Select priority"
									searchable={false}
								/>
							</div>
						)}

						{/* Lead */}
						{users && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Руководитель</p>
								<EditableUserSelect
									value={projectData.lead?._id || null}
									users={users}
									onSave={async (value) => {
										if (value) {
											await updateProject({ id: projectId, leadId: value });
										}
									}}
									placeholder="Select lead"
									multiple={false}
								/>
							</div>
						)}

						{/* Members */}
						{users && (
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs">Участники</p>
								<EditableUserSelect
									value={projectData.teamMemberIds || []}
									users={users}
									onSave={async (value) => {
										await updateProject({
											id: projectId,
											teamMemberIds: value,
										});
									}}
									placeholder="Select team members"
									multiple={true}
								/>
							</div>
						)}

						{/* Dates */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Даты</p>
							<div className="flex items-center gap-1 text-sm">
								<span>
									{format(new Date(projectData.startDate), "d MMM", {
										locale: ru,
									})}
								</span>
								<span className="text-muted-foreground">→</span>
								<span>
									{projectData.targetDate
										? format(new Date(projectData.targetDate), "d MMM yyyy", {
												locale: ru,
											})
										: "Не определено"}
								</span>
							</div>
						</div>

						{/* Project Type */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Тип проекта</p>
							<EditableSelect
								value={projectData.projectType}
								options={[
									{ value: "residential", label: "Жилое" },
									{ value: "commercial", label: "Коммерческое" },
									{ value: "industrial", label: "Промышленное" },
									{ value: "infrastructure", label: "Инфраструктура" },
								]}
								onSave={async (value) => {
									await updateProject({
										id: projectId,
										projectType: value as
											| "residential"
											| "commercial"
											| "industrial"
											| "infrastructure",
									});
								}}
								placeholder="Select type"
								searchable={false}
							/>
						</div>

						{/* Location */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Местоположение</p>
							<EditableText
								value={projectData.location}
								onSave={async (value) => {
									await updateProject({ id: projectId, location: value });
								}}
								placeholder="Enter location"
								className="text-sm"
							/>
						</div>

						{/* Contract Value */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">
								Стоимость контракта
							</p>
							<EditableNumber
								value={projectData.contractValue}
								onSave={async (value) => {
									await updateProject({ id: projectId, contractValue: value });
								}}
								formatValue={formatCurrency}
								min={0}
								step={1000000}
								className="font-medium text-sm"
							/>
						</div>

						{/* Progress */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Прогресс</p>
							<div className="space-y-1">
								<div className="flex items-center justify-between text-sm">
									<span>Выполнено</span>
									<span className="font-medium">
										{projectData.percentComplete}%
									</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full bg-primary transition-all"
										style={{ width: `${projectData.percentComplete}%` }}
									/>
								</div>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs">Заметки</p>
							<EditableTextarea
								value={projectData.notes || ""}
								onSave={async (value) => {
									await updateProject({
										id: projectId,
										notes: value || undefined,
									});
								}}
								placeholder="Add notes..."
								className="text-muted-foreground text-sm"
								rows={4}
								maxLength={500}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Helper function to generate progress data from monthly revenue
function generateProgressDataFromRevenue(
	monthlyRevenue: Array<{ month: string; planned: number; actual: number }>,
) {
	if (!monthlyRevenue || monthlyRevenue.length === 0) {
		// Generate sample data if no revenue data
		return [
			{ month: "Янв", planned: 5000000, actual: 4500000 },
			{ month: "Фев", planned: 8000000, actual: 7200000 },
			{ month: "Мар", planned: 10000000, actual: 9500000 },
			{ month: "Апр", planned: 12000000, actual: 0 },
			{ month: "Май", planned: 15000000, actual: 0 },
		];
	}

	return monthlyRevenue.map((item) => ({
		month: item.month,
		planned: item.planned,
		actual: item.actual,
	}));
}

// Helper function to generate timeline data for task completion
function generateTimelineData(projectData: {
	startDate: string;
	targetDate?: string | null;
	taskStats: {
		total: number;
		completed: number;
		inProgress: number;
		notStarted: number;
	};
}) {
	const startDate = new Date(projectData.startDate);
	const targetDate = projectData.targetDate
		? new Date(projectData.targetDate)
		: new Date();
	const currentDate = new Date();

	// Generate data points from start to current date
	const dataPoints = [];
	const totalDays = differenceInDays(targetDate, startDate);
	const daysPassed = differenceInDays(currentDate, startDate);
	const daysToShow = Math.min(daysPassed, totalDays);

	// Create data points for every 7 days (weekly)
	for (let i = 0; i <= daysToShow; i += 7) {
		const date = new Date(startDate);
		date.setDate(date.getDate() + i);

		// Calculate expected completion based on linear progress
		const expectedProgress = (i / totalDays) * projectData.taskStats.total;

		// For demo purposes, show gradual completion
		// In real implementation, this would come from historical task data
		const progressRatio = i / daysToShow;

		// Simulate task progression over time
		const completedTasks = Math.min(
			Math.round(progressRatio * projectData.taskStats.completed),
			projectData.taskStats.completed,
		);

		const inProgressTasks = Math.min(
			Math.round(progressRatio * projectData.taskStats.inProgress),
			projectData.taskStats.inProgress,
		);

		// Not started tasks decrease as tasks move to in progress and completed
		const totalProgressedTasks = completedTasks + inProgressTasks;
		const notStartedTasks = Math.max(
			projectData.taskStats.total - totalProgressedTasks,
			projectData.taskStats.notStarted,
		);

		dataPoints.push({
			date: format(date, "d MMM", { locale: ru }),
			total: projectData.taskStats.total,
			completed: completedTasks,
			inProgress: inProgressTasks + completedTasks,
			notStarted: notStartedTasks + inProgressTasks + completedTasks,
			expected: Math.round(expectedProgress),
		});
	}

	// Add current state as the last point
	if (daysToShow > 0) {
		dataPoints.push({
			date: format(currentDate, "d MMM", { locale: ru }),
			total: projectData.taskStats.total,
			completed: projectData.taskStats.completed,
			inProgress:
				projectData.taskStats.completed + projectData.taskStats.inProgress,
			notStarted: projectData.taskStats.total,
			expected: Math.round(
				(daysPassed / totalDays) * projectData.taskStats.total,
			),
		});
	}

	return dataPoints;
}

// Skeleton loader
function ProjectOverviewSkeleton() {
	return (
		<div className="flex h-full">
			<div className="flex-1 space-y-6 p-6">
				<div className="space-y-4">
					<Skeleton className="h-8 w-64" />
					<div className="flex gap-4">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-6 w-32" />
					</div>
				</div>
				<Separator />
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4">
							<Skeleton className="h-32" />
							<Skeleton className="h-32" />
							<Skeleton className="h-32" />
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
