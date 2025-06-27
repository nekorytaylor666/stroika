"use client";

import { AttachmentPreviewCard } from "@/components/attachments/attachment-preview-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatFileSize } from "@/lib/utils";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Download,
	File,
	FileSpreadsheet,
	FileText,
	Grid3X3,
	Image,
	List,
	Loader2,
	Search,
	X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

type ViewMode = "grid" | "list";
type FileType = "all" | "image" | "pdf" | "document" | "spreadsheet" | "other";

export function AllAttachments() {
	const [search, setSearch] = useState("");
	const [fileType, setFileType] = useState<FileType>("all");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
	const [attachments, setAttachments] = useState<any[]>([]);
	const [cursor, setCursor] = useState<number | null>(null);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const { ref: loadMoreRef, inView } = useInView({
		threshold: 0,
		rootMargin: "100px",
	});

	// Fetch attachments
	const attachmentsData = useQuery(api.attachments.queries.getAllAttachments, {
		limit: 50,
		cursor: cursor || undefined,
		search: search || undefined,
		fileType: fileType === "all" ? undefined : fileType,
	});

	// Fetch stats
	const stats = useQuery(api.attachments.queries.getAttachmentStats);

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

	const getFileTypeIcon = (type: string) => {
		switch (type) {
			case "image":
				return Image;
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
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b p-6">
				<div className="mb-4 flex items-center justify-between">
					<h1 className="font-semibold text-2xl">Все вложения</h1>
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === "grid" ? "default" : "outline"}
							size="icon"
							onClick={() => setViewMode("grid")}
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "outline"}
							size="icon"
							onClick={() => setViewMode("list")}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Stats */}
				{stats && (
					<div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="font-medium text-muted-foreground text-sm">
									Всего файлов
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">{stats.totalCount}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="font-medium text-muted-foreground text-sm">
									Общий размер
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">
									{formatFileSize(stats.totalSize)}
								</p>
							</CardContent>
						</Card>
						{Object.entries(stats.byType).map(([type, count]) => {
							const Icon = getFileTypeIcon(type);
							return (
								<Card key={type}>
									<CardHeader className="pb-2">
										<CardTitle className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
											<Icon className="h-4 w-4" />
											{getFileTypeLabel(type)}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="font-bold text-2xl">{count}</p>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}

				{/* Filters */}
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="relative flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Поиск по названию файла..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select
						value={fileType}
						onValueChange={(value) => setFileType(value as FileType)}
					>
						<SelectTrigger className="w-[200px]">
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

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6">
				{!attachmentsData && (
					<div
						className={cn(
							viewMode === "grid"
								? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
								: "space-y-4",
						)}
					>
						{[...Array(10)].map((_, i) => (
							<Skeleton key={i} className="h-64 w-full" />
						))}
					</div>
				)}

				{attachments.length === 0 && attachmentsData && (
					<div className="flex h-full flex-col items-center justify-center text-muted-foreground">
						<File className="mb-4 h-16 w-16" />
						<p className="font-medium text-lg">Вложения не найдены</p>
						<p className="text-sm">
							{search || fileType !== "all"
								? "Попробуйте изменить параметры поиска"
								: "Загрузите файлы в задачи, чтобы они появились здесь"}
						</p>
					</div>
				)}

				{attachments.length > 0 && (
					<>
						<motion.div
							className={cn(
								viewMode === "grid"
									? "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
									: "space-y-4",
							)}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							{attachments.map((attachment, index) => (
								<motion.div
									key={attachment._id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<AttachmentPreviewCard
										attachment={attachment}
										onPreview={() => setSelectedAttachment(attachment)}
										onDownload={() => handleDownload(attachment)}
									/>
								</motion.div>
							))}
						</motion.div>

						{/* Load more trigger */}
						{hasMore && (
							<div ref={loadMoreRef} className="mt-8 flex justify-center">
								{isLoadingMore && (
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								)}
							</div>
						)}
					</>
				)}
			</div>

			{/* Preview Dialog */}
			<Dialog open={!!selectedAttachment} onOpenChange={closePreview}>
				<DialogContent className="h-[90vh] max-w-[90vw]" hideCloseButton>
					<div className="flex h-full flex-col">
						<div className="flex items-center justify-between border-b p-4">
							<div className="flex-1">
								<h3 className="font-medium">{selectedAttachment?.fileName}</h3>
								<div className="flex items-center gap-4 text-muted-foreground text-sm">
									<span>
										{formatFileSize(selectedAttachment?.fileSize || 0)}
									</span>
									<span>
										{selectedAttachment?.uploadedAt &&
											format(
												new Date(selectedAttachment.uploadedAt),
												"d MMMM yyyy, HH:mm",
												{
													locale: ru,
												},
											)}
									</span>
									{selectedAttachment?.uploader && (
										<span>Загрузил: {selectedAttachment.uploader.name}</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									onClick={() => handleDownload(selectedAttachment)}
								>
									<Download className="h-4 w-4" />
								</Button>
								<Button variant="ghost" size="icon" onClick={closePreview}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div className="flex-1 overflow-hidden">
							{selectedAttachment && (
								<AttachmentPreviewDialog
									attachment={selectedAttachment}
									onDownload={() => handleDownload(selectedAttachment)}
								/>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
