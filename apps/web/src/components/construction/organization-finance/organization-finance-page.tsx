"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	Building2,
	DollarSign,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { CashFlowChart } from "./cash-flow-chart";
import { FinanceOverview } from "./finance-overview";
import { OrganizationExpenseList } from "./organization-expense-list";
import { ProjectComparison } from "./project-comparison";

interface OrganizationFinancePageProps {
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

export function OrganizationFinancePage({
	organizationId,
}: OrganizationFinancePageProps) {
	const [activeTab, setActiveTab] = useState("overview");
	const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>();

	// Fetch organization financial overview
	const financialOverview = useQuery(
		api.finance.reports.getOrganizationFinancialOverview,
		{ period: selectedPeriod },
	);

	// Fetch budget summary
	const budgetSummary = useQuery(
		api.finance.reports.getOrganizationBudgetSummary,
	);

	// Loading state
	if (!financialOverview || !budgetSummary) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	// Calculate key metrics
	const totalRevenue = financialOverview.revenue.total;
	// Use totalPaid for display, as it represents actual money spent
	const totalExpenses = financialOverview.expenses.totalPaid || financialOverview.expenses.total;
	const netCashFlow = financialOverview.balance.netCashFlow || financialOverview.payments.netCashFlow;
	const netProfit = financialOverview.balance.currentBalance;
	const profitMargin = financialOverview.balance.profitMargin;

	return (
		<div className="h-full bg-background">
			<div className="p-6">
				<div className="mx-auto max-w-7xl space-y-6">
					{/* Header */}
					<div>
						<h1 className="text-3xl font-bold">Финансовый обзор организации</h1>
						<p className="text-muted-foreground mt-1">
							{financialOverview.organization.name} •{" "}
							{financialOverview.organization.activeProjects} активных проектов из{" "}
							{financialOverview.organization.totalProjects}
						</p>
					</div>

					{/* Summary Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Total Revenue Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Общая выручка
								</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{formatCurrency(totalRevenue)}
								</div>
								{financialOverview.payments.pendingIncoming > 0 && (
									<p className="text-xs text-muted-foreground mt-1">
										+{formatCurrency(financialOverview.payments.pendingIncoming)}{" "}
										ожидается
									</p>
								)}
							</CardContent>
						</Card>

						{/* Total Expenses Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Общие расходы
								</CardTitle>
								<Wallet className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{formatCurrency(totalExpenses)}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{financialOverview.expenses.paidCount || 0} оплаченных
									{financialOverview.expenses.totalApproved > 0 && (
										<span className="ml-2">
											+{formatCurrency(financialOverview.expenses.totalApproved)} одобрено
										</span>
									)}
								</p>
							</CardContent>
						</Card>

						{/* Net Profit Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Чистая прибыль
								</CardTitle>
								{netProfit >= 0 ? (
									<TrendingUp className="h-4 w-4 text-green-600" />
								) : (
									<TrendingDown className="h-4 w-4 text-red-600" />
								)}
							</CardHeader>
							<CardContent>
								<div
									className={`text-2xl font-bold ${
										netProfit >= 0 ? "text-green-600" : "text-red-600"
									}`}
								>
									{formatCurrency(netProfit)}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									Маржа прибыли: {formatPercentage(profitMargin)}
								</p>
							</CardContent>
						</Card>

						{/* Active Projects Card */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Активные проекты
								</CardTitle>
								<Building2 className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{financialOverview.organization.activeProjects}
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									из {financialOverview.organization.totalProjects} всего
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Tabs */}
					<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
						<TabsList className="grid w-full grid-cols-4 max-w-2xl">
							<TabsTrigger value="overview">Обзор</TabsTrigger>
							<TabsTrigger value="projects">Проекты</TabsTrigger>
							<TabsTrigger value="cashflow">Денежный поток</TabsTrigger>
							<TabsTrigger value="expenses">Расходы</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-4">
							<FinanceOverview
								financialOverview={financialOverview}
								budgetSummary={budgetSummary}
								onSelectPeriod={setSelectedPeriod}
							/>
						</TabsContent>

						<TabsContent value="projects" className="space-y-4">
							<ProjectComparison organizationId={organizationId} />
						</TabsContent>

						<TabsContent value="cashflow" className="space-y-4">
							<CashFlowChart organizationId={organizationId} />
						</TabsContent>

						<TabsContent value="expenses" className="space-y-4">
							<OrganizationExpenseList
								organizationId={organizationId}
								selectedPeriod={selectedPeriod}
							/>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}