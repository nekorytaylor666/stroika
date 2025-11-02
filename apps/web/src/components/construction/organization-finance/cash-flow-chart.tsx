"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Legend,
} from "recharts";

interface CashFlowChartProps {
	organizationId: string;
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

// Compact currency formatter for chart axes
const formatCompactCurrency = (value: number) => {
	const absValue = Math.abs(value);
	if (absValue >= 1000000000) {
		return `${(value / 1000000000).toFixed(1)}B`;
	}
	if (absValue >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	}
	if (absValue >= 1000) {
		return `${(value / 1000).toFixed(0)}K`;
	}
	return value.toString();
};

type ChartType = "line" | "bar" | "area";
type GroupBy = "day" | "week" | "month";
type DateRange = "1m" | "3m" | "6m" | "1y" | "all";

export function CashFlowChart({ }: CashFlowChartProps) {
	const [chartType, setChartType] = useState<ChartType>("line");
	const [groupBy, setGroupBy] = useState<GroupBy>("month");
	const [dateRange, setDateRange] = useState<DateRange>("6m");

	// Calculate date range
	const getDateRange = (): { from: string; to: string } => {
		const to = new Date();
		const from = new Date();

		switch (dateRange) {
			case "1m":
				from.setMonth(from.getMonth() - 1);
				break;
			case "3m":
				from.setMonth(from.getMonth() - 3);
				break;
			case "6m":
				from.setMonth(from.getMonth() - 6);
				break;
			case "1y":
				from.setFullYear(from.getFullYear() - 1);
				break;
			case "all":
				from.setFullYear(2020, 0, 1); // Set to a very old date
				break;
		}

		return {
			from: from.toISOString().slice(0, 10),
			to: to.toISOString().slice(0, 10),
		};
	};

	const { from, to } = getDateRange();

	// Fetch cash flow data
	const cashFlowData = useQuery(
		api.finance.reports.getOrganizationCashFlowByPeriod,
		{
			dateFrom: from,
			dateTo: to,
			groupBy,
		},
	);

	if (!cashFlowData) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	// Format data for chart
	const chartData = cashFlowData.data.map((item: any) => {
		let formattedPeriod: string;

		if (groupBy === "day") {
			formattedPeriod = new Date(item.period).toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "short",
			});
		} else if (groupBy === "week") {
			formattedPeriod = item.period;
		} else {
			// month
			formattedPeriod = new Date(item.period + "-01").toLocaleDateString("ru-RU", {
				month: "short",
				year: "numeric",
			});
		}

		return {
			period: formattedPeriod,
			incoming: item.incoming,
			outgoing: item.outgoing,
			net: item.net,
			cumulative: item.cumulative,
		};
	});

	// Calculate summary statistics
	const summary = cashFlowData.summary;
	const avgMonthlyIncoming = chartData.length > 0 ? summary.totalIncoming / chartData.length : 0;
	const avgMonthlyOutgoing = chartData.length > 0 ? summary.totalOutgoing / chartData.length : 0;
	const avgMonthlyNet = chartData.length > 0 ? summary.netCashFlow / chartData.length : 0;

	// Find max and min periods
	const maxPeriod = chartData.length > 0
		? chartData.reduce((max: any, item: any) =>
			item.net > max.net ? item : max,
		)
		: { net: 0, period: '' };
	const minPeriod = chartData.length > 0
		? chartData.reduce((min: any, item: any) =>
			item.net < min.net ? item : min,
		)
		: { net: 0, period: '' };

	// Render chart based on type
	const renderChart = () => {
		const commonProps = {
			data: chartData,
			margin: { top: 5, right: 30, left: 20, bottom: 5 },
		};

		switch (chartType) {
			case "bar":
				return (
					<BarChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="period" />
						<YAxis tickFormatter={formatCompactCurrency} />
						<Tooltip
							formatter={(value: number) => formatCurrency(value)}
							labelStyle={{ color: "black" }}
						/>
						<Legend />
						<Bar dataKey="incoming" fill="#10b981" name="Поступления" />
						<Bar dataKey="outgoing" fill="#ef4444" name="Расходы" />
					</BarChart>
				);
			case "area":
				return (
					<AreaChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="period" />
						<YAxis tickFormatter={formatCompactCurrency} />
						<Tooltip
							formatter={(value: number) => formatCurrency(value)}
							labelStyle={{ color: "black" }}
						/>
						<Legend />
						<Area
							type="monotone"
							dataKey="incoming"
							stackId="1"
							stroke="#10b981"
							fill="#10b981"
							fillOpacity={0.6}
							name="Поступления"
						/>
						<Area
							type="monotone"
							dataKey="outgoing"
							stackId="2"
							stroke="#ef4444"
							fill="#ef4444"
							fillOpacity={0.6}
							name="Расходы"
						/>
						<Line
							type="monotone"
							dataKey="cumulative"
							stroke="#3b82f6"
							strokeWidth={2}
							strokeDasharray="5 5"
							name="Накопленный"
						/>
					</AreaChart>
				);
			default:
				// line chart
				return (
					<LineChart {...commonProps}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="period" />
						<YAxis tickFormatter={formatCompactCurrency} />
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
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="outgoing"
							stroke="#ef4444"
							strokeWidth={2}
							name="Расходы"
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="net"
							stroke="#3b82f6"
							strokeWidth={2}
							strokeDasharray="5 5"
							name="Чистый поток"
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="cumulative"
							stroke="#8b5cf6"
							strokeWidth={2}
							name="Накопленный"
							dot={false}
						/>
					</LineChart>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold">Анализ денежного потока</h2>
					<p className="text-muted-foreground mt-1">
						Динамика поступлений и расходов организации
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="1m">1 месяц</SelectItem>
							<SelectItem value="3m">3 месяца</SelectItem>
							<SelectItem value="6m">6 месяцев</SelectItem>
							<SelectItem value="1y">1 год</SelectItem>
							<SelectItem value="all">Все время</SelectItem>
						</SelectContent>
					</Select>
					<Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="day">По дням</SelectItem>
							<SelectItem value="week">По неделям</SelectItem>
							<SelectItem value="month">По месяцам</SelectItem>
						</SelectContent>
					</Select>
					<Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="line">Линейный</SelectItem>
							<SelectItem value="bar">Столбчатый</SelectItem>
							<SelectItem value="area">Площадной</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Всего поступлений</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold text-green-600">
							{formatCurrency(summary.totalIncoming)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							В среднем {formatCurrency(avgMonthlyIncoming)} / {groupBy === "day" ? "день" : groupBy === "week" ? "неделя" : "месяц"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Всего расходов</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold text-red-600">
							{formatCurrency(summary.totalOutgoing)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							В среднем {formatCurrency(avgMonthlyOutgoing)} / {groupBy === "day" ? "день" : groupBy === "week" ? "неделя" : "месяц"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Чистый денежный поток</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-xl font-bold ${
								summary.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{formatCurrency(summary.netCashFlow)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							В среднем {formatCurrency(avgMonthlyNet)} / {groupBy === "day" ? "день" : groupBy === "week" ? "неделя" : "месяц"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-xl font-bold ${
								chartData[chartData.length - 1]?.cumulative >= 0
									? "text-blue-600"
									: "text-red-600"
							}`}
						>
							{formatCurrency(chartData[chartData.length - 1]?.cumulative || 0)}
						</div>
						<p className="text-xs text-muted-foreground mt-1">Накопленный баланс</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Chart */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Динамика денежного потока</span>
						<div className="flex items-center gap-2">
							{maxPeriod.net > 0 && (
								<Badge variant="outline" className="bg-green-50 text-green-700">
									<TrendingUp className="h-3 w-3 mr-1" />
									Лучший: {maxPeriod.period}
								</Badge>
							)}
							{minPeriod.net < 0 && (
								<Badge variant="outline" className="bg-red-50 text-red-700">
									<TrendingDown className="h-3 w-3 mr-1" />
									Худший: {minPeriod.period}
								</Badge>
							)}
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={400}>
						{renderChart()}
					</ResponsiveContainer>
				</CardContent>
			</Card>

			{/* Detailed Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span>Детализация по периодам</span>
						<Button variant="outline" size="sm" className="gap-2">
							<Download className="h-4 w-4" />
							Экспорт
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-b">
								<tr>
									<th className="text-left py-2">Период</th>
									<th className="text-right py-2">Поступления</th>
									<th className="text-right py-2">Расходы</th>
									<th className="text-right py-2">Чистый поток</th>
									<th className="text-right py-2">Накопленный</th>
								</tr>
							</thead>
							<tbody>
								{chartData.slice().reverse().map((item: any, index: number) => (
									<tr key={index} className="border-b">
										<td className="py-2">{item.period}</td>
										<td className="text-right py-2 text-green-600">
											+{formatCurrency(item.incoming)}
										</td>
										<td className="text-right py-2 text-red-600">
											-{formatCurrency(item.outgoing)}
										</td>
										<td
											className={`text-right py-2 font-medium ${
												item.net >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{item.net >= 0 ? "+" : ""}
											{formatCurrency(item.net)}
										</td>
										<td
											className={`text-right py-2 font-semibold ${
												item.cumulative >= 0 ? "text-blue-600" : "text-red-600"
											}`}
										>
											{formatCurrency(item.cumulative)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}