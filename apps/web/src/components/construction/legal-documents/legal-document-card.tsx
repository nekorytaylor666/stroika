"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertTriangle,
	Briefcase,
	Calendar,
	DollarSign,
	Download,
	Eye,
	FileCheck,
	FileText,
	Lock,
	MoreVertical,
	Receipt,
	Shield,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LegalDocumentCardProps {
	document: {
		_id: Id<"projectLegalDocuments">;
		title: string;
		description?: string;
		documentType: string;
		fileName: string;
		fileSize: number;
		status: string;
		validUntil?: string;
		uploadedAt: number;
		isPrivate: boolean;
		tags: string[];
		url?: string | null;
		uploader?: {
			name: string;
			email: string;
			avatarUrl?: string;
		} | null;
	};
	onDelete?: () => void;
	onStatusChange?: () => void;
}

const documentTypeConfig = {
	contract: {
		label: "Договор",
		icon: FileText,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
	},
	invoice: {
		label: "Счет",
		icon: Receipt,
		color: "text-green-600",
		bgColor: "bg-green-50",
	},
	permit: {
		label: "Разрешение",
		icon: Shield,
		color: "text-purple-600",
		bgColor: "bg-purple-50",
	},
	insurance: {
		label: "Страхование",
		icon: Shield,
		color: "text-orange-600",
		bgColor: "bg-orange-50",
	},
	report: {
		label: "Отчет",
		icon: FileCheck,
		color: "text-cyan-600",
		bgColor: "bg-cyan-50",
	},
	legal: {
		label: "Юридический",
		icon: Briefcase,
		color: "text-indigo-600",
		bgColor: "bg-indigo-50",
	},
	financial: {
		label: "Финансовый",
		icon: DollarSign,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	other: {
		label: "Другое",
		icon: FileText,
		color: "text-gray-600",
		bgColor: "bg-gray-50",
	},
};

const statusConfig = {
	draft: { label: "Черновик", color: "bg-gray-100 text-gray-700" },
	pending: { label: "На рассмотрении", color: "bg-yellow-100 text-yellow-700" },
	approved: { label: "Утвержден", color: "bg-green-100 text-green-700" },
	rejected: { label: "Отклонен", color: "bg-red-100 text-red-700" },
	expired: { label: "Истек", color: "bg-orange-100 text-orange-700" },
	archived: { label: "Архивирован", color: "bg-gray-100 text-gray-700" },
};

export function LegalDocumentCard({
	document,
	onDelete,
	onStatusChange,
}: LegalDocumentCardProps) {
	const deleteDocument = useMutation(api.projectLegalDocuments.deleteDocument);
	const updateStatus = useMutation(
		api.projectLegalDocuments.updateDocumentStatus,
	);

	const config =
		documentTypeConfig[
			document.documentType as keyof typeof documentTypeConfig
		] || documentTypeConfig.other;
	const Icon = config.icon;
	const statusInfo = statusConfig[document.status as keyof typeof statusConfig];

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	const handleDownload = () => {
		if (document.url) {
			window.open(document.url, "_blank");
		}
	};

	const handleDelete = async () => {
		if (confirm("Вы уверены, что хотите удалить этот документ?")) {
			try {
				await deleteDocument({ id: document._id });
				toast.success("Документ удален");
				onDelete?.();
			} catch (error) {
				toast.error("Ошибка при удалении документа");
			}
		}
	};

	const handleStatusChange = async (newStatus: string) => {
		try {
			await updateStatus({
				id: document._id,
				status: newStatus as any,
			});
			toast.success("Статус обновлен");
			onStatusChange?.();
		} catch (error) {
			toast.error("Ошибка при обновлении статуса");
		}
	};

	// Check if document is expiring soon
	const isExpiringSoon = () => {
		if (!document.validUntil) return false;
		const daysUntil = Math.floor(
			(new Date(document.validUntil).getTime() - new Date().getTime()) /
				(1000 * 60 * 60 * 24),
		);
		return daysUntil <= 30 && daysUntil > 0;
	};

	const isExpired = () => {
		if (!document.validUntil) return false;
		return new Date(document.validUntil) < new Date();
	};

	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex flex-1 items-start gap-3">
						{/* Document Icon */}
						<div className={cn("rounded-lg p-2", config.bgColor)}>
							<Icon className={cn("h-5 w-5", config.color)} />
						</div>

						{/* Document Info */}
						<div className="min-w-0 flex-1">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h3 className="flex items-center gap-2 truncate font-medium text-sm">
										{document.title}
										{document.isPrivate && (
											<Lock className="h-3 w-3 text-muted-foreground" />
										)}
									</h3>
									{document.description && (
										<p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
											{document.description}
										</p>
									)}
								</div>
							</div>

							{/* Metadata */}
							<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
								<span>{formatFileSize(document.fileSize)}</span>
								<span>•</span>
								<span>
									{format(new Date(document.uploadedAt), "d MMM yyyy", {
										locale: ru,
									})}
								</span>
								{document.uploader && (
									<>
										<span>•</span>
										<div className="flex items-center gap-1">
											<Avatar className="h-4 w-4">
												<AvatarImage src={document.uploader.avatarUrl} />
												<AvatarFallback className="text-[8px]">
													{document.uploader.name[0]}
												</AvatarFallback>
											</Avatar>
											<span>{document.uploader.name}</span>
										</div>
									</>
								)}
							</div>

							{/* Status and Validity */}
							<div className="mt-2 flex items-center gap-2">
								<Badge
									className={cn("text-xs", statusInfo.color)}
									variant="secondary"
								>
									{statusInfo.label}
								</Badge>

								{document.validUntil && (
									<Badge
										variant="outline"
										className={cn(
											"text-xs",
											isExpired() && "border-red-500 text-red-600",
											isExpiringSoon() && "border-orange-500 text-orange-600",
										)}
									>
										<Calendar className="mr-1 h-3 w-3" />
										{isExpired()
											? "Истек"
											: `До ${format(new Date(document.validUntil), "d MMM yyyy", { locale: ru })}`}
										{isExpiringSoon() && !isExpired() && (
											<AlertTriangle className="ml-1 h-3 w-3" />
										)}
									</Badge>
								)}
							</div>

							{/* Tags */}
							{document.tags.length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{document.tags.map((tag, index) => (
										<Badge key={index} variant="secondary" className="text-xs">
											{tag}
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={handleDownload}
						>
							<Download className="h-4 w-4" />
						</Button>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleDownload}>
									<Download className="mr-2 h-4 w-4" />
									Скачать
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Eye className="mr-2 h-4 w-4" />
									Просмотреть
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handleStatusChange("approved")}
									disabled={document.status === "approved"}
								>
									Утвердить
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleStatusChange("rejected")}
									disabled={document.status === "rejected"}
								>
									Отклонить
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleStatusChange("archived")}
									disabled={document.status === "archived"}
								>
									Архивировать
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleDelete}
									className="text-red-600 focus:text-red-600"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Удалить
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
