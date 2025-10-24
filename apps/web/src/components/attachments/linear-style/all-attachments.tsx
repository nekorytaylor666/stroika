"use client";

import { FileUpload } from "@/components/attachments/file-upload";
import { LinearAttachmentCard } from "@/components/attachments/linear-style/attachment-card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn, formatFileSize } from "@/lib/utils";
import { api } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Download,
	File,
	FileImage,
	FileSpreadsheet,
	FileText,
	Files,
	Grid2X2,
	List,
	Loader2,
	Plus,
	Search,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

type ViewMode = "grid" | "list";
type FileType = "all" | "image" | "pdf" | "document" | "spreadsheet" | "other";

interface LinearAllAttachmentsProps {
	projectId?: string;
}

export function LinearAllAttachments({
	projectId,
}: LinearAllAttachmentsProps = {}) {
	// Get orgId from route params
	const params = useParams({ strict: false });
	const orgId = params.orgId;
	const [search, setSearch] = useState("");
	const [fileType, setFileType] = useState<FileType>("all");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
	const [attachments, setAttachments] = useState<any[]>([]);
	const [cursor, setCursor] = useState<number | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [showUploadDialog, setShowUploadDialog] = useState(false);

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	// Fetch attachments
	const attachmentsData = useQuery(
		projectId
			? api.attachments.projectAttachments.getAllForProject
			: api.attachments.queries.getAllAttachments,
		{
			limit: 50,
			cursor: cursor || undefined,
			search: search || undefined,
			fileType: fileType === "all" ? undefined : fileType,
			...(projectId ? { projectId: projectId as any } : {}),
		},
	);

	// Fetch stats
	const stats = useQuery(
		projectId
			? api.attachments.projectAttachments.getProjectStats
			: api.attachments.queries.getAttachmentStats,
		projectId ? { projectId: projectId as any } : undefined,
	);

	// Handle initial data load
	useEffect(() => {
		if (attachmentsData && !cursor) {
			setAttachments(attachmentsData.items);
			setCursor(attachmentsData.nextCursor);
			setHasMore(attachmentsData.hasMore);
		}
	}, [attachmentsData, cursor]);

	// Handle pagination
	useEffect(() => {
		if (inView && hasMore && !isLoadingMore && cursor) {
			setIsLoadingMore(true);
		}
	}, [inView, hasMore, isLoadingMore, cursor]);

	// Load more attachments when cursor changes
	useEffect(() => {
		if (isLoadingMore && attachmentsData && cursor) {
			setAttachments((prev) => [...prev, ...attachmentsData.items]);
			setCursor(attachmentsData.nextCursor);
			setHasMore(attachmentsData.hasMore);
			setIsLoadingMore(false);
		}
	}, [attachmentsData, isLoadingMore, cursor]);

	// Reset when filters change
	useEffect(() => {
		setAttachments([]);
		setCursor(null);
		setHasMore(true);
	}, [search, fileType]);

	const handleDownload = useCallback((attachment: any) => {
		const link = document.createElement("a");
		link.href = attachment.fileUrl;
		link.download = attachment.fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, []);

	const closePreview = () => setSelectedAttachment(null);

	const handleUploadComplete = useCallback(() => {
		// Reset pagination to reload with new files
		setAttachments([]);
		setCursor(null);
		setHasMore(true);
		setShowUploadDialog(false);
	}, []);

	const getFileTypeIcon = (type: string) => {
		switch (type) {
			case "image":
				return FileImage;
			case "pdf":
				return FileText;
			case "document":
				return FileText;
			case "spreadsheet":
				return FileSpreadsheet;
			default:
				return File;
		}
	};

	const getFileTypeLabel = (type: string) => {
		switch (type) {
			case "image":
				return "Изображения";
			case "pdf":
				return "PDF";
			case "document":
				return "Документы";
			case "spreadsheet":
				return "Таблицы";
			case "other":
				return "Другие";
			default:
				return "Все файлы";
		}
	};

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="flex flex-col gap-4 px-8 py-6">
					<div className="flex items-center justify-between">
						<h1 className="font-semibold text-2xl">
							{projectId ? "Файлы проекта" : "Вложения"}
						</h1>
						<div className="flex items-center gap-3">
							<Button
								onClick={() => setShowUploadDialog(true)}
								size="sm"
								className="h-8"
							>
								<Plus className="mr-2 h-4 w-4" />
								Загрузить файлы
							</Button>
							<div className="flex items-center gap-1 rounded-lg border p-1">
								<Button
									variant={viewMode === "grid" ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setViewMode("grid")}
									className="h-7 px-2"
								>
									<Grid2X2 className="h-4 w-4" />
								</Button>
								<Button
									variant={viewMode === "list" ? "secondary" : "ghost"}
									size="sm"
									onClick={() => setViewMode("list")}
									className="h-7 px-2"
								>
									<List className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* Stats bar */}
					{stats && (
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<Files className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">{stats.totalCount}</span>
								<span className="text-muted-foreground">файлов</span>
							</div>
							<div className="h-4 w-px bg-border" />
							<div className="flex items-center gap-2">
								<span className="font-medium">
									{formatFileSize(stats.totalSize)}
								</span>
								<span className="text-muted-foreground">всего</span>
							</div>
							{Object.entries(stats.byType).map(([type, count]) => {
								const Icon = getFileTypeIcon(type);
								return (
									<div key={type} className="flex items-center gap-2">
										<div className="h-4 w-px bg-border" />
										<Icon className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">{count}</span>
									</div>
								);
							})}
						</div>
					)}

					{/* Filters */}
					<div className="flex gap-3">
						<div className="relative max-w-md flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Поиск файлов..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-9 border-0 bg-muted/50 pl-9 focus:bg-background focus:ring-1 focus:ring-border"
							/>
						</div>
						<Select
							value={fileType}
							onValueChange={(value) => setFileType(value as FileType)}
						>
							<SelectTrigger className="h-9 w-[180px] border-0 bg-muted/50 focus:bg-background focus:ring-1 focus:ring-border">
								<SelectValue placeholder="Тип файла" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все файлы</SelectItem>
								<SelectItem value="image">Изображения</SelectItem>
								<SelectItem value="pdf">PDF</SelectItem>
								<SelectItem value="document">Документы</SelectItem>
								<SelectItem value="spreadsheet">Таблицы</SelectItem>
								<SelectItem value="other">Другие</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-8 py-6">
					{!attachmentsData && (
						<div
							className={cn(
								viewMode === "grid"
									? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
									: "space-y-2",
							)}
						>
							{[...Array(12)].map((_, i) => (
								<div
									key={i}
									className={cn(
										"animate-pulse rounded-lg bg-muted/50",
										viewMode === "grid" ? "aspect-square" : "h-16",
									)}
								/>
							))}
						</div>
					)}

					{attachments.length === 0 && attachmentsData && (
						<div className="flex h-[400px] flex-col items-center justify-center text-muted-foreground">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Files className="h-8 w-8" />
							</div>
							<p className="mb-1 font-medium text-base">Файлы не найдены</p>
							<p className="text-sm">
								{search || fileType !== "all"
									? "Попробуйте изменить параметры поиска"
									: "Загрузите файлы в задачи"}
							</p>
						</div>
					)}

					{attachments.length > 0 && (
						<>
							<motion.div
								className={cn(
									viewMode === "grid"
										? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
										: "space-y-2",
								)}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
							>
								{attachments.map((attachment, index) => (
									<motion.div
										key={attachment._id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.02 }}
									>
										<LinearAttachmentCard
											attachment={attachment}
											viewMode={viewMode}
											onPreview={() => setSelectedAttachment(attachment)}
											onDownload={() => handleDownload(attachment)}
											orgId={orgId}
										/>
									</motion.div>
								))}
							</motion.div>

							{/* Load more trigger */}
							{hasMore && (
								<div ref={loadMoreRef} className="mt-8 flex justify-center">
									{isLoadingMore && (
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Preview Dialog */}
			<Dialog open={!!selectedAttachment} onOpenChange={closePreview}>
				<DialogContent className="h-[90vh] max-w-[90vw] p-0" hideCloseButton>
					<div className="flex h-full flex-col">
						<div className="flex items-center justify-between border-b px-6 py-4">
							<div className="flex-1 pr-4">
								<h3 className="font-medium text-base">
									{selectedAttachment?.fileName}
								</h3>
								<div className="mt-1 flex items-center gap-3 text-muted-foreground text-sm">
									<span>
										{formatFileSize(selectedAttachment?.fileSize || 0)}
									</span>
									<span className="text-muted-foreground/50">•</span>
									<span>
										{selectedAttachment?.uploadedAt &&
											format(
												new Date(selectedAttachment.uploadedAt),
												"d MMMM yyyy",
												{
													locale: ru,
												},
											)}
									</span>
									{selectedAttachment?.uploader && (
										<>
											<span className="text-muted-foreground/50">•</span>
											<span>{selectedAttachment.uploader.name}</span>
										</>
									)}
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => handleDownload(selectedAttachment)}
									className="h-9 w-9"
								>
									<Download className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={closePreview}
									className="h-9 w-9"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div className="flex-1 overflow-hidden bg-muted/20">
							{selectedAttachment?.mimeType.startsWith("image/") ? (
								<div className="flex h-full items-center justify-center p-8">
									<img
										src={selectedAttachment.fileUrl}
										alt={selectedAttachment.fileName}
										className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
									/>
								</div>
							) : selectedAttachment?.mimeType === "application/pdf" ? (
								<iframe
									src={selectedAttachment.fileUrl}
									className="h-full w-full"
									title={selectedAttachment.fileName}
								/>
							) : (
								<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
									<div className="mb-4 rounded-full bg-muted p-6">
										<File className="h-12 w-12" />
									</div>
									<p className="mb-1 font-medium text-base">
										Предпросмотр недоступен
									</p>
									<p className="mb-4 text-sm">Скачайте файл для просмотра</p>
									<Button
										variant="secondary"
										onClick={() => handleDownload(selectedAttachment)}
									>
										<Download className="mr-2 h-4 w-4" />
										Скачать файл
									</Button>
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Upload Dialog */}
			<Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
					<DialogHeader>
						<DialogTitle>Загрузить файлы</DialogTitle>
						<DialogDescription>
							{projectId
								? "Загрузите файлы в проект. Они будут доступны всем участникам проекта."
								: "Загрузите файлы в систему. Они будут доступны всем пользователям."}
						</DialogDescription>
					</DialogHeader>
					<div className="max-h-[calc(90vh-120px)] overflow-y-auto">
						<FileUpload
							onUploadComplete={handleUploadComplete}
							maxFiles={10}
							maxFileSize={50 * 1024 * 1024} // 50MB
							projectId={projectId}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
