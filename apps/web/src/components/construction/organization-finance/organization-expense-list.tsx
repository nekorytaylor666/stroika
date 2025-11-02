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
import { useQuery } from "convex/react";
import {
	Briefcase,
	Building,
	Car,
	FileText,
	Hammer,
	Home,
	Package,
	Shield,
	Zap,
} from "lucide-react";
import { useState } from "react";
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

interface OrganizationExpenseListProps {
	organizationId: string;
	selectedPeriod?: string;
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

const CATEGORY_ICONS = {
	materials: Package,
	labor: Hammer,
	equipment: Briefcase,
	transport: Car,
	utilities: Zap,
	permits: FileText,
	insurance: Shield,
	taxes: Building,
	other: Home,
};

// Status display names
const STATUS_NAMES: Record<string, string> = {
	pending: "Ожидается",
	approved: "Одобрено",
	paid: "Оплачено",
	rejected: "Отклонено",
	cancelled: "Отменено",
};

export function OrganizationExpenseList({
	selectedPeriod,
}: OrganizationExpenseListProps) {
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

	// Fetch expenses by category
	const expenseData = useQuery(
		api.finance.reports.getOrganizationExpensesByCategory,
		{
			period: selectedPeriod,
			status: statusFilter === "all" ? undefined : (statusFilter as any),
		},
	);


	if (!expenseData) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	// Prepare data for pie chart
	const pieChartData = expenseData.categories
		.filter((cat) => cat.total > 0)
		.map((cat) => ({
			name: cat.displayName,
			value: cat.total,
			category: cat.category,
		}));

	// Prepare data for trend chart
	const trendChartData = expenseData.trend.map((month) => ({
		month: new Date(month.month + "-01").toLocaleDateString("ru-RU", {
			month: "short",
			year: "numeric",
		}),
		...month,
	}));

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold">Расходы организации</h2>
					<p className="text-muted-foreground mt-1">
						Анализ расходов по категориям и проектам
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="Статус" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Все статусы</SelectItem>
							<SelectItem value="pending">Ожидается</SelectItem>
							<SelectItem value="approved">Одобрено</SelectItem>
							<SelectItem value="paid">Оплачено</SelectItem>
							<SelectItem value="rejected">Отклонено</SelectItem>
							<SelectItem value="cancelled">Отменено</SelectItem>
						</SelectContent>
					</Select>
					<Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="chart">Графики</SelectItem>
							<SelectItem value="table">Таблица</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Summary Card */}
			<Card>
				<CardHeader>
					<CardTitle>Общие расходы</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold">{formatCurrency(expenseData.total)}</div>
					<p className="text-sm text-muted-foreground mt-1">
						Период: {expenseData.period === "all" ? "Все время" : expenseData.period}
						{expenseData.status !== "all" && ` • Статус: ${STATUS_NAMES[expenseData.status]}`}
					</p>
				</CardContent>
			</Card>

			{viewMode === "chart" ? (
				<>
					{/* Charts Row */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Category Distribution Pie Chart */}
						<Card>
							<CardHeader>
								<CardTitle>Распределение по категориям</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={pieChartData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={(entry) => `${entry.percentage?.toFixed(1) || 0}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{pieChartData.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={
														CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS] ||
														"#000"
													}
												/>
											))}
										</Pie>
										<Tooltip formatter={(value: number) => formatCurrency(value)} />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Trend Chart */}
						<Card>
							<CardHeader>
								<CardTitle>Динамика расходов (6 месяцев)</CardTitle>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={trendChartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
										<Tooltip
											formatter={(value: number) => formatCurrency(value)}
											labelStyle={{ color: "black" }}
										/>
										<Line
											type="monotone"
											dataKey="total"
											stroke="#3b82f6"
											strokeWidth={2}
											name="Общие расходы"
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					{/* Category Breakdown Bar Chart */}
					<Card>
						<CardHeader>
							<CardTitle>Месячная динамика по категориям</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={trendChartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" />
									<YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
									<Tooltip
										formatter={(value: number) => formatCurrency(value)}
										labelStyle={{ color: "black" }}
									/>
									<Legend />
									<Bar dataKey="materials" stackId="a" fill={CATEGORY_COLORS.materials} name="Материалы" />
									<Bar dataKey="labor" stackId="a" fill={CATEGORY_COLORS.labor} name="Работа" />
									<Bar dataKey="equipment" stackId="a" fill={CATEGORY_COLORS.equipment} name="Оборудование" />
									<Bar dataKey="transport" stackId="a" fill={CATEGORY_COLORS.transport} name="Транспорт" />
									<Bar dataKey="utilities" stackId="a" fill={CATEGORY_COLORS.utilities} name="Коммунальные" />
									<Bar dataKey="permits" stackId="a" fill={CATEGORY_COLORS.permits} name="Разрешения" />
									<Bar dataKey="insurance" stackId="a" fill={CATEGORY_COLORS.insurance} name="Страхование" />
									<Bar dataKey="taxes" stackId="a" fill={CATEGORY_COLORS.taxes} name="Налоги" />
									<Bar dataKey="other" stackId="a" fill={CATEGORY_COLORS.other} name="Другое" />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</>
			) : (
				/* Table View */
				<Card>
					<CardHeader>
						<CardTitle>Расходы по категориям</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Категория</TableHead>
									<TableHead className="text-right">Сумма</TableHead>
									<TableHead className="text-right">Процент</TableHead>
									<TableHead className="text-right">Количество</TableHead>
									<TableHead>Топ поставщики</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{expenseData.categories.map((category) => {
									const Icon = CATEGORY_ICONS[category.category as keyof typeof CATEGORY_ICONS];
									return (
										<TableRow key={category.category}>
											<TableCell>
												<div className="flex items-center gap-2">
													{Icon && (
														<div
															className="p-1 rounded"
															style={{
																backgroundColor: `${CATEGORY_COLORS[category.category as keyof typeof CATEGORY_COLORS]}20`,
																color:
																	CATEGORY_COLORS[
																		category.category as keyof typeof CATEGORY_COLORS
																	],
															}}
														>
															<Icon className="h-4 w-4" />
														</div>
													)}
													<span className="font-medium">{category.displayName}</span>
												</div>
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(category.total)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Progress
														value={category.percentage}
														className="w-16 h-2"
														style={{
															backgroundColor: `${CATEGORY_COLORS[category.category as keyof typeof CATEGORY_COLORS]}20`,
														}}
													/>
													<span className="text-sm text-muted-foreground w-12 text-right">
														{category.percentage.toFixed(1)}%
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="outline">{category.count}</Badge>
											</TableCell>
											<TableCell>
												<div className="space-y-1">
													{category.topVendors.slice(0, 2).map((vendor, index) => (
														<div
															key={index}
															className="text-xs text-muted-foreground"
														>
															<span className="font-medium">{vendor.vendor}:</span>{" "}
															{formatCurrency(vendor.amount)}
														</div>
													))}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
								{/* Total Row */}
								<TableRow className="font-semibold bg-muted/50">
									<TableCell>Итого</TableCell>
									<TableCell className="text-right">{formatCurrency(expenseData.total)}</TableCell>
									<TableCell className="text-right">100%</TableCell>
									<TableCell className="text-right">
										<Badge variant="outline">
											{expenseData.categories.reduce((sum, cat) => sum + cat.count, 0)}
										</Badge>
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}