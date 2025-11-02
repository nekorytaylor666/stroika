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
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronRight,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface ProjectComparisonProps {
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

// Percentage formatter
const formatPercentage = (value: number) => {
	return `${value.toFixed(1)}%`;
};

type SortField = "profitMargin" | "revenue" | "expenses" | "balance";

export function ProjectComparison({ organizationId }: ProjectComparisonProps) {
	const navigate = useNavigate();
	const [sortBy, setSortBy] = useState<SortField>("profitMargin");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// Fetch project rankings
	const projectRankings = useQuery(
		api.finance.reports.getProjectFinancialRankings,
		{
			sortBy,
			limit: 100, // Get all projects
		},
	);

	// Navigate to project finance page
	const navigateToProject = (projectId: Id<"constructionProjects">) => {
		navigate({
			to: "/construction/$orgId/projects/$projectId/finance",
			params: {
				orgId: organizationId,
				projectId: projectId as string,
			},
		});
	};

	// Handle sort
	const handleSort = (field: SortField) => {
		if (sortBy === field) {
			// Toggle order if same field
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			// New field, default to descending
			setSortBy(field);
			setSortOrder("desc");
		}
	};

	// Sort data based on current settings
	const sortedProjects = projectRankings
		? [...projectRankings].sort((a, b) => {
				const multiplier = sortOrder === "asc" ? 1 : -1;
				switch (sortBy) {
					case "profitMargin":
						return (b.profitMargin - a.profitMargin) * multiplier;
					case "revenue":
						return (b.revenue - a.revenue) * multiplier;
					case "expenses":
						return (b.expenses - a.expenses) * multiplier;
					case "balance":
						return (b.balance - a.balance) * multiplier;
					default:
						return 0;
				}
			})
		: [];

	// Get status badge variant
	const getStatusVariant = (status: string) => {
		switch (status) {
			case "active":
				return "default";
			case "completed":
				return "default"; // Changed from "success" as it doesn't exist
			case "on_hold":
				return "secondary";
			case "cancelled":
				return "destructive";
			default:
				return "outline";
		}
	};

	// Get status display name
	const getStatusName = (status: string) => {
		const statusNames: Record<string, string> = {
			active: "Активный",
			completed: "Завершен",
			on_hold: "Приостановлен",
			cancelled: "Отменен",
			planning: "Планирование",
			"in-progress": "В процессе",
		};
		return statusNames[status] || status;
	};

	// Calculate totals
	const totals = sortedProjects.reduce(
		(acc, project) => ({
			contractValue: acc.contractValue + project.contractValue,
			revenue: acc.revenue + project.revenue,
			expenses: acc.expenses + project.expenses,
			balance: acc.balance + project.balance,
			budget: acc.budget + project.budget,
		}),
		{ contractValue: 0, revenue: 0, expenses: 0, balance: 0, budget: 0 },
	);

	const avgProfitMargin =
		totals.revenue > 0 ? (totals.balance / totals.revenue) * 100 : 0;

	if (!projectRankings) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold">Сравнение проектов</h2>
					<p className="text-muted-foreground mt-1">
						Финансовые показатели всех проектов организации
					</p>
				</div>
				<Select value={sortBy} onValueChange={(value) => setSortBy(value as SortField)}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Сортировать по" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="profitMargin">Маржа прибыли</SelectItem>
						<SelectItem value="revenue">Выручка</SelectItem>
						<SelectItem value="expenses">Расходы</SelectItem>
						<SelectItem value="balance">Баланс</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Общая стоимость контрактов
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold">
							{formatCurrency(totals.contractValue)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold">{formatCurrency(totals.revenue)}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-xl font-bold">{formatCurrency(totals.expenses)}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-xl font-bold ${
								totals.balance >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{formatCurrency(totals.balance)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Средняя маржа</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							className={`text-xl font-bold ${
								avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"
							}`}
						>
							{formatPercentage(avgProfitMargin)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Projects Table */}
			<Card>
				<CardHeader>
					<CardTitle>Все проекты ({sortedProjects.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[200px]">Проект</TableHead>
									<TableHead>Статус</TableHead>
									<TableHead>Прогресс</TableHead>
									<TableHead className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8"
											onClick={() => handleSort("revenue")}
										>
											Выручка
											{sortBy === "revenue" ? (
												sortOrder === "desc" ? (
													<ArrowDown className="ml-2 h-4 w-4" />
												) : (
													<ArrowUp className="ml-2 h-4 w-4" />
												)
											) : (
												<ArrowUpDown className="ml-2 h-4 w-4" />
											)}
										</Button>
									</TableHead>
									<TableHead className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8"
											onClick={() => handleSort("expenses")}
										>
											Расходы
											{sortBy === "expenses" ? (
												sortOrder === "desc" ? (
													<ArrowDown className="ml-2 h-4 w-4" />
												) : (
													<ArrowUp className="ml-2 h-4 w-4" />
												)
											) : (
												<ArrowUpDown className="ml-2 h-4 w-4" />
											)}
										</Button>
									</TableHead>
									<TableHead className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8"
											onClick={() => handleSort("balance")}
										>
											Баланс
											{sortBy === "balance" ? (
												sortOrder === "desc" ? (
													<ArrowDown className="ml-2 h-4 w-4" />
												) : (
													<ArrowUp className="ml-2 h-4 w-4" />
												)
											) : (
												<ArrowUpDown className="ml-2 h-4 w-4" />
											)}
										</Button>
									</TableHead>
									<TableHead className="text-right">
										<Button
											variant="ghost"
											size="sm"
											className="-ml-3 h-8"
											onClick={() => handleSort("profitMargin")}
										>
											Маржа
											{sortBy === "profitMargin" ? (
												sortOrder === "desc" ? (
													<ArrowDown className="ml-2 h-4 w-4" />
												) : (
													<ArrowUp className="ml-2 h-4 w-4" />
												)
											) : (
												<ArrowUpDown className="ml-2 h-4 w-4" />
											)}
										</Button>
									</TableHead>
									<TableHead className="w-[50px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{sortedProjects.map((project) => (
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
										<TableCell>
											<Badge variant={getStatusVariant(project.status)}>
												{getStatusName(project.status)}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<div className="w-20">
													<div className="h-2 bg-muted rounded-full overflow-hidden">
														<div
															className="h-full bg-primary transition-all"
															style={{ width: `${project.percentComplete}%` }}
														/>
													</div>
												</div>
												<span className="text-sm text-muted-foreground">
													{project.percentComplete}%
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(project.revenue)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(project.expenses)}
										</TableCell>
										<TableCell className="text-right">
											<div
												className={`font-medium flex items-center justify-end gap-1 ${
													project.balance >= 0 ? "text-green-600" : "text-red-600"
												}`}
											>
												{project.balance >= 0 ? (
													<TrendingUp className="h-4 w-4" />
												) : (
													<TrendingDown className="h-4 w-4" />
												)}
												{formatCurrency(Math.abs(project.balance))}
											</div>
										</TableCell>
										<TableCell className="text-right">
											<Badge
												variant="outline"
												className={
													project.profitMargin >= 20
														? "bg-green-50 text-green-700 border-green-200"
														: project.profitMargin >= 10
															? "bg-blue-50 text-blue-700 border-blue-200"
															: project.profitMargin >= 0
																? "bg-yellow-50 text-yellow-700 border-yellow-200"
																: "bg-red-50 text-red-700 border-red-200"
												}
											>
												{formatPercentage(project.profitMargin)}
											</Badge>
										</TableCell>
										<TableCell>
											<ChevronRight className="h-4 w-4 text-muted-foreground" />
										</TableCell>
									</TableRow>
								))}

								{/* Totals Row */}
								<TableRow className="font-semibold bg-muted/50">
									<TableCell>Итого</TableCell>
									<TableCell></TableCell>
									<TableCell></TableCell>
									<TableCell className="text-right">
										{formatCurrency(totals.revenue)}
									</TableCell>
									<TableCell className="text-right">
										{formatCurrency(totals.expenses)}
									</TableCell>
									<TableCell className="text-right">
										<div
											className={`flex items-center justify-end gap-1 ${
												totals.balance >= 0 ? "text-green-600" : "text-red-600"
											}`}
										>
											{totals.balance >= 0 ? (
												<TrendingUp className="h-4 w-4" />
											) : (
												<TrendingDown className="h-4 w-4" />
											)}
											{formatCurrency(Math.abs(totals.balance))}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<Badge
											variant="outline"
											className={
												avgProfitMargin >= 20
													? "bg-green-50 text-green-700 border-green-200"
													: avgProfitMargin >= 10
														? "bg-blue-50 text-blue-700 border-blue-200"
														: avgProfitMargin >= 0
															? "bg-yellow-50 text-yellow-700 border-yellow-200"
															: "bg-red-50 text-red-700 border-red-200"
											}
										>
											{formatPercentage(avgProfitMargin)}
										</Badge>
									</TableCell>
									<TableCell></TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}