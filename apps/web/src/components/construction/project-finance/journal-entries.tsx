"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CheckCircle, Clock, FileText, Plus, XCircle } from "lucide-react";

interface JournalEntriesProps {
	projectId: Id<"constructionProjects">;
}

const entryTypeLabels = {
	payment: "Платеж",
	expense: "Расход",
	revenue: "Доход",
	transfer: "Перевод",
	adjustment: "Корректировка",
};

const entryStatusStyles = {
	draft: {
		bg: "bg-gray-100",
		text: "text-gray-700",
		icon: Clock,
		label: "Черновик",
	},
	posted: {
		bg: "bg-green-100",
		text: "text-green-700",
		icon: CheckCircle,
		label: "Проведено",
	},
	cancelled: {
		bg: "bg-red-100",
		text: "text-red-700",
		icon: XCircle,
		label: "Отменено",
	},
};

export function JournalEntries({ projectId }: JournalEntriesProps) {
	const journalEntries = useQuery(
		api.finance.journalEntries.getJournalEntries,
		{
			projectId,
		},
	);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};

	if (!journalEntries || journalEntries.length === 0) {
		return (
			<Card className="p-12">
				<div className="text-center">
					<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-medium text-lg">Нет журнальных проводок</h3>
					<p className="mt-2 text-muted-foreground text-sm">
						Журнальные проводки будут создаваться автоматически при
						подтверждении платежей
					</p>
					<Button className="mt-4">
						<Plus className="mr-2 h-4 w-4" />
						Создать проводку
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-lg">Журнал проводок</h3>
				<Button size="sm">
					<Plus className="mr-2 h-4 w-4" />
					Создать проводку
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Номер</TableHead>
							<TableHead>Дата</TableHead>
							<TableHead>Описание</TableHead>
							<TableHead>Тип</TableHead>
							<TableHead>Дебет</TableHead>
							<TableHead>Кредит</TableHead>
							<TableHead>Статус</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{journalEntries.map((entry) => {
							const StatusIcon = entryStatusStyles[entry.status].icon;

							return (
								<TableRow
									key={entry._id}
									className="cursor-pointer hover:bg-muted/50"
								>
									<TableCell className="font-medium">
										{entry.entryNumber}
									</TableCell>
									<TableCell>
										{format(new Date(entry.date), "d MMM yyyy", { locale: ru })}
									</TableCell>
									<TableCell>
										<div>
											<p className="line-clamp-1">{entry.description}</p>
											{entry.payment && (
												<p className="text-muted-foreground text-xs">
													Платеж: {entry.payment.paymentNumber}
												</p>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{entryTypeLabels[entry.type]}
										</Badge>
									</TableCell>
									<TableCell className="font-medium">
										{formatCurrency(entry.totalDebits)}
									</TableCell>
									<TableCell className="font-medium">
										{formatCurrency(entry.totalCredits)}
									</TableCell>
									<TableCell>
										<Badge
											className={cn(
												"gap-1",
												entryStatusStyles[entry.status].bg,
												entryStatusStyles[entry.status].text,
												"border-0",
											)}
										>
											<StatusIcon className="h-3 w-3" />
											{entryStatusStyles[entry.status].label}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</Card>

			{/* Entry Details (could be expanded to show line items) */}
			{journalEntries.length > 0 && (
				<Card className="p-6">
					<h4 className="mb-4 font-medium">Детали последней проводки</h4>
					<div className="space-y-3">
						{journalEntries[0].lines.map((line, index) => (
							<div
								key={index}
								className="flex items-center justify-between border-b pb-2 last:border-0"
							>
								<div className="flex-1">
									<p className="font-medium text-sm">
										{line.account?.code} - {line.account?.name}
									</p>
									{line.description && (
										<p className="text-muted-foreground text-xs">
											{line.description}
										</p>
									)}
								</div>
								<div className="grid grid-cols-2 gap-8 text-right">
									<div>
										<p className="text-muted-foreground text-xs">Дебет</p>
										<p className="font-medium">
											{line.debit > 0 ? formatCurrency(line.debit) : "—"}
										</p>
									</div>
									<div>
										<p className="text-muted-foreground text-xs">Кредит</p>
										<p className="font-medium">
											{line.credit > 0 ? formatCurrency(line.credit) : "—"}
										</p>
									</div>
								</div>
							</div>
						))}

						{/* Totals */}
						<div className="flex items-center justify-between border-t pt-3">
							<p className="font-medium">Итого</p>
							<div className="grid grid-cols-2 gap-8 text-right">
								<p className="font-semibold">
									{formatCurrency(journalEntries[0].totalDebits)}
								</p>
								<p className="font-semibold">
									{formatCurrency(journalEntries[0].totalCredits)}
								</p>
							</div>
						</div>

						{/* Balance Check */}
						{journalEntries[0].isBalanced ? (
							<div className="flex items-center gap-2 text-green-600">
								<CheckCircle className="h-4 w-4" />
								<span className="text-sm">Проводка сбалансирована</span>
							</div>
						) : (
							<div className="flex items-center gap-2 text-red-600">
								<XCircle className="h-4 w-4" />
								<span className="text-sm">Проводка не сбалансирована</span>
							</div>
						)}
					</div>
				</Card>
			)}
		</div>
	);
}
