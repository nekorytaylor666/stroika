"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckCircle,
	Clock,
	Download,
	FileText,
	MoreVertical,
	XCircle,
} from "lucide-react";
import { useState } from "react";

interface PaymentListProps {
	projectId: Id<"constructionProjects">;
}

const paymentStatusLabels = {
	pending: "Ожидается",
	confirmed: "Подтверждено",
	rejected: "Отклонено",
	cancelled: "Отменено",
};

const paymentStatusStyles = {
	pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
	confirmed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
	rejected: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
	cancelled: { bg: "bg-gray-100", text: "text-gray-700", icon: XCircle },
};

const paymentMethodLabels = {
	bank_transfer: "Банковский перевод",
	cash: "Наличные",
	card: "Карта",
	other: "Другое",
};

export function PaymentList({ projectId }: PaymentListProps) {
	const [typeFilter, setTypeFilter] = useState<"all" | "incoming" | "outgoing">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected" | "cancelled">("all");
	
	const payments = useQuery(api.finance.payments.getProjectPayments, {
		projectId,
		type: typeFilter === "all" ? undefined : typeFilter,
		status: statusFilter === "all" ? undefined : statusFilter,
	});
	
	const updateStatus = useMutation(api.finance.payments.updatePaymentStatus);
	
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(value);
	};
	
	const handleStatusUpdate = async (paymentId: Id<"payments">, status: "confirmed" | "rejected" | "cancelled") => {
		await updateStatus({ paymentId, status });
	};
	
	if (!payments) {
		return <PaymentListSkeleton />;
	}
	
	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="flex items-center gap-4">
				<Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Тип платежа" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Все платежи</SelectItem>
						<SelectItem value="incoming">Входящие</SelectItem>
						<SelectItem value="outgoing">Исходящие</SelectItem>
					</SelectContent>
				</Select>
				
				<Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Статус" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Все статусы</SelectItem>
						<SelectItem value="pending">Ожидается</SelectItem>
						<SelectItem value="confirmed">Подтверждено</SelectItem>
						<SelectItem value="rejected">Отклонено</SelectItem>
						<SelectItem value="cancelled">Отменено</SelectItem>
					</SelectContent>
				</Select>
			</div>
			
			{/* Payments List */}
			{payments.length === 0 ? (
				<Card className="p-12">
					<div className="text-center">
						<FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="font-medium text-lg">Платежи не найдены</h3>
						<p className="text-muted-foreground text-sm mt-2">
							Нет платежей, соответствующих выбранным фильтрам
						</p>
					</div>
				</Card>
			) : (
				<div className="space-y-3">
					{payments.map((payment) => {
						const StatusIcon = paymentStatusStyles[payment.status].icon;
						const isIncoming = payment.type === "incoming";
						
						return (
							<Card key={payment._id} className="p-4">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="mb-2 flex items-center gap-3">
											<div className={cn(
												"rounded-full p-2",
												isIncoming ? "bg-green-100" : "bg-red-100"
											)}>
												{isIncoming ? (
													<ArrowDownIcon className="h-4 w-4 text-green-600" />
												) : (
													<ArrowUpIcon className="h-4 w-4 text-red-600" />
												)}
											</div>
											
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium">
														{payment.counterparty}
													</p>
													<span className="text-muted-foreground text-sm">
														• {payment.paymentNumber}
													</span>
												</div>
												<p className="text-muted-foreground text-sm">
													{payment.purpose}
												</p>
											</div>
											
											<div className="text-right">
												<p className={cn(
													"font-semibold text-lg",
													isIncoming ? "text-green-600" : "text-red-600"
												)}>
													{isIncoming ? "+" : "-"}{formatCurrency(payment.amount)}
												</p>
												<p className="text-muted-foreground text-xs">
													{format(new Date(payment.paymentDate), "d MMM yyyy", { locale: ru })}
												</p>
											</div>
										</div>
										
										<div className="mt-3 flex items-center gap-4">
											<Badge
												className={cn(
													"gap-1",
													paymentStatusStyles[payment.status].bg,
													paymentStatusStyles[payment.status].text,
													"border-0"
												)}
											>
												<StatusIcon className="h-3 w-3" />
												{paymentStatusLabels[payment.status]}
											</Badge>
											
											<span className="text-muted-foreground text-sm">
												{paymentMethodLabels[payment.paymentMethod]}
											</span>
											
											{payment.counterpartyInn && (
												<span className="text-muted-foreground text-sm">
													ИНН: {payment.counterpartyInn}
												</span>
											)}
											
											{payment.createdBy && (
												<span className="text-muted-foreground text-sm">
													Создал: {payment.createdBy.name}
												</span>
											)}
										</div>
									</div>
									
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Действия</DropdownMenuLabel>
											<DropdownMenuSeparator />
											
											{payment.status === "pending" && (
												<>
													<DropdownMenuItem
														onClick={() => handleStatusUpdate(payment._id, "confirmed")}
														className="text-green-600"
													>
														<CheckCircle className="mr-2 h-4 w-4" />
														Подтвердить
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => handleStatusUpdate(payment._id, "rejected")}
														className="text-red-600"
													>
														<XCircle className="mr-2 h-4 w-4" />
														Отклонить
													</DropdownMenuItem>
												</>
											)}
											
											{payment.status === "confirmed" && (
												<DropdownMenuItem
													onClick={() => handleStatusUpdate(payment._id, "cancelled")}
													className="text-gray-600"
												>
													<XCircle className="mr-2 h-4 w-4" />
													Отменить
												</DropdownMenuItem>
											)}
											
											<DropdownMenuItem>
												<FileText className="mr-2 h-4 w-4" />
												Документы
											</DropdownMenuItem>
											
											<DropdownMenuItem>
												<Download className="mr-2 h-4 w-4" />
												Скачать
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								
								{payment.notes && (
									<div className="mt-3 rounded-md bg-muted p-3">
										<p className="text-sm">{payment.notes}</p>
									</div>
								)}
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

function PaymentListSkeleton() {
	return (
		<div className="space-y-3">
			{[...Array(3)].map((_, i) => (
				<Skeleton key={i} className="h-32" />
			))}
		</div>
	);
}