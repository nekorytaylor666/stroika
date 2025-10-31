"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Banknote,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Circle,
	CircleDot,
	Clock,
	DollarSign,
	FileText,
	MapPin,
	MoreHorizontal,
	Plus,
	Target,
	TrendingUp,
	Wallet,
	XIcon,
} from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { LegalDocumentsSidebar } from "./legal-documents/legal-documents-sidebar";
import {
	EditableDate,
	EditableNumber,
	EditableSelect,
	EditableText,
	EditableTextarea,
	EditableUserSelect,
} from "./project-overview/editable";
import { ProjectTimelineChart } from "./project-timeline-chart";

interface ConstructionProjectOverviewProps {
	projectId: Id<"constructionProjects">;
}

const statusStyles = {
	"К выполнению": {
		icon: Circle,
		color: "text-gray-600",
		bg: "bg-gray-100",
		borderColor: "border-gray-200",
	},
	"В работе": {
		icon: CircleDot,
		color: "text-yellow-700",
		bg: "bg-yellow-100",
		borderColor: "border-yellow-200",
	},
	"На проверке": {
		icon: Clock,
		color: "text-blue-700",
		bg: "bg-blue-100",
		borderColor: "border-blue-200",
	},
	Завершено: {
		icon: CheckCircle2,
		color: "text-green-700",
		bg: "bg-green-100",
		borderColor: "border-green-200",
	},
	Отменено: {
		icon: XIcon,
		color: "text-red-700",
		bg: "bg-red-100",
		borderColor: "border-red-200",
	},
};

const priorityStyles = {
	Низкий: "bg-gray-100 text-gray-700",
	Средний: "bg-blue-100 text-blue-700",
	Высокий: "bg-orange-100 text-orange-700",
	Критический: "bg-red-100 text-red-700",
};

export function ConstructionProjectOverview({
	projectId,
}: ConstructionProjectOverviewProps) {
	const isMobile = useMobile();
	const [showFinanceDetails, setShowFinanceDetails] = React.useState(false);

	const projectData = useQuery(api.constructionProjects.getProjectWithTasks, {
		id: projectId,
	});
	const statuses = useQuery(api.metadata.getAllStatus);
	const priorities = useQuery(api.metadata.getAllPriorities);
	const allUsers = useQuery(api.users.getAll);

	// Finance queries
	const financialOverview = useQuery(
		api.finance.reports.getProjectFinancialOverview,
		{
			projectId,
		},
	);
	const recentPayments = useQuery(api.finance.payments.listByProject, {
		projectId,
		limit: 5,
	});
	const pendingPayments = useQuery(api.finance.payments.listByProject, {
		projectId,
		status: "pending",
	});
	const budget = useQuery(api.finance.budgets.getProjectBudget, {
		projectId,
	});
	const budgetVariance = budget
		? useQuery(api.finance.budgets.getBudgetVariance, {
				budgetId: budget._id,
			})
		: undefined;

	const updateProject = useMutation(api.constructionProjects.update);
	const updateStatus = useMutation(api.constructionProjects.updateStatus);

	const navigate = useNavigate();
	const params = useParams({
		from: "/construction/$orgId/projects/$projectId/overview",
	});

	// Filter out null values and map to UserOption format
	const users = allUsers
		?.filter((user): user is NonNullable<typeof user> => user !== null)
		.map((user) => ({
			_id: user.id,
			name: user.name,
			email: user.email,
			avatarUrl: user.image,
			role: user.role,
		}));

	if (!projectData) {
		return <ProjectOverviewSkeleton />;
	}

	const { taskStats } = projectData;
	const progressPercentage =
		taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

	const StatusIcon =
		statusStyles[projectData.status?.name as keyof typeof statusStyles]?.icon ||
		Circle;

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	// Mobile view
	if (isMobile) {
		return (
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				exit={{ opacity: 0, x: -20 }}
				className="flex h-full flex-col bg-background"
			>
				{/* Mobile Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							{projectData.status && (
								<div
									className={cn(
										"flex h-6 w-6 items-center justify-center rounded",
										statusStyles[
											projectData.status.name as keyof typeof statusStyles
										]?.bg,
										statusStyles[
											projectData.status.name as keyof typeof statusStyles
										]?.color,
									)}
								>
									<StatusIcon className="h-3 w-3" />
								</div>
							)}
							<span className="max-w-40 truncate font-medium text-sm">
								{projectData.name}
							</span>
						</div>
					</div>
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</div>

				{/* Mobile Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="space-y-0 p-4">
						{/* Project Name */}
						<div className="mb-6">
							<EditableText
								value={projectData.name}
								onSave={async (value) => {
									await updateProject({ id: projectId, name: value });
								}}
								variant="h1"
								placeholder="Название проекта"
								className="font-semibold text-xl"
							/>
						</div>

						{/* Status Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">Статус</span>
							</div>
							<div className="flex items-center gap-2">
								{statuses && (
									<EditableSelect
										value={projectData.status?._id || ""}
										options={statuses.map((status) => {
											return {
												value: status._id,
												label: status.name,
												className: cn(
													"border-0",
													statusStyles[status.name as keyof typeof statusStyles]
														?.bg,
													statusStyles[status.name as keyof typeof statusStyles]
														?.borderColor,
													statusStyles[status.name as keyof typeof statusStyles]
														?.color,
												),
											};
										})}
										onSave={async (value) => {
											await updateStatus({
												id: projectId,
												statusId: value as Id<"status">,
											});
										}}
										placeholder="Выберите статус"
										searchable={false}
									/>
								)}
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Priority Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">Приоритет</span>
							</div>
							<div className="flex items-center gap-2">
								{priorities && (
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
										placeholder="Выберите приоритет"
										searchable={false}
									/>
								)}
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Lead Row */}
						<div className="-mx-4 flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">
									Руководитель
								</span>
							</div>
							{users && (
								<EditableUserSelect
									value={projectData.lead?._id || null}
									users={users}
									onSave={async (value) => {
										if (value) {
											await updateProject({ id: projectId, leadId: value });
										}
									}}
									placeholder="Выберите руководителя"
									multiple={false}
								/>
							)}
						</div>

						{/* Client Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<Building2 className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Клиент</span>
							</div>
							<div className="flex items-center gap-2">
								<EditableText
									value={projectData.client}
									onSave={async (value) => {
										await updateProject({ id: projectId, client: value });
									}}
									placeholder="Имя клиента"
									className="text-sm"
								/>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Location Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">
									Местоположение
								</span>
							</div>
							<div className="flex items-center gap-2">
								<EditableText
									value={projectData.location}
									onSave={async (value) => {
										await updateProject({ id: projectId, location: value });
									}}
									placeholder="Местоположение"
									className="text-sm"
								/>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Contract Value Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<DollarSign className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Стоимость</span>
							</div>
							<div className="flex items-center gap-2">
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
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						{/* Start Date Row */}
						<div className="-mx-4 flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">
									Дата начала
								</span>
							</div>
							<EditableDate
								value={projectData.startDate}
								onSave={async (value) => {
									await updateProject({
										id: projectId,
										startDate: value || new Date().toISOString(),
									});
								}}
								placeholder="Дата начала"
								allowClear={false}
							/>
						</div>

						{/* Target Date Row */}
						<div className="-mx-4 flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<Target className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground text-sm">Цель</span>
							</div>
							<EditableDate
								value={projectData.targetDate}
								onSave={async (value) => {
									await updateProject({
										id: projectId,
										targetDate: value || undefined,
									});
								}}
								placeholder="Целевая дата"
								minDate={new Date(projectData.startDate)}
							/>
						</div>

						{/* Project Type Row */}
						<div className="-mx-4 flex cursor-pointer items-center justify-between p-3 hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<span className="text-muted-foreground text-sm">
									Тип проекта
								</span>
							</div>
							<div className="flex items-center gap-2">
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
									placeholder="Выберите тип"
									searchable={false}
								/>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</div>
						</div>

						<Separator className="my-4" />

						{/* Progress Section */}
						<div className="space-y-4">
							<h2 className="font-medium text-base">Прогресс</h2>

							{/* Stats Cards */}
							<div className="grid grid-cols-3 gap-3">
								<Card className="border-muted p-3">
									<div className="space-y-1">
										<p className="font-semibold text-lg">{taskStats.total}</p>
										<p className="text-muted-foreground text-xs">Всего</p>
									</div>
								</Card>

								<Card className="border-yellow-200 bg-yellow-50/50 p-3">
									<div className="space-y-1">
										<p className="font-semibold text-lg">
											{taskStats.inProgress}
										</p>
										<p className="text-muted-foreground text-xs">В работе</p>
									</div>
								</Card>

								<Card className="border-green-200 bg-green-50/50 p-3">
									<div className="space-y-1">
										<p className="font-semibold text-lg">
											{taskStats.completed}
										</p>
										<p className="text-muted-foreground text-xs">Готово</p>
									</div>
								</Card>
							</div>

							{/* Progress Bar */}
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span>Выполнено</span>
									<span className="font-medium">
										{Math.round(progressPercentage)}%
									</span>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full bg-primary transition-all"
										style={{ width: `${progressPercentage}%` }}
									/>
								</div>
							</div>
						</div>

						<Separator className="my-4" />

						{/* Finance Section (Mobile) */}
						<div className="space-y-4">
							<h2 className="font-medium text-base">Финансы</h2>

							{/* Finance Summary Cards */}
							<div className="grid grid-cols-2 gap-3">
								<Card className="p-3">
									<div className="space-y-1">
										<p className="font-semibold text-green-600 text-lg">
											{formatCurrency(
												financialOverview?.payments?.totalIncoming || 0,
											)}
										</p>
										<p className="text-muted-foreground text-xs">Поступления</p>
									</div>
								</Card>

								<Card className="p-3">
									<div className="space-y-1">
										<p className="font-semibold text-lg text-red-600">
											{formatCurrency(
												financialOverview?.payments?.totalOutgoing || 0,
											)}
										</p>
										<p className="text-muted-foreground text-xs">Платежи</p>
									</div>
								</Card>
							</div>

							{/* Pending Payments Badge */}
							{pendingPayments && pendingPayments.length > 0 && (
								<Card className="border-yellow-200 bg-yellow-50/50 p-3">
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<p className="font-medium text-sm">
												{formatCurrency(
													pendingPayments.reduce((sum, p) => sum + p.amount, 0),
												)}
											</p>
											<p className="text-muted-foreground text-xs">
												Ожидает оплаты ({pendingPayments.length})
											</p>
										</div>
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</div>
								</Card>
							)}
						</div>

						<Separator className="my-4" />

						{/* Recent Tasks */}
						{projectData.tasks && projectData.tasks.length > 0 && (
							<div className="pb-6">
								<div className="mb-3 flex items-center justify-between">
									<h2 className="font-medium text-base">Последние задачи</h2>
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
								</div>

								<div className="space-y-2">
									{projectData.tasks.slice(0, 3).map((task) => (
										<div
											key={task._id}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<div
													className={cn(
														"flex h-6 w-6 flex-shrink-0 items-center justify-center rounded font-medium text-xs",
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
												<div className="min-w-0 flex-1">
													<p className="truncate font-medium text-sm">
														{task.title}
													</p>
													<div className="flex items-center gap-2 text-muted-foreground text-xs">
														{task.assignee && (
															<span className="truncate">
																{task.assignee.name}
															</span>
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
											<Badge
												variant="outline"
												className="flex-shrink-0 text-xs"
											>
												{task.status?.name}
											</Badge>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</motion.div>
		);
	}

	// Desktop view
	return (
		<div className="flex h-full">
			{/* Main Content */}
			<div className="flex-1">
				<ScrollArea className="h-full">
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
										placeholder="Название проекта"
									/>
									<div className="flex items-center gap-4 text-muted-foreground text-sm">
										<div className="flex items-center gap-1">
											<Building2 className="h-3.5 w-3.5" />
											<EditableText
												value={projectData.client}
												onSave={async (value) => {
													await updateProject({ id: projectId, client: value });
												}}
												placeholder="Имя клиента"
												className="text-sm"
											/>
										</div>
										<div className="flex items-center gap-1">
											<MapPin className="h-3.5 w-3.5" />
											<EditableText
												value={projectData.location}
												onSave={async (value) => {
													await updateProject({
														id: projectId,
														location: value,
													});
												}}
												placeholder="Местоположение"
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
											return {
												value: status._id,
												label: status.name,
												className: cn(
													"border-0",
													statusStyles[status.name as keyof typeof statusStyles]
														?.bg,
													statusStyles[status.name as keyof typeof statusStyles]
														?.borderColor,
													statusStyles[status.name as keyof typeof statusStyles]
														?.color,
												),
											};
										})}
										onSave={async (value) => {
											await updateStatus({
												id: projectId,
												statusId: value as Id<"status">,
											});
										}}
										placeholder="Выберите статус"
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
										placeholder="Выберите приоритет"
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
										placeholder="Выберите руководителя"
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
										placeholder="Дата начала"
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
										placeholder="Целевая дата"
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

								<div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
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
														завершено
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
													<p className="text-muted-foreground text-xs">
														завершено
													</p>
												</div>
											</Card>
										</div>

										{/* Timeline Chart */}
										<ProjectTimelineChart
											projectData={{ ...projectData, _id: projectId }}
										/>
									</div>
								</div>
							</div>

							{/* Finance Section */}
							<div>
								<div className="mb-4 flex items-center justify-between">
									<h2 className="font-medium text-base">Финансы</h2>
									<Button asChild variant="ghost" size="sm" className="h-8">
										<Link
											to="/construction/$orgId/projects/$projectId/finance"
											params={{
												orgId: params.orgId,
												projectId: projectData._id,
											}}
										>
											{showFinanceDetails ? "Скрыть" : "Показать детали"}
										</Link>
									</Button>
								</div>

								{/* Finance Summary Cards */}
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
									<Card className="p-4">
										<div className="mb-2 flex items-center justify-between">
											<Wallet className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium text-green-600 text-xs">
												+12%
											</span>
										</div>
										<div className="space-y-1">
											<p className="font-semibold text-2xl text-green-600">
												{formatCurrency(
													financialOverview?.payments?.totalIncoming || 0,
												)}
											</p>
											<p className="text-muted-foreground text-xs">
												Поступления
											</p>
										</div>
									</Card>

									<Card className="p-4">
										<div className="mb-2 flex items-center justify-between">
											<Banknote className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium text-red-600 text-xs">
												-8%
											</span>
										</div>
										<div className="space-y-1">
											<p className="font-semibold text-2xl text-red-600">
												{formatCurrency(
													financialOverview?.payments?.totalOutgoing || 0,
												)}
											</p>
											<p className="text-muted-foreground text-xs">Платежи</p>
										</div>
									</Card>

									<Card className="p-4">
										<div className="mb-2 flex items-center justify-between">
											<TrendingUp className="h-4 w-4 text-muted-foreground" />
											<span
												className={`font-medium text-xs ${
													(financialOverview?.balance?.profitMargin || 0) >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{(
													financialOverview?.balance?.profitMargin || 0
												).toFixed(1)}
												%
											</span>
										</div>
										<div className="space-y-1">
											<p
												className={`font-semibold text-2xl ${
													(financialOverview?.balance?.currentBalance || 0) >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												{formatCurrency(
													financialOverview?.balance?.currentBalance || 0,
												)}
											</p>
											<p className="text-muted-foreground text-xs">
												Баланс / Рентабельность
											</p>
										</div>
									</Card>

									<Card className="p-4">
										<div className="mb-2 flex items-center justify-between">
											<FileText className="h-4 w-4 text-muted-foreground" />
											<Badge variant="outline" className="text-xs">
												{pendingPayments?.length || 0}
											</Badge>
										</div>
										<div className="space-y-1">
											<p className="font-semibold text-2xl">
												{formatCurrency(
													pendingPayments?.reduce(
														(sum, p) => sum + p.amount,
														0,
													) || 0,
												)}
											</p>
											<p className="text-muted-foreground text-xs">
												Ожидает оплаты
											</p>
										</div>
									</Card>
								</div>

								{/* Finance Details (collapsible) */}
								{showFinanceDetails && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										className="mt-6 space-y-6"
									>
										{/* Recent Payments */}
										<div>
											<div className="mb-3 flex items-center justify-between">
												<h3 className="font-medium text-sm">
													Последние платежи
												</h3>
												<Button variant="ghost" size="sm" className="h-8">
													<Plus className="mr-1 h-3.5 w-3.5" />
													Добавить платеж
												</Button>
											</div>
											<Card className="p-4">
												<div className="space-y-3">
													{recentPayments?.slice(0, 5).map((payment) => (
														<div
															key={payment._id}
															className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
														>
															<div className="flex items-center gap-3">
																<div
																	className={cn(
																		"flex h-8 w-8 items-center justify-center rounded",
																		payment.type === "income"
																			? "bg-green-100 text-green-700"
																			: "bg-red-100 text-red-700",
																	)}
																>
																	{payment.type === "income" ? (
																		<TrendingUp className="h-4 w-4" />
																	) : (
																		<Banknote className="h-4 w-4" />
																	)}
																</div>
																<div>
																	<p className="font-medium text-sm">
																		{payment.description}
																	</p>
																	<p className="text-muted-foreground text-xs">
																		{payment.paymentNumber} •{" "}
																		{format(
																			new Date(payment.date),
																			"d MMM yyyy",
																			{
																				locale: ru,
																			},
																		)}
																	</p>
																</div>
															</div>
															<div className="flex items-center gap-2">
																<span
																	className={cn(
																		"font-semibold text-sm",
																		payment.type === "income"
																			? "text-green-700"
																			: "text-red-700",
																	)}
																>
																	{payment.type === "income" ? "+" : "-"}
																	{formatCurrency(payment.amount)}
																</span>
																<Badge
																	variant="outline"
																	className={cn(
																		"text-xs",
																		payment.status === "pending" &&
																			"border-yellow-200 bg-yellow-50 text-yellow-700",
																		payment.status === "confirmed" &&
																			"border-blue-200 bg-blue-50 text-blue-700",
																		payment.status === "posted" &&
																			"border-green-200 bg-green-50 text-green-700",
																	)}
																>
																	{payment.status === "pending" && "Ожидает"}
																	{payment.status === "confirmed" &&
																		"Подтвержден"}
																	{payment.status === "posted" && "Проведен"}
																</Badge>
															</div>
														</div>
													))}

													{(!recentPayments || recentPayments.length === 0) && (
														<div className="py-8 text-center text-muted-foreground text-sm">
															Нет платежей
														</div>
													)}
												</div>
											</Card>
										</div>

										{/* Budget vs Actual */}
										{budget && (
											<div>
												<h3 className="mb-3 font-medium text-sm">
													Бюджет проекта
												</h3>
												<Card className="p-4">
													<div className="space-y-4">
														<div className="grid grid-cols-3 gap-4">
															<div>
																<p className="text-muted-foreground text-xs">
																	План
																</p>
																<p className="font-semibold text-lg">
																	{formatCurrency(budget.totalBudget)}
																</p>
															</div>
															<div>
																<p className="text-muted-foreground text-xs">
																	Факт
																</p>
																<p className="font-semibold text-lg">
																	{formatCurrency(
																		budgetVariance?.actualTotal || 0,
																	)}
																</p>
															</div>
															<div>
																<p className="text-muted-foreground text-xs">
																	Отклонение
																</p>
																<p
																	className={cn(
																		"font-semibold text-lg",
																		(budgetVariance?.varianceTotal || 0) > 0
																			? "text-green-600"
																			: "text-red-600",
																	)}
																>
																	{formatCurrency(
																		budgetVariance?.varianceTotal || 0,
																	)}
																</p>
															</div>
														</div>

														<div className="h-2 overflow-hidden rounded-full bg-muted">
															<div
																className="h-full bg-primary transition-all"
																style={{
																	width: `${Math.min(
																		100,
																		((budgetVariance?.actualTotal || 0) /
																			budget.totalBudget) *
																			100,
																	)}%`,
																}}
															/>
														</div>
													</div>
												</Card>
											</div>
										)}
									</motion.div>
								)}
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
															<p className="font-medium text-sm">
																{task.title}
															</p>
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
				</ScrollArea>
			</div>

			{/* Sidebar */}
			<div className="hidden border-l bg-muted/10 lg:block lg:w-80">
				<ScrollArea className="h-full">
					<div className="space-y-6 p-6">
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
														statusStyles[
															status.name as keyof typeof statusStyles
														]?.bg,
														statusStyles[
															status.name as keyof typeof statusStyles
														]?.borderColor,
														statusStyles[
															status.name as keyof typeof statusStyles
														]?.color,
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
											placeholder="Выберите статус"
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
											placeholder="Выберите приоритет"
											searchable={false}
										/>
									</div>
								)}

								{/* Lead */}
								{users && (
									<div className="space-y-1.5">
										<p className="text-muted-foreground text-xs">
											Руководитель
										</p>
										<EditableUserSelect
											value={projectData.lead?._id || null}
											users={users}
											onSave={async (value) => {
												if (value) {
													await updateProject({ id: projectId, leadId: value });
												}
											}}
											placeholder="Выберите руководителя"
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
												? format(
														new Date(projectData.targetDate),
														"d MMM yyyy",
														{
															locale: ru,
														},
													)
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
										placeholder="Выберите тип"
										searchable={false}
									/>
								</div>

								{/* Location */}
								<div className="space-y-1.5">
									<p className="text-muted-foreground text-xs">
										Местоположение
									</p>
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
											await updateProject({
												id: projectId,
												contractValue: value,
											});
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

						{/* Legal Documents Section */}
						<Separator className="my-4" />
						<LegalDocumentsSidebar projectId={projectId} />
					</div>
				</ScrollArea>
			</div>
		</div>
	);
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
