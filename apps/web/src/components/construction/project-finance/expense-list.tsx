"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Banknote,
	CheckCircle,
	FileText,
	MoreHorizontal,
	Plus,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddExpenseModal } from "./add-expense-modal";

interface ExpenseListProps {
	projectId: Id<"constructionProjects">;
}

const CATEGORY_LABELS: Record<string, string> = {
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

const STATUS_CONFIG = {
	pending: {
		label: "Ожидается",
		variant: "outline" as const,
		className: "border-yellow-500 text-yellow-700",
	},
	approved: {
		label: "Одобрено",
		variant: "secondary" as const,
		className: "bg-blue-100 text-blue-700",
	},
	paid: {
		label: "Оплачено",
		variant: "default" as const,
		className: "bg-green-100 text-green-700",
	},
	rejected: {
		label: "Отклонено",
		variant: "destructive" as const,
		className: "",
	},
	cancelled: {
		label: "Отменено",
		variant: "outline" as const,
		className: "border-gray-500 text-gray-700",
	},
};

export function ExpenseList({ projectId }: ExpenseListProps) {
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

	const expenses = useQuery(api.finance.expenses.getProjectExpenses, {
		projectId,
		category: selectedCategory || undefined,
		status: selectedStatus || undefined,
	} as any);

	const statistics = useQuery(api.finance.expenses.getExpenseStatistics, {
		projectId,
	});

	const updateStatus = useMutation(api.finance.expenses.updateExpenseStatus);
	const markAsPaid = useMutation(api.finance.expenses.markExpenseAsPaid);
	const deleteExpense = useMutation(api.finance.expenses.deleteExpense);

	const handleStatusUpdate = async (
		expenseId: Id<"expenses">,
		status: "approved" | "rejected" | "cancelled",
	) => {
		try {
			await updateStatus({ expenseId, status });
			toast.success(`Статус обновлен на "${STATUS_CONFIG[status].label}"`);
		} catch (error) {
			console.error("Error updating status:", error);
			toast.error("Ошибка при обновлении статуса");
		}
	};

	const handleMarkAsPaid = async (expenseId: Id<"expenses">) => {
		try {
			await markAsPaid({ expenseId, createPayment: true });
			toast.success("Расход отмечен как оплаченный");
		} catch (error) {
			console.error("Error marking as paid:", error);
			toast.error("Ошибка при отметке оплаты");
		}
	};

	const handleDelete = async (expenseId: Id<"expenses">) => {
		if (!confirm("Вы уверены, что хотите удалить этот расход?")) return;

		try {
			await deleteExpense({ expenseId });
			toast.success("Расход удален");
		} catch (error) {
			console.error("Error deleting expense:", error);
			toast.error("Ошибка при удалении расхода");
		}
	};

	const formatAmount = (amount: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
		}).format(amount);
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Расходы</CardTitle>
					<Button onClick={() => setIsAddModalOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Добавить расход
					</Button>
				</CardHeader>
				<CardContent>
					{statistics && (
						<div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Оплачено</p>
								<p className="font-bold text-2xl text-green-600">
									{formatAmount(statistics.totalExpenses)}
								</p>
								<p className="text-muted-foreground text-xs">
									{statistics.paidCount} расходов
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Одобрено</p>
								<p className="font-bold text-2xl text-blue-600">
									{formatAmount(statistics.approvedExpenses)}
								</p>
								<p className="text-muted-foreground text-xs">
									{statistics.approvedCount} расходов
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Ожидается</p>
								<p className="font-bold text-2xl text-yellow-600">
									{formatAmount(statistics.pendingExpenses)}
								</p>
								<p className="text-muted-foreground text-xs">
									{statistics.pendingCount} расходов
								</p>
							</div>
							<div className="space-y-1">
								<p className="text-muted-foreground text-sm">Всего</p>
								<p className="font-bold text-2xl">
									{formatAmount(
										statistics.totalExpenses + statistics.approvedExpenses,
									)}
								</p>
								<p className="text-muted-foreground text-xs">
									{statistics.totalCount} расходов
								</p>
							</div>
						</div>
					)}

					<div className="mb-4 flex gap-2">
						<Button
							variant={selectedCategory === null ? "default" : "outline"}
							size="sm"
							onClick={() => setSelectedCategory(null)}
						>
							Все категории
						</Button>
						{Object.entries(CATEGORY_LABELS).map(([value, label]) => (
							<Button
								key={value}
								variant={selectedCategory === value ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCategory(value)}
							>
								{label}
							</Button>
						))}
					</div>

					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Дата</TableHead>
									<TableHead>Категория</TableHead>
									<TableHead>Описание</TableHead>
									<TableHead>Поставщик</TableHead>
									<TableHead>Сумма</TableHead>
									<TableHead>Статус</TableHead>
									<TableHead className="w-[50px]"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{expenses?.map((expense) => (
									<TableRow key={expense._id}>
										<TableCell className="font-medium">
											{format(new Date(expense.expenseDate), "dd MMM yyyy", {
												locale: ru,
											})}
										</TableCell>
										<TableCell>
											<Badge variant="outline">
												{CATEGORY_LABELS[expense.category]}
											</Badge>
										</TableCell>
										<TableCell>
											<div>
												<p className="font-medium">{expense.description}</p>
												{expense.invoiceNumber && (
													<p className="text-muted-foreground text-xs">
														Счет: {expense.invoiceNumber}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div>
												<p>{expense.vendor}</p>
												{expense.vendorInn && (
													<p className="text-muted-foreground text-xs">
														ИНН: {expense.vendorInn}
													</p>
												)}
											</div>
										</TableCell>
										<TableCell className="font-medium">
											{formatAmount(expense.amount)}
										</TableCell>
										<TableCell>
											<Badge
												variant={STATUS_CONFIG[expense.status].variant}
												className={STATUS_CONFIG[expense.status].className}
											>
												{STATUS_CONFIG[expense.status].label}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{expense.status === "pending" && (
														<>
															<DropdownMenuItem
																onClick={() =>
																	handleStatusUpdate(expense._id, "approved")
																}
															>
																<CheckCircle className="mr-2 h-4 w-4" />
																Одобрить
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() =>
																	handleStatusUpdate(expense._id, "rejected")
																}
															>
																<XCircle className="mr-2 h-4 w-4" />
																Отклонить
															</DropdownMenuItem>
														</>
													)}
													{expense.status === "approved" && (
														<DropdownMenuItem
															onClick={() => handleMarkAsPaid(expense._id)}
														>
															<Banknote className="mr-2 h-4 w-4" />
															Отметить как оплаченный
														</DropdownMenuItem>
													)}
													{expense.relatedPayment && (
														<DropdownMenuItem>
															<FileText className="mr-2 h-4 w-4" />
															Посмотреть платеж
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													{expense.status !== "paid" && (
														<DropdownMenuItem
															onClick={() => handleDelete(expense._id)}
															className="text-red-600"
														>
															Удалить
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{(!expenses || expenses.length === 0) && (
									<TableRow>
										<TableCell
											colSpan={7}
											className="py-8 text-center text-muted-foreground"
										>
											Нет расходов
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			<AddExpenseModal
				projectId={projectId}
				open={isAddModalOpen}
				onOpenChange={setIsAddModalOpen}
			/>
		</>
	);
}
