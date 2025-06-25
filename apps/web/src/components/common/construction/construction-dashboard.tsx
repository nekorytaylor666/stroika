"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useConstructionData } from "@/hooks/use-construction-data";
import {
	AlertTriangle,
	Building,
	CheckCircle,
	DollarSign,
	TrendingUp,
	Users,
} from "lucide-react";

export default function ConstructionDashboard() {
	const { projects, teams, totalContractValue, isLoading } =
		useConstructionData();

	if (isLoading) {
		return (
			<div className="flex w-full items-center justify-center p-8">
				<div className="text-muted-foreground text-sm">
					Загружаем данные панели управления...
				</div>
			</div>
		);
	}

	// Calculate key metrics
	const totalProjects = projects?.length || 0;
	const activeProjects =
		projects?.filter((p) => p.statusId !== "completed").length || 0;
	const completedProjects =
		projects?.filter((p) => p.statusId === "completed").length || 0;
	const projectsAtRisk =
		projects?.filter(
			(p) => p.healthId === "at-risk" || p.healthId === "off-track",
		).length || 0;

	const averageProgress =
		totalProjects > 0
			? Math.round(
					projects.reduce((sum, project) => sum + project.percentComplete, 0) /
						totalProjects,
				)
			: 0;

	// Team workload analytics
	const overloadedTeams =
		teams?.filter((team) => team.workload > 90).length || 0;
	const averageTeamWorkload =
		teams?.length > 0
			? Math.round(
					teams.reduce((sum, team) => sum + team.workload, 0) / teams.length,
				)
			: 0;

	// Mock revenue data for current period (since we don't have this in Convex yet)
	const currentMonthRevenue = { planned: 20000000, actual: 19500000 };
	const revenueVariance =
		((currentMonthRevenue.actual - currentMonthRevenue.planned) /
			currentMonthRevenue.planned) *
		100;

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ru-KZ", {
			style: "currency",
			currency: "KZT",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<div className="w-full space-y-6 p-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{/* Total Contract Value */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Общая стоимость контрактов
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{formatCurrency(totalContractValue)}
						</div>
						<p className="text-muted-foreground text-xs">Портфель проектов</p>
					</CardContent>
				</Card>

				{/* Active Projects */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Активные проекты
						</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{activeProjects}</div>
						<p className="text-muted-foreground text-xs">
							Из {totalProjects} общих проектов
						</p>
						<div className="mt-2 flex gap-2">
							<Badge variant="outline" className="text-xs">
								<CheckCircle className="mr-1 h-3 w-3" />
								{completedProjects} завершено
							</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Average Progress */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Средний прогресс
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{averageProgress}%</div>
						<Progress value={averageProgress} className="mt-2" />
						<p className="mt-1 text-muted-foreground text-xs">
							По всем проектам
						</p>
					</CardContent>
				</Card>

				{/* Projects at Risk */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Проекты в зоне риска
						</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-600">
							{projectsAtRisk}
						</div>
						<p className="text-muted-foreground text-xs">Требуют внимания</p>
						{projectsAtRisk > 0 && (
							<Badge variant="destructive" className="mt-2 text-xs">
								Высокий приоритет
							</Badge>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Monthly Revenue Performance */}
				<Card>
					<CardHeader>
						<CardTitle>Выручка за текущий месяц</CardTitle>
						<CardDescription>Июнь 2024 - План vs Факт</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">Запланировано:</span>
								<span className="font-semibold">
									{formatCurrency(currentMonthRevenue.planned)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Фактически:</span>
								<span
									className={`font-semibold ${revenueVariance >= 0 ? "text-green-600" : "text-red-600"}`}
								>
									{formatCurrency(currentMonthRevenue.actual)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Отклонение:</span>
								<Badge
									variant={revenueVariance >= 0 ? "default" : "destructive"}
								>
									{revenueVariance > 0 ? "+" : ""}
									{revenueVariance.toFixed(1)}%
								</Badge>
							</div>
							<Progress
								value={
									(currentMonthRevenue.actual / currentMonthRevenue.planned) *
									100
								}
								className="mt-4"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Team Workload Overview */}
				<Card>
					<CardHeader>
						<CardTitle>Загруженность команд</CardTitle>
						<CardDescription>Текущий уровень загрузки отделов</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">Средняя загруженность:</span>
								<span className="font-semibold">{averageTeamWorkload}%</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Перегруженные команды:</span>
								<Badge
									variant={overloadedTeams > 0 ? "destructive" : "default"}
								>
									{overloadedTeams} команд
								</Badge>
							</div>
							<Progress value={averageTeamWorkload} className="mt-4" />
							<div className="space-y-2">
								{teams
									?.filter((team) => team.workload > 85)
									.sort((a, b) => b.workload - a.workload)
									.slice(0, 3)
									.map((team) => (
										<div
											key={team._id}
											className="flex items-center justify-between text-xs"
										>
											<span>{team.shortName}</span>
											<Badge
												variant={
													team.workload > 90 ? "destructive" : "secondary"
												}
											>
												{team.workload}%
											</Badge>
										</div>
									))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Project Health Distribution */}
			<Card>
				<CardHeader>
					<CardTitle>Распределение проектов по статусу здоровья</CardTitle>
					<CardDescription>
						Текущее состояние всех проектов в портфеле
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{["on-track", "at-risk", "off-track", "no-update"].map(
							(healthId) => {
								const count =
									projects?.filter((p) => p.healthId === healthId).length || 0;
								const percentage =
									totalProjects > 0 ? (count / totalProjects) * 100 : 0;
								const healthNames = {
									"on-track": "В графике",
									"at-risk": "Под угрозой",
									"off-track": "Отстает",
									"no-update": "Нет обновлений",
								};
								const healthColors = {
									"on-track": "text-green-600",
									"at-risk": "text-yellow-600",
									"off-track": "text-red-600",
									"no-update": "text-gray-600",
								};

								return (
									<div
										key={healthId}
										className="rounded-lg border p-4 text-center"
									>
										<div
											className={`font-bold text-2xl ${healthColors[healthId]}`}
										>
											{count}
										</div>
										<div className="font-medium text-sm">
											{healthNames[healthId]}
										</div>
										<div className="text-muted-foreground text-xs">
											{percentage.toFixed(1)}%
										</div>
									</div>
								);
							},
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
