"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import {
	AlertTriangle,
	TrendingUp,
} from "lucide-react";
import {
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

interface FinanceOverviewProps {
	financialOverview: any;
	budgetSummary: any;
	onSelectPeriod: (period: string | undefined) => void;
}

// Currency formatter
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: "KZT",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
};

// Percentage formatter
const formatPercentage = (value: number) => {
	return `${value.toFixed(1)}%`;
};

// Category colors for charts
const CATEGORY_COLORS = {
	materials: "#3b82f6", // blue
	labor: "#10b981", // green
	equipment: "#f59e0b", // amber
	transport: "#8b5cf6", // violet
	utilities: "#ec4899", // pink
	permits: "#14b8a6", // teal
	insurance: "#f43f5e", // rose
	taxes: "#6b7280", // gray
	other: "#78716c", // stone
};

const CATEGORY_NAMES: Record<string, string> = {
	materials: "Материалы",
	labor: "Работа",
	equipment: "Оборудование",
	transport: "Транспорт",
	utilities: "Коммунальные услуги",
	permits: "Разрешения",
	insurance: "Страхование",
	taxes: "Налоги",
	other: "Другое",
};

export function FinanceOverview({
	financialOverview,
	budgetSummary,
	onSelectPeriod,
}: FinanceOverviewProps) {
	const navigate = useNavigate();

	// Prepare expense data for pie chart (use byCategory if available, fallback to byAccount)
	const expenseSource = financialOverview.expenses.byCategory && Object.keys(financialOverview.expenses.byCategory).length > 0
		? financialOverview.expenses.byCategory
		: financialOverview.expenses.byAccount || {};

	const expenseCategoryData = Object.entries(expenseSource)
		.map(([key, amount]) => ({
			name: CATEGORY_NAMES[key] || key, // Use translated name if available
			value: amount as number,
			category: key,
		}))
		.filter((item) => item.value > 0)
		.sort((a, b) => b.value - a.value);

	// Prepare cash flow trend data (last 6 months)
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const cashFlowData = useQuery(
		api.finance.reports.getOrganizationCashFlowByPeriod,
		{
			dateFrom: sixMonthsAgo.toISOString().slice(0, 10),
			dateTo: new Date().toISOString().slice(0, 10),
			groupBy: "month",
		},
	);

	// Format cash flow data for chart
	const cashFlowChartData = cashFlowData?.data.map((item: any) => ({
		month: new Date(item.period + "-01").toLocaleDateString("ru-RU", {
			month: "short",
		}),
		incoming: item.incoming,
		outgoing: item.outgoing,
		net: item.net,
	})) || [];

	// Navigate to project finance page
	const navigateToProject = (projectId: Id<"constructionProjects">) => {
		navigate({
			to: "/construction/$orgId/projects/$projectId/finance",
			params: {
				orgId: financialOverview.organization.id || financialOverview.organization._id,
				projectId: projectId as string,
			},
		});
	};

	return (
		<div className="space-y-6">
			{/* Period Selector */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Финансовый обзор</h2>
				<Select onValueChange={onSelectPeriod}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Выберите период" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Все время</SelectItem>
						<SelectItem value={new Date().toISOString().slice(0, 7)}>
							Текущий месяц
						</SelectItem>
						<SelectItem
							value={
								new Date(
									new Date().getFullYear(),
									new Date().getMonth() - 1,
									1,
								)
									.toISOString()
									.slice(0, 7)
							}
						>
							Прошлый месяц
						</SelectItem>
						<SelectItem
							value={`${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`}
						>
							Текущий квартал
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Cash Flow Trend Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Динамика денежного потока</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={cashFlowChartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
								<Tooltip
									formatter={(value: number) => formatCurrency(value)}
									labelStyle={{ color: "black" }}
								/>
								<Legend />
								<Line
									type="monotone"
									dataKey="incoming"
									stroke="#10b981"
									strokeWidth={2}
									name="Поступления"
								/>
								<Line
									type="monotone"
									dataKey="outgoing"
									stroke="#ef4444"
									strokeWidth={2}
									name="Расходы"
								/>
								<Line
									type="monotone"
									dataKey="net"
									stroke="#3b82f6"
									strokeWidth={2}
									strokeDasharray="5 5"
									name="Чистый поток"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Expense Distribution Pie Chart */}
				<Card>
					<CardHeader>
						<CardTitle>Распределение расходов</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={expenseCategoryData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={(entry: any) => `${formatPercentage((entry.value / (financialOverview.expenses.totalPaid || financialOverview.expenses.total)) * 100)}`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{expenseCategoryData.map((entry, index) => {
										// Use category colors if available, otherwise use palette
										const color = CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS];
										const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e", "#6b7280", "#78716c"];
										return (
											<Cell
												key={`cell-${index}`}
												fill={color || colors[index % colors.length]}
											/>
										);
									})}
								</Pie>
								<Tooltip formatter={(value: number) => formatCurrency(value)} />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* Budget Utilization */}
			{budgetSummary && budgetSummary.summary.projectsWithBudgets > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Использование бюджета</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div className="flex justify-between mb-2">
								<span className="text-sm font-medium">
									Общий бюджет организации
								</span>
								<span className="text-sm text-muted-foreground">
									{formatPercentage(budgetSummary.summary.utilization)} использовано
								</span>
							</div>
							<Progress
								value={budgetSummary.summary.utilization}
								className={`h-3 ${
									budgetSummary.summary.utilization > 100
										? "bg-red-100"
										: budgetSummary.summary.utilization > 80
											? "bg-yellow-100"
											: "bg-green-100"
								}`}
							/>
							<div className="flex justify-between mt-2 text-sm">
								<span>{formatCurrency(budgetSummary.summary.totalSpent)} потрачено</span>
								<span>{formatCurrency(budgetSummary.summary.totalBudgeted)} бюджет</span>
							</div>
						</div>

						{/* Projects over budget warning */}
						{budgetSummary.summary.projectsOverBudget > 0 && (
							<div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700">
								<AlertTriangle className="h-4 w-4" />
								<span className="text-sm">
									{budgetSummary.summary.projectsOverBudget} проектов превысили бюджет
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Top and Bottom Projects Tables */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top Performing Projects */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-green-600" />
							Топ прибыльные проекты
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Проект</TableHead>
									<TableHead className="text-right">Маржа</TableHead>
									<TableHead className="text-right">Баланс</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{financialOverview.topProjects.slice(0, 5).map((project: any) => (
									<TableRow
										key={project.projectId}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => navigateToProject(project.projectId)}
									>
										<TableCell>
											<div>
												<div className="font-medium">{project.name}</div>
												<div className="text-sm text-muted-foreground">
													{project.client}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<Badge
												variant="outline"
												className="bg-green-50 text-green-700 border-green-200"
											>
												{formatPercentage(project.profitMargin)}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium text-green-600">
											{formatCurrency(project.balance)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* Projects at Risk */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-red-600" />
							Проекты требующие внимания
						</CardTitle>
					</CardHeader>
					<CardContent>
						{financialOverview.projectsAtRisk.length > 0 ? (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Проект</TableHead>
										<TableHead className="text-right">Убыток</TableHead>
										<TableHead className="text-right">Статус</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{financialOverview.projectsAtRisk.slice(0, 5).map((project: any) => (
										<TableRow
											key={project.projectId}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => navigateToProject(project.projectId)}
										>
											<TableCell>
												<div>
													<div className="font-medium">{project.name}</div>
													<div className="text-sm text-muted-foreground">
														{project.client}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right font-medium text-red-600">
												{formatCurrency(Math.abs(project.balance))}
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="destructive">В убытке</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="text-center py-8 text-muted-foreground">
								Все проекты прибыльны
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}