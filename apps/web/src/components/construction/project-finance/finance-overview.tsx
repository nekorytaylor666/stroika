"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	ArrowDownIcon,
	ArrowUpIcon,
	Banknote,
	Calculator,
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	FileText,
	PiggyBank,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	Wallet,
	XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
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
import { AddPaymentModal } from "./add-payment-modal";
import { BudgetTracker } from "./budget-tracker";
import { JournalEntries } from "./journal-entries";
import { PaymentList } from "./payment-list";

interface ProjectFinanceTabProps {
	projectId: Id<"constructionProjects">;
}

const paymentStatusColors = {
	pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
	confirmed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
	rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
	cancelled: { bg: "bg-gray-100", text: "text-gray-700", icon: XCircle },
};

export function ProjectFinanceTab({ projectId }: ProjectFinanceTabProps) {
	const [showAddPayment, setShowAddPayment] = useState(false);
	const [selectedTab, setSelectedTab] = useState("overview");

	// Initialize accounts if needed
	const initAccounts = useMutation(api.finance.accounts.initializeAccounts);
	const accounts = useQuery(api.finance.accounts.getAccounts);

	// Fetch financial data
	const paymentStats = useQuery(api.finance.payments.getPaymentStatistics, {
		projectId,
	});

	const financialSummary = useQuery(api.finance.reports.getFinancialSummary, {
		projectId,
	});

	// Initialize accounts on mount if needed
	useEffect(() => {
		if (accounts && accounts.length === 0) {
			initAccounts();
		}
	}, [accounts, initAccounts]);

	// Format currency
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	if (!paymentStats || !financialSummary) {
		return <FinanceSkeleton />;
	}

	// Prepare cash flow chart data
	const cashFlowData = [
		{
			name: "Поступления",
			value: paymentStats.totalIncoming,
			color: "hsl(142, 76%, 36%)",
		},
		{
			name: "Платежи",
			value: paymentStats.totalOutgoing,
			color: "hsl(0, 84%, 60%)",
		},
	];

	const isPositiveCashFlow = paymentStats.netCashFlow >= 0;

	return (
		<div className="h-full overflow-auto">
			<div className="space-y-6 p-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-2xl">Финансы проекта</h2>
						<p className="text-muted-foreground">
							Управление платежами, бюджетом и финансовой отчетностью
						</p>
					</div>
					<Button onClick={() => setShowAddPayment(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Добавить платеж
					</Button>
				</div>

				<Separator />

				{/* Financial Stats Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{/* Contract Value */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">
									Стоимость контракта
								</p>
								<p className="font-semibold text-2xl">
									{formatCurrency(financialSummary.project.contractValue)}
								</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<FileText className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</Card>

					{/* Total Incoming */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Поступления</p>
								<p className="font-semibold text-2xl">
									{formatCurrency(paymentStats.totalIncoming)}
								</p>
								{paymentStats.pendingIncoming > 0 && (
									<p className="text-muted-foreground text-xs">
										+{formatCurrency(paymentStats.pendingIncoming)} ожидается
									</p>
								)}
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<ArrowDownIcon className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</Card>

					{/* Total Outgoing */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Платежи</p>
								<p className="font-semibold text-2xl">
									{formatCurrency(paymentStats.totalOutgoing)}
								</p>
								{paymentStats.pendingOutgoing > 0 && (
									<p className="text-muted-foreground text-xs">
										+{formatCurrency(paymentStats.pendingOutgoing)} ожидается
									</p>
								)}
							</div>
							<div className="rounded-full bg-red-100 p-3">
								<ArrowUpIcon className="h-6 w-6 text-red-600" />
							</div>
						</div>
					</Card>

					{/* Net Cash Flow */}
					<Card className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Денежный поток</p>
								<p
									className={cn(
										"font-semibold text-2xl",
										isPositiveCashFlow ? "text-green-600" : "text-red-600",
									)}
								>
									{formatCurrency(paymentStats.netCashFlow)}
								</p>
								<p className="text-muted-foreground text-xs">
									{isPositiveCashFlow ? "Положительный" : "Отрицательный"}
								</p>
							</div>
							<div
								className={cn(
									"rounded-full p-3",
									isPositiveCashFlow ? "bg-green-100" : "bg-red-100",
								)}
							>
								{isPositiveCashFlow ? (
									<TrendingUp className="h-6 w-6 text-green-600" />
								) : (
									<TrendingDown className="h-6 w-6 text-red-600" />
								)}
							</div>
						</div>
					</Card>
				</div>

				{/* Tabs for different views */}
				<Tabs
					value={selectedTab}
					onValueChange={setSelectedTab}
					className="space-y-4"
				>
					<TabsList className="grid w-full max-w-md grid-cols-4">
						<TabsTrigger value="overview">Обзор</TabsTrigger>
						<TabsTrigger value="payments">Платежи</TabsTrigger>
						<TabsTrigger value="budget">Бюджет</TabsTrigger>
						<TabsTrigger value="journal">Проводки</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Cash Flow Chart */}
							<Card className="p-6">
								<h3 className="mb-4 font-medium">Структура денежного потока</h3>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={cashFlowData}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={100}
												paddingAngle={2}
												dataKey="value"
											>
												{cashFlowData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={entry.color} />
												))}
											</Pie>
											<Tooltip
												formatter={(value: number) => formatCurrency(value)}
											/>
										</PieChart>
									</ResponsiveContainer>
								</div>
								<div className="mt-4 flex items-center justify-center gap-6">
									{cashFlowData.map((item) => (
										<div key={item.name} className="flex items-center gap-2">
											<div
												className="h-3 w-3 rounded-sm"
												style={{ backgroundColor: item.color }}
											/>
											<span className="text-sm">
												{item.name}: {formatCurrency(item.value)}
											</span>
										</div>
									))}
								</div>
							</Card>

							{/* Budget vs Actual */}
							{financialSummary.budget && (
								<Card className="p-6">
									<h3 className="mb-4 font-medium">Бюджет проекта</h3>
									<div className="space-y-4">
										<div>
											<div className="mb-2 flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Общий бюджет
												</span>
												<span className="font-medium">
													{formatCurrency(financialSummary.budget.total)}
												</span>
											</div>
											<div className="mb-2 flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Потрачено
												</span>
												<span className="font-medium">
													{formatCurrency(financialSummary.budget.spent)}
												</span>
											</div>
											<div className="mb-4 flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													Остаток
												</span>
												<span
													className={cn(
														"font-medium",
														financialSummary.budget.remaining > 0
															? "text-green-600"
															: "text-red-600",
													)}
												>
													{formatCurrency(financialSummary.budget.remaining)}
												</span>
											</div>

											{/* Progress bar */}
											<div>
												<div className="mb-1 flex items-center justify-between">
													<span className="text-muted-foreground text-xs">
														Использовано
													</span>
													<span className="font-medium text-xs">
														{Math.round(financialSummary.budget.percentUsed)}%
													</span>
												</div>
												<div className="h-2 overflow-hidden rounded-full bg-muted">
													<motion.div
														className={cn(
															"h-full",
															financialSummary.budget.percentUsed > 90
																? "bg-red-500"
																: financialSummary.budget.percentUsed > 70
																	? "bg-yellow-500"
																	: "bg-green-500",
														)}
														initial={{ width: 0 }}
														animate={{
															width: `${Math.min(financialSummary.budget.percentUsed, 100)}%`,
														}}
														transition={{ duration: 0.5 }}
													/>
												</div>
											</div>
										</div>
									</div>
								</Card>
							)}
						</div>

						{/* Profitability Metrics */}
						<Card className="p-6">
							<h3 className="mb-4 font-medium">Показатели рентабельности</h3>
							<div className="grid gap-4 md:grid-cols-4">
								<div>
									<p className="text-muted-foreground text-sm">
										Валовая прибыль
									</p>
									<p
										className={cn(
											"font-semibold text-xl",
											financialSummary.profitability.grossProfit >= 0
												? "text-green-600"
												: "text-red-600",
										)}
									>
										{formatCurrency(financialSummary.profitability.grossProfit)}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Маржа прибыли</p>
									<p className="font-semibold text-xl">
										{financialSummary.profitability.profitMargin.toFixed(1)}%
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">ROI</p>
									<p className="font-semibold text-xl">
										{financialSummary.profitability.roi.toFixed(1)}%
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-sm">Чистый доход</p>
									<p
										className={cn(
											"font-semibold text-xl",
											financialSummary.balances.netIncome >= 0
												? "text-green-600"
												: "text-red-600",
										)}
									>
										{formatCurrency(financialSummary.balances.netIncome)}
									</p>
								</div>
							</div>
						</Card>
					</TabsContent>

					<TabsContent value="payments" className="space-y-4">
						<PaymentList projectId={projectId} />
					</TabsContent>

					<TabsContent value="budget" className="space-y-4">
						<BudgetTracker projectId={projectId} />
					</TabsContent>

					<TabsContent value="journal" className="space-y-4">
						<JournalEntries projectId={projectId} />
					</TabsContent>
				</Tabs>
			</div>

			{/* Add Payment Modal */}
			{showAddPayment && (
				<AddPaymentModal
					projectId={projectId}
					onClose={() => setShowAddPayment(false)}
				/>
			)}
		</div>
	);
}

function FinanceSkeleton() {
	return (
		<div className="h-full overflow-auto">
			<div className="space-y-6 p-6">
				<div>
					<Skeleton className="mb-2 h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Separator />
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
				<div className="grid gap-6 lg:grid-cols-2">
					<Skeleton className="h-96" />
					<Skeleton className="h-96" />
				</div>
			</div>
		</div>
	);
}
