"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	AlertCircle,
	DollarSign,
	Receipt,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { ExpenseList } from "./expense-list";
import { ProjectFinanceTab as FinanceOverview } from "./finance-overview";
import { PaymentList } from "./payment-list";

interface ProjectFinancePageProps {
	projectId: Id<"constructionProjects">;
}

export function ProjectFinancePage({ projectId }: ProjectFinancePageProps) {
	const [activeTab, setActiveTab] = useState("overview");

	const financialOverview = useQuery(
		api.finance.reports.getProjectFinancialOverview,
		{
			projectId,
		},
	);

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getBalanceStatus = (balance: number) => {
		if (balance > 0) return { color: "text-green-600", icon: TrendingUp };
		if (balance < 0) return { color: "text-red-600", icon: TrendingDown };
		return { color: "text-gray-600", icon: DollarSign };
	};

	if (!financialOverview) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="text-muted-foreground">
					Загрузка финансовых данных...
				</div>
			</div>
		);
	}

	const balanceStatus = getBalanceStatus(
		financialOverview.balance.currentBalance,
	);
	const BalanceIcon = balanceStatus.icon;

	return (
		<div className="space-y-6">
			{/* Header with financial summary */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Текущий баланс</CardDescription>
					</CardHeader>
					<CardContent>
						<div className={`font-bold text-2xl ${balanceStatus.color}`}>
							{formatAmount(financialOverview.balance.currentBalance)}
						</div>
						<div className="mt-1 flex items-center">
							<BalanceIcon className="mr-1 h-4 w-4" />
							<span className="text-muted-foreground text-sm">
								Доходы - Расходы
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Поступления</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{formatAmount(financialOverview.payments.totalIncoming)}
						</div>
						<div className="mt-1 flex items-center gap-2">
							<Badge variant="outline" className="text-xs">
								{financialOverview.payments.confirmedCount} подтвержденных
							</Badge>
							{financialOverview.payments.pendingIncoming > 0 && (
								<Badge variant="secondary" className="text-xs">
									+{formatAmount(financialOverview.payments.pendingIncoming)}
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Расходы</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-red-600">
							{formatAmount(financialOverview.expenses.totalPaid)}
						</div>
						<div className="mt-1 flex items-center gap-2">
							<Badge variant="outline" className="text-xs">
								{financialOverview.expenses.paidCount} оплаченных
							</Badge>
							{financialOverview.expenses.totalApproved > 0 && (
								<Badge variant="secondary" className="text-xs">
									+{formatAmount(financialOverview.expenses.totalApproved)}
								</Badge>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription>Рентабельность</CardDescription>
					</CardHeader>
					<CardContent>
						<div className={`font-bold text-2xl ${
							financialOverview.balance.profitMargin > 0 ? "text-green-600" : 
							financialOverview.balance.profitMargin < 0 ? "text-red-600" : ""
						}`}>
							{financialOverview.balance.profitMargin.toFixed(1)}%
						</div>
						<div className="mt-1 flex items-center">
							<span className="text-muted-foreground text-sm">
								Прибыль / Поступления
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Warnings and alerts */}
			{financialOverview.payments.pendingCount > 0 && (
				<Card className="border-yellow-200 bg-yellow-50">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<AlertCircle className="h-4 w-4 text-yellow-600" />
							<CardTitle className="text-base">Ожидающие операции</CardTitle>
						</div>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="flex gap-4 text-sm">
							{financialOverview.payments.pendingIncoming > 0 && (
								<div>
									Ожидаемые поступления:{" "}
									<span className="font-medium text-green-600">
										{formatAmount(financialOverview.payments.pendingIncoming)}
									</span>
								</div>
							)}
							{financialOverview.payments.pendingOutgoing > 0 && (
								<div>
									Ожидаемые платежи:{" "}
									<span className="font-medium text-red-600">
										{formatAmount(financialOverview.payments.pendingOutgoing)}
									</span>
								</div>
							)}
							{financialOverview.expenses.totalPending > 0 && (
								<div>
									Расходы на рассмотрении:{" "}
									<span className="font-medium text-orange-600">
										{formatAmount(financialOverview.expenses.totalPending)}
									</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main content tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="overview" className="flex items-center gap-2">
						<DollarSign className="h-4 w-4" />
						Обзор
					</TabsTrigger>
					<TabsTrigger value="payments" className="flex items-center gap-2">
						<Wallet className="h-4 w-4" />
						Платежи
						{financialOverview.payments.totalCount > 0 && (
							<Badge variant="secondary" className="ml-1">
								{financialOverview.payments.totalCount}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="expenses" className="flex items-center gap-2">
						<Receipt className="h-4 w-4" />
						Расходы
						{financialOverview.expenses.totalCount > 0 && (
							<Badge variant="secondary" className="ml-1">
								{financialOverview.expenses.totalCount}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<FinanceOverview projectId={projectId} />
				</TabsContent>

				<TabsContent value="payments" className="space-y-4">
					<Card className="border-blue-200 bg-blue-50">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">О платежах</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground">
								Платежи отслеживают все денежные операции (входящие и исходящие). 
								Исходящие платежи могут быть связаны с расходами после их оплаты.
							</p>
						</CardContent>
					</Card>
					<PaymentList projectId={projectId} />
				</TabsContent>

				<TabsContent value="expenses" className="space-y-4">
					<Card className="border-blue-200 bg-blue-50">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">О расходах</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-sm text-muted-foreground">
								Расходы - это детальный учет затрат по категориям. 
								После одобрения расход можно отметить как оплаченный, что автоматически создаст связанный платеж.
							</p>
						</CardContent>
					</Card>
					<ExpenseList projectId={projectId} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
