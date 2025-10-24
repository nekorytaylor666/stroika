"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddExpenseModalProps {
	projectId: Id<"constructionProjects">;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
	{ value: "materials", label: "Материалы" },
	{ value: "labor", label: "Работа" },
	{ value: "equipment", label: "Оборудование" },
	{ value: "transport", label: "Транспорт" },
	{ value: "utilities", label: "Коммунальные услуги" },
	{ value: "permits", label: "Разрешения" },
	{ value: "insurance", label: "Страхование" },
	{ value: "taxes", label: "Налоги" },
	{ value: "other", label: "Другое" },
];

const PAYMENT_METHODS = [
	{ value: "bank_transfer", label: "Банковский перевод" },
	{ value: "cash", label: "Наличные" },
	{ value: "card", label: "Карта" },
	{ value: "other", label: "Другое" },
];

export function AddExpenseModal({
	projectId,
	open,
	onOpenChange,
	onSuccess,
}: AddExpenseModalProps) {
	const createExpense = useMutation(api.finance.expenses.createExpense);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [expenseDate, setExpenseDate] = useState<Date>(new Date());

	const [formData, setFormData] = useState({
		category: "materials",
		description: "",
		amount: "",
		vendor: "",
		vendorInn: "",
		invoiceNumber: "",
		paymentMethod: "bank_transfer",
		notes: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.description || !formData.amount || !formData.vendor) {
			toast.error("Заполните обязательные поля");
			return;
		}

		setIsSubmitting(true);
		try {
			await createExpense({
				projectId,
				category: formData.category as any,
				description: formData.description,
				amount: Number.parseFloat(formData.amount),
				expenseDate: format(expenseDate, "yyyy-MM-dd"),
				vendor: formData.vendor,
				vendorInn: formData.vendorInn || undefined,
				invoiceNumber: formData.invoiceNumber || undefined,
				paymentMethod: formData.paymentMethod as any,
				notes: formData.notes || undefined,
			});

			toast.success("Расход добавлен успешно");
			onOpenChange(false);
			onSuccess?.();

			// Reset form
			setFormData({
				category: "materials",
				description: "",
				amount: "",
				vendor: "",
				vendorInn: "",
				invoiceNumber: "",
				paymentMethod: "bank_transfer",
				notes: "",
			});
			setExpenseDate(new Date());
		} catch (error) {
			console.error("Error creating expense:", error);
			toast.error("Ошибка при добавлении расхода");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Добавить расход</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="category">Категория *</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, category: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{EXPENSE_CATEGORIES.map((cat) => (
										<SelectItem key={cat.value} value={cat.value}>
											{cat.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Описание *</Label>
							<Textarea
								id="description"
								placeholder="Описание расхода"
								value={formData.description}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								required
								rows={2}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="amount">Сумма (₽) *</Label>
								<Input
									id="amount"
									type="number"
									step="0.01"
									placeholder="0.00"
									value={formData.amount}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, amount: e.target.value }))
									}
									required
								/>
							</div>

							<div className="grid gap-2">
								<Label>Дата расхода *</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"justify-start text-left font-normal",
												!expenseDate && "text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{expenseDate
												? format(expenseDate, "dd MMMM yyyy", { locale: ru })
												: "Выберите дату"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={expenseDate}
											onSelect={(date) => date && setExpenseDate(date)}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="vendor">Поставщик *</Label>
							<Input
								id="vendor"
								placeholder="Название поставщика"
								value={formData.vendor}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, vendor: e.target.value }))
								}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label htmlFor="vendorInn">ИНН поставщика</Label>
								<Input
									id="vendorInn"
									placeholder="ИНН"
									value={formData.vendorInn}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											vendorInn: e.target.value,
										}))
									}
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="invoiceNumber">Номер счета</Label>
								<Input
									id="invoiceNumber"
									placeholder="№ счета"
									value={formData.invoiceNumber}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											invoiceNumber: e.target.value,
										}))
									}
								/>
							</div>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="paymentMethod">Способ оплаты *</Label>
							<Select
								value={formData.paymentMethod}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, paymentMethod: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_METHODS.map((method) => (
										<SelectItem key={method.value} value={method.value}>
											{method.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="notes">Примечания</Label>
							<Textarea
								id="notes"
								placeholder="Дополнительная информация"
								value={formData.notes}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, notes: e.target.value }))
								}
								rows={2}
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Отмена
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Добавление..." : "Добавить расход"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
