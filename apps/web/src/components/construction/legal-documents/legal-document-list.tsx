import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Calendar,
	Download,
	Eye,
	FileIcon,
	FileText,
	MoreVertical,
	Trash2,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LegalDocumentListProps {
	projectId: Id<"constructionProjects">;
	searchQuery?: string;
	documentTypeFilter?: string;
	statusFilter?: string;
}

const documentTypeLabels: Record<string, string> = {
	contract: "Договор",
	invoice: "Счет",
	receipt: "Квитанция",
	permit: "Разрешение",
	certificate: "Сертификат",
	report: "Отчет",
	protocol: "Протокол",
	other: "Другое",
};

const statusLabels: Record<string, string> = {
	draft: "Черновик",
	pending_review: "На проверке",
	approved: "Утвержден",
	rejected: "Отклонен",
	expired: "Истек",
};

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	pending_review: "bg-yellow-100 text-yellow-700",
	approved: "bg-green-100 text-green-700",
	rejected: "bg-red-100 text-red-700",
	expired: "bg-orange-100 text-orange-700",
};

export function LegalDocumentList({
	projectId,
	searchQuery = "",
	documentTypeFilter = "all",
	statusFilter = "all",
}: LegalDocumentListProps) {
	const documents = useQuery(api.projectLegalDocuments.getProjectDocuments, {
		constructionProjectId: projectId,
	});
	const deleteDocument = useMutation(api.projectLegalDocuments.deleteDocument);

	const handleDelete = async (documentId: Id<"projectLegalDocuments">) => {
		try {
			await deleteDocument({ documentId });
			toast.success("Документ удален");
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("Ошибка при удалении документа");
		}
	};

	const handleDownload = (fileUrl: string, fileName: string) => {
		const link = document.createElement("a");
		link.href = fileUrl;
		link.download = fileName;
		link.click();
	};

	if (documents === undefined) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-5 w-32" />
							<Skeleton className="mt-2 h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-4 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	// Apply filters
	let filteredDocuments = documents;

	// Search filter
	if (searchQuery) {
		const query = searchQuery.toLowerCase();
		filteredDocuments = filteredDocuments.filter(
			(doc) =>
				doc.fileName.toLowerCase().includes(query) ||
				doc.description?.toLowerCase().includes(query) ||
				doc.title?.toLowerCase().includes(query) ||
				doc.uploader?.name?.toLowerCase().includes(query),
		);
	}

	// Document type filter
	if (documentTypeFilter !== "all") {
		filteredDocuments = filteredDocuments.filter(
			(doc) => doc.documentType === documentTypeFilter,
		);
	}

	// Status filter
	if (statusFilter !== "all") {
		filteredDocuments = filteredDocuments.filter(
			(doc) => doc.status === statusFilter,
		);
	}

	if (filteredDocuments.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<FileText className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-2 font-medium text-lg">Документы не найдены</h3>
					<p className="text-center text-muted-foreground text-sm">
						{searchQuery ||
						documentTypeFilter !== "all" ||
						statusFilter !== "all"
							? "Попробуйте изменить параметры поиска"
							: "Начните добавлять правовые документы к проекту"}
					</p>
				</CardContent>
			</Card>
		);
	}

	// Group documents by type
	const groupedDocuments = filteredDocuments.reduce(
		(acc, doc) => {
			const type = doc.documentType;
			if (!acc[type]) acc[type] = [];
			acc[type].push(doc);
			return acc;
		},
		{} as Record<string, typeof filteredDocuments>,
	);

	return (
		<div className="space-y-6">
			{Object.entries(groupedDocuments).map(([type, docs]) => (
				<div key={type}>
					<h3 className="mb-3 font-medium text-muted-foreground text-sm">
						{documentTypeLabels[type]} ({docs.length})
					</h3>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{docs.map((doc) => (
							<Card key={doc._id} className="overflow-hidden">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-2">
											<FileText className="h-5 w-5 text-blue-600" />
											<div>
												<CardTitle className="text-sm">
													{doc.fileName}
												</CardTitle>
												<CardDescription className="mt-1 text-xs">
													{(doc.fileSize / 1024 / 1024).toFixed(2)} MB
												</CardDescription>
											</div>
										</div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-8 w-8 p-0"
												>
													<MoreVertical className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onClick={() => window.open(doc.fileUrl, "_blank")}
												>
													<Eye className="mr-2 h-4 w-4" />
													Просмотреть
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleDownload(doc.fileUrl, doc.fileName)
													}
												>
													<Download className="mr-2 h-4 w-4" />
													Скачать
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDelete(doc._id)}
													className="text-red-600"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Удалить
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center justify-between">
										<Badge
											className={statusColors[doc.status]}
											variant="secondary"
										>
											{statusLabels[doc.status]}
										</Badge>
										{doc.expirationDate && (
											<span className="flex items-center gap-1 text-muted-foreground text-xs">
												<Calendar className="h-3 w-3" />
												{format(new Date(doc.expirationDate), "dd MMM yyyy", {
													locale: ru,
												})}
											</span>
										)}
									</div>
									{doc.description && (
										<p className="line-clamp-2 text-muted-foreground text-xs">
											{doc.description}
										</p>
									)}
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<User className="h-3 w-3" />
										<span>{doc.uploader?.name || "Неизвестный"}</span>
										<span>•</span>
										<span>
											{format(new Date(doc.uploadedAt), "dd MMM yyyy", {
												locale: ru,
											})}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
