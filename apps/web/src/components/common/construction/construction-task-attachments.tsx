"use client";

import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Download,
	File,
	FileImage,
	FileText,
	FileVideo,
	Loader2,
	Paperclip,
	Plus,
	Trash2,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { ConstructionTask } from "./construction-tasks";

interface ConstructionTaskAttachmentsProps {
	task?: ConstructionTask; // Optional - when provided, attachments are linked to the task
	projectId: Id<"constructionProjects">; // Always required - for project-level attachments
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

export function ConstructionTaskAttachments({
	task,
	projectId,
	onAttachmentsUpdate,
}: ConstructionTaskAttachmentsProps) {
	const [uploadingFiles, setUploadingFiles] = useState<
		Map<string, UploadingFile>
	>(new Map());
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const attachToIssue = useMutation(api.files.attachToIssue);
	const uploadToProject = useMutation(api.files.uploadToProject);
	const removeAttachment = useMutation(api.files.removeIssueAttachment);

	// Get attachments based on whether we have a task or just project
	const attachments = task?.attachments || [];
	const projectAttachments = useQuery(
		api.files.getProjectAttachments,
		!task ? { projectId } : "skip",
	);

	const displayAttachments = task ? attachments : projectAttachments || [];

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

					// Attach to issue or project
					if (task) {
						// If we have a task, attach to it
						await attachToIssue({
							issueId: task._id as Id<"issues">,
							projectId: projectId,
							storageId: storageId as Id<"_storage">,
							fileName: file.name,
							fileSize: file.size,
							mimeType: file.type || "application/octet-stream",
						});
					} else {
						// Otherwise, attach directly to project
						await uploadToProject({
							projectId: projectId,
							storageId: storageId as Id<"_storage">,
							fileName: file.name,
							fileSize: file.size,
							mimeType: file.type || "application/octet-stream",
						});
					}

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

	const handleRemoveAttachment = async (attachmentId: string) => {
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

	const handleDownload = async (attachment: any) => {
		const url = await getUrl;
		if (url) {
			const a = document.createElement("a");
			a.href = url;
			a.download = attachment.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	return (
		<div className="space-y-3">
			{/* Attachments list */}
			{displayAttachments && displayAttachments.length > 0 && (
				<div className="space-y-2">
					{displayAttachments.map((attachment) => {
						const FileIcon = getFileIcon(attachment.mimeType);
						return (
							<div
								key={attachment._id}
								className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
							>
								<FileIcon className="h-5 w-5 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">
										{attachment.fileName}
									</p>
									<p className="text-muted-foreground text-xs">
										{formatBytes(attachment.fileSize)} •{" "}
										{attachment.uploader?.name || "Неизвестный"} •{" "}
										{format(new Date(attachment.uploadedAt), "d MMM", {
											locale: ru,
										})}
									</p>
								</div>
								<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0"
										onClick={() => handleDownload(attachment)}
									>
										<Download className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="h-8 w-8 p-0 text-destructive hover:text-destructive"
										onClick={() => handleRemoveAttachment(attachment._id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Uploading files */}
			{uploadingFiles.size > 0 && (
				<div className="space-y-2">
					{Array.from(uploadingFiles.values()).map((uploadingFile, index) => (
						<div
							key={index}
							className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
						>
							{uploadingFile.status === "uploading" ? (
								<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							) : uploadingFile.status === "error" ? (
								<X className="h-5 w-5 text-destructive" />
							) : (
								<File className="h-5 w-5 text-muted-foreground" />
							)}
							<div className="flex-1">
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
				size="sm"
				className="w-full"
				onClick={() => fileInputRef.current?.click()}
			>
				<Plus className="mr-2 h-4 w-4" />
				Прикрепить файл
			</Button>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				onChange={(e) => e.target.files && handleFiles(e.target.files)}
				className="hidden"
			/>
		</div>
	);
}
