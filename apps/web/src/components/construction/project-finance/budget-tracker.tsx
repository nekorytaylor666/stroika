"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { FileText, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetTrackerProps {
	projectId: Id<"constructionProjects">;
}

export function BudgetTracker({ projectId }: BudgetTrackerProps) {
	const budgetComparison = useQuery(api.finance.budgets.getBudgetComparison, {
		projectId,
	});
	
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};
	
	if (!budgetComparison) {
		return (
			<Card className="p-12">
				<div className="text-center">
					<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-medium text-lg">Бюджет не настроен</h3>
					<p className="text-muted-foreground text-sm mt-2">
						Создайте бюджет для отслеживания расходов проекта
					</p>
					<Button className="mt-4">
						<Plus className="mr-2 h-4 w-4" />
						Создать бюджет
					</Button>
				</div>
			</Card>
		);
	}
	
	return (
		<div className="space-y-6">
			{/* Budget Overview */}
			<Card className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-medium text-lg">Обзор бюджета</h3>
					<Button variant="outline" size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Изменить бюджет
					</Button>
				</div>
				
				<div className="grid gap-4 md:grid-cols-3">
					<div>
						<p className="text-muted-foreground text-sm">Общий бюджет</p>
						<p className="font-semibold text-2xl">
							{formatCurrency(budgetComparison.totalPlanned)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Потрачено</p>
						<p className="font-semibold text-2xl text-orange-600">
							{formatCurrency(budgetComparison.totalSpent)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Остаток</p>
						<p className={cn(
							"font-semibold text-2xl",
							budgetComparison.totalVariance >= 0 ? "text-green-600" : "text-red-600"
						)}>
							{formatCurrency(budgetComparison.totalVariance)}
						</p>
					</div>
				</div>
				
				<div className="mt-4">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-muted-foreground text-sm">Использовано</span>
						<span className="text-sm font-medium">
							{budgetComparison.totalPlanned > 0 
								? Math.round((budgetComparison.totalSpent / budgetComparison.totalPlanned) * 100)
								: 0}%
						</span>
					</div>
					<Progress 
						value={budgetComparison.totalPlanned > 0 
							? (budgetComparison.totalSpent / budgetComparison.totalPlanned) * 100
							: 0} 
						className="h-2"
					/>
				</div>
			</Card>
			
			{/* Budget Lines */}
			<Card className="p-6">
				<h3 className="mb-4 font-medium text-lg">Статьи бюджета</h3>
				<div className="space-y-4">
					{budgetComparison.comparison.map((line, index) => (
						<div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
							<div className="flex-1">
								<p className="font-medium">{line.category}</p>
								<p className="text-muted-foreground text-sm">{line.account?.name}</p>
							</div>
							
							<div className="grid grid-cols-3 gap-8 text-right">
								<div>
									<p className="text-muted-foreground text-xs">План</p>
									<p className="font-medium">{formatCurrency(line.plannedAmount)}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Факт</p>
									<p className="font-medium">{formatCurrency(line.actualSpent)}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Остаток</p>
									<p className={cn(
										"font-medium",
										line.variance >= 0 ? "text-green-600" : "text-red-600"
									)}>
										{formatCurrency(line.variance)}
									</p>
								</div>
							</div>
							
							<div className="ml-4 w-20">
								<Progress 
									value={Math.min(line.percentUsed, 100)} 
									className={cn(
										"h-2",
										line.percentUsed > 100 && "[&>div]:bg-red-500"
									)}
								/>
								<p className="mt-1 text-right text-xs">
									{Math.round(line.percentUsed)}%
								</p>
							</div>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}