"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { FileX, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { LegalDocumentCard } from "./legal-document-card";
import { LegalDocumentUploadDialog } from "./legal-document-upload-dialog";

interface LegalDocumentListProps {
	projectId: Id<"constructionProjects">;
}

const documentTypes = [
	{ value: "all", label: "Все типы" },
	{ value: "contract", label: "Договоры" },
	{ value: "invoice", label: "Счета" },
	{ value: "permit", label: "Разрешения" },
	{ value: "insurance", label: "Страхование" },
	{ value: "report", label: "Отчеты" },
	{ value: "legal", label: "Юридические" },
	{ value: "financial", label: "Финансовые" },
	{ value: "other", label: "Другое" },
];

const statusOptions = [
	{ value: "all", label: "Все статусы" },
	{ value: "draft", label: "Черновик" },
	{ value: "pending", label: "На рассмотрении" },
	{ value: "approved", label: "Утвержден" },
	{ value: "rejected", label: "Отклонен" },
	{ value: "expired", label: "Истек" },
	{ value: "archived", label: "Архивирован" },
];

export function LegalDocumentList({ projectId }: LegalDocumentListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedType, setSelectedType] = useState("all");
	const [selectedStatus, setSelectedStatus] = useState("all");
	const [showUploadDialog, setShowUploadDialog] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	// Fetch documents
	const documents = useQuery(api.projectLegalDocuments.getProjectDocuments, {
		constructionProjectId: projectId,
		documentType: selectedType !== "all" ? (selectedType as any) : undefined,
		status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
	});

	// Filter documents by search query
	const filteredDocuments = useMemo(() => {
		if (!documents) return [];
		if (!searchQuery) return documents;

		const query = searchQuery.toLowerCase();
		return documents.filter(
			(doc) =>
				doc.title.toLowerCase().includes(query) ||
				doc.description?.toLowerCase().includes(query) ||
				doc.fileName.toLowerCase().includes(query) ||
				doc.tags.some((tag) => tag.toLowerCase().includes(query)),
		);
	}, [documents, searchQuery]);

	if (!documents) {
		return <DocumentListSkeleton />;
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-1 items-center gap-2">
					{/* Search */}
					<div className="relative max-w-md flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						<Input
							placeholder="Поиск документов..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Filter Toggle */}
					<Button
						variant={showFilters ? "secondary" : "outline"}
						size="icon"
						onClick={() => setShowFilters(!showFilters)}
					>
						<SlidersHorizontal className="h-4 w-4" />
					</Button>
				</div>

				{/* Upload Button */}
				<Button onClick={() => setShowUploadDialog(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Добавить документ
				</Button>
			</div>

			{/* Filters */}
			{showFilters && (
				<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
					<Select value={selectedType} onValueChange={setSelectedType}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{documentTypes.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={selectedStatus} onValueChange={setSelectedStatus}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{statusOptions.map((status) => (
								<SelectItem key={status.value} value={status.value}>
									{status.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{(selectedType !== "all" || selectedStatus !== "all") && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSelectedType("all");
								setSelectedStatus("all");
							}}
						>
							Сбросить фильтры
						</Button>
					)}
				</div>
			)}

			{/* Document List */}
			{filteredDocuments.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<FileX className="mb-3 h-12 w-12 text-muted-foreground" />
					<h3 className="mb-1 font-medium text-sm">Документы не найдены</h3>
					<p className="text-muted-foreground text-xs">
						{searchQuery || selectedType !== "all" || selectedStatus !== "all"
							? "Попробуйте изменить параметры поиска"
							: "Добавьте первый документ к проекту"}
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{filteredDocuments.map((document) => (
						<LegalDocumentCard
							key={document._id}
							document={document}
							onDelete={() => {
								// Refetch will happen automatically due to Convex reactivity
							}}
							onStatusChange={() => {
								// Refetch will happen automatically due to Convex reactivity
							}}
						/>
					))}
				</div>
			)}

			{/* Upload Dialog */}
			<LegalDocumentUploadDialog
				open={showUploadDialog}
				onClose={() => setShowUploadDialog(false)}
				projectId={projectId}
				onSuccess={() => {
					// Refetch will happen automatically due to Convex reactivity
				}}
			/>
		</div>
	);
}

function DocumentListSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<Skeleton className="h-10 max-w-md flex-1" />
				<Skeleton className="h-10 w-32" />
			</div>
			<div className="space-y-2">
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className="h-24 w-full" />
				))}
			</div>
		</div>
	);
}
