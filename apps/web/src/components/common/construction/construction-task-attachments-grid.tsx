"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn, formatBytes } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Download,
	Expand,
	File,
	FileImage,
	FileText,
	FileVideo,
	Loader2,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionTaskAttachmentsGridProps {
	task: ConstructionTask;
	onAttachmentsUpdate?: () => void;
}

interface UploadingFile {
	file: File;
	progress: number;
	status: "uploading" | "completed" | "error";
	error?: string;
	storageId?: Id<"_storage">;
}

function getFileIcon(mimeType: string) {
	if (mimeType.startsWith("image/")) return FileImage;
	if (mimeType.startsWith("video/")) return FileVideo;
	if (mimeType.includes("pdf") || mimeType.includes("document"))
		return FileText;
	return File;
}

function isPreviewable(mimeType: string) {
	return (
		mimeType.startsWith("image/") ||
		mimeType === "application/pdf" ||
		mimeType.startsWith("text/")
	);
}

export function ConstructionTaskAttachmentsGrid({
	task,
	onAttachmentsUpdate,
}: ConstructionTaskAttachmentsGridProps) {
	const [uploadingFiles, setUploadingFiles] = useState<
		Map<string, UploadingFile>
	>(new Map());
	const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const attachToIssue = useMutation(api.files.attachToIssue);
	const removeAttachment = useMutation(api.files.removeIssueAttachment);

	// Get URL for preview
	const getUrl = useQuery(
		api.files.getUrl,
		selectedAttachment
			? { storageId: selectedAttachment.fileUrl as Id<"_storage"> }
			: "skip",
	);

	// Update preview URL when getUrl changes
	if (getUrl && getUrl !== previewUrl) {
		setPreviewUrl(getUrl);
	}

	const handleFiles = async (files: FileList) => {
		const filesArray = Array.from(files);

		for (const file of filesArray) {
			const fileId = `${file.name}-${Date.now()}`;
			setUploadingFiles((prev) =>
				new Map(prev).set(fileId, {
					file,
					progress: 0,
					status: "uploading",
				}),
			);

			try {
				// Get upload URL from Convex
				const uploadUrl = await generateUploadUrl();

				// Upload file to Convex storage
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": file.type || "application/octet-stream" },
					body: file,
				});

				if (response.ok) {
					const { storageId } = await response.json();

					// Update progress to 100%
					setUploadingFiles((prev) => {
						const newMap = new Map(prev);
						const current = newMap.get(fileId);
						if (current) {
							newMap.set(fileId, {
								...current,
								progress: 100,
								status: "completed",
								storageId: storageId as Id<"_storage">,
							});
						}
						return newMap;
					});

					// Attach to issue
					await attachToIssue({
						issueId: task._id as Id<"issues">,
						storageId: storageId as Id<"_storage">,
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type || "application/octet-stream",
					});

					toast.success(`Файл ${file.name} прикреплен`);
					onAttachmentsUpdate?.();

					// Remove from uploading list after 1 second
					setTimeout(() => {
						setUploadingFiles((prev) => {
							const newMap = new Map(prev);
							newMap.delete(fileId);
							return newMap;
						});
					}, 1000);
				} else {
					throw new Error("Upload failed");
				}
			} catch (error) {
				setUploadingFiles((prev) => {
					const newMap = new Map(prev);
					const current = newMap.get(fileId);
					if (current) {
						newMap.set(fileId, {
							...current,
							status: "error",
							error: "Ошибка загрузки",
						});
					}
					return newMap;
				});

				toast.error(`Ошибка загрузки файла ${file.name}`);

				// Remove from list after 3 seconds
				setTimeout(() => {
					setUploadingFiles((prev) => {
						const newMap = new Map(prev);
						newMap.delete(fileId);
						return newMap;
					});
				}, 3000);
			}
		}
	};

	const handleRemoveAttachment = async (
		attachmentId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		try {
			await removeAttachment({
				attachmentId: attachmentId as Id<"issueAttachments">,
			});
			toast.success("Файл удален");
			onAttachmentsUpdate?.();
		} catch (error) {
			toast.error("Ошибка при удалении файла");
		}
	};

	const handleDownload = async (attachment: any, e: React.MouseEvent) => {
		e.stopPropagation();
		const url = await api.files.getUrl({
			storageId: attachment.fileUrl as Id<"_storage">,
		});
		if (url) {
			const a = document.createElement("a");
			a.href = url;
			a.download = attachment.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	const openPreview = (attachment: any) => {
		if (isPreviewable(attachment.mimeType)) {
			setSelectedAttachment(attachment);
		}
	};

	const closePreview = () => {
		setSelectedAttachment(null);
		setPreviewUrl(null);
	};

	return (
		<div className="space-y-4">
			{/* Attachments Grid */}
			{task.attachments && task.attachments.length > 0 && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
					<AnimatePresence>
						{task.attachments.map((attachment) => {
							const FileIcon = getFileIcon(attachment.mimeType);
							const canPreview = isPreviewable(attachment.mimeType);

							return (
								<motion.div
									key={attachment._id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									className={cn(
										"group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
										canPreview && "cursor-pointer",
									)}
									onClick={() => openPreview(attachment)}
								>
									{/* Preview Area */}
									<div className="relative aspect-square bg-muted/30 p-8">
										{attachment.mimeType.startsWith("image/") ? (
											<div className="h-full w-full">
												<img
													src="#"
													alt={attachment.fileName}
													className="h-full w-full object-cover opacity-0"
													onLoad={(e) => {
														// We'll load the actual image URL when implementing preview
														e.currentTarget.style.opacity = "1";
													}}
												/>
												<div className="absolute inset-0 flex items-center justify-center">
													<FileImage className="h-16 w-16 text-muted-foreground" />
												</div>
											</div>
										) : (
											<div className="flex h-full items-center justify-center">
												<FileIcon className="h-16 w-16 text-muted-foreground" />
											</div>
										)}

										{/* Hover Overlay */}
										{canPreview && (
											<div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
												<Expand className="h-8 w-8 text-white" />
											</div>
										)}

										{/* Action Buttons */}
										<div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<Button
												variant="secondary"
												size="icon"
												className="h-8 w-8 bg-white/90 hover:bg-white"
												onClick={(e) => handleDownload(attachment, e)}
											>
												<Download className="h-4 w-4" />
											</Button>
											<Button
												variant="secondary"
												size="icon"
												className="h-8 w-8 bg-white/90 hover:bg-white"
												onClick={(e) =>
													handleRemoveAttachment(attachment._id, e)
												}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>

									{/* File Info */}
									<div className="p-3">
										<p className="truncate font-medium text-sm">
											{attachment.fileName}
										</p>
										<p className="text-muted-foreground text-xs">
											{formatBytes(attachment.fileSize)} •{" "}
											{format(new Date(attachment.uploadedAt), "d MMM", {
												locale: ru,
											})}
										</p>
									</div>
								</motion.div>
							);
						})}
					</AnimatePresence>
				</div>
			)}

			{/* Uploading files */}
			{uploadingFiles.size > 0 && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
					{Array.from(uploadingFiles.values()).map((uploadingFile, index) => (
						<div
							key={index}
							className="flex flex-col overflow-hidden rounded-lg border bg-muted/30"
						>
							<div className="flex aspect-square items-center justify-center">
								{uploadingFile.status === "uploading" ? (
									<Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
								) : uploadingFile.status === "error" ? (
									<X className="h-16 w-16 text-destructive" />
								) : (
									<File className="h-16 w-16 text-muted-foreground" />
								)}
							</div>
							<div className="p-3">
								<p className="truncate font-medium text-sm">
									{uploadingFile.file.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{formatBytes(uploadingFile.file.size)}
									{uploadingFile.error && (
										<span className="text-destructive">
											{" "}
											• {uploadingFile.error}
										</span>
									)}
								</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Upload button */}
			<Button
				variant="outline"
				className="w-full"
				onClick={() => fileInputRef.current?.click()}
			>
				<Plus className="mr-2 h-4 w-4" />
				Прикрепить файлы
			</Button>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				onChange={(e) => e.target.files && handleFiles(e.target.files)}
				className="hidden"
			/>

			{/* Preview Dialog */}
			<Dialog open={!!selectedAttachment} onOpenChange={closePreview}>
				<DialogContent className="h-[90vh] max-w-[90vw]" hideCloseButton>
					{selectedAttachment && (
						<div className="flex h-full flex-col">
							{/* Dialog Header */}
							<div className="flex items-center justify-between border-b px-6 py-4">
								<div>
									<h3 className="font-semibold text-lg">
										{selectedAttachment.fileName}
									</h3>
									<p className="text-muted-foreground text-sm">
										{formatBytes(selectedAttachment.fileSize)} •{" "}
										{selectedAttachment.uploader?.name || "Неизвестный"} •{" "}
										{format(
											new Date(selectedAttachment.uploadedAt),
											"d MMMM yyyy",
											{
												locale: ru,
											},
										)}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										onClick={(e) => handleDownload(selectedAttachment, e)}
									>
										<Download className="mr-2 h-4 w-4" />
										Скачать
									</Button>
									<Button variant="ghost" size="icon" onClick={closePreview}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* Preview Content */}
							<div className="flex-1 overflow-auto bg-muted/20 p-4">
								{previewUrl &&
									selectedAttachment.mimeType.startsWith("image/") && (
										<div className="flex h-full items-center justify-center">
											<img
												src={previewUrl}
												alt={selectedAttachment.fileName}
												className="h-auto max-h-full max-w-full object-contain"
											/>
										</div>
									)}
								{previewUrl &&
									selectedAttachment.mimeType === "application/pdf" && (
										<iframe
											src={previewUrl}
											className="h-full w-full rounded-lg"
											title={selectedAttachment.fileName}
										/>
									)}
								{previewUrl &&
									selectedAttachment.mimeType.startsWith("text/") && (
										<iframe
											src={previewUrl}
											className="h-full w-full rounded-lg bg-white dark:bg-gray-900"
											title={selectedAttachment.fileName}
										/>
									)}
								{!isPreviewable(selectedAttachment.mimeType) && (
									<div className="flex h-full items-center justify-center">
										<div className="text-center">
											<File className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
											<p className="text-muted-foreground">
												Предпросмотр недоступен для этого типа файла
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
