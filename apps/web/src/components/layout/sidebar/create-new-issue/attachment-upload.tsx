"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { File, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

interface AttachmentUploadProps {
	onAttachmentsChange: (attachments: UploadedAttachment[]) => void;
	className?: string;
}

export interface UploadedAttachment {
	storageId: Id<"_storage">;
	fileName: string;
	fileSize: number;
	mimeType: string;
}

interface UploadingFile {
	file: File;
	progress: number;
	status: "uploading" | "completed" | "error";
	error?: string;
	storageId?: Id<"_storage">;
}

export function AttachmentUpload({
	onAttachmentsChange,
	className,
}: AttachmentUploadProps) {
	const [uploadingFiles, setUploadingFiles] = useState<
		Map<string, UploadingFile>
	>(new Map());
	const [uploadedAttachments, setUploadedAttachments] = useState<
		UploadedAttachment[]
	>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

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

					// Add to uploaded attachments
					const newAttachment: UploadedAttachment = {
						storageId: storageId as Id<"_storage">,
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type || "application/octet-stream",
					};

					setUploadedAttachments((prev) => {
						const updated = [...prev, newAttachment];
						onAttachmentsChange(updated);
						return updated;
					});

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

	const removeAttachment = (index: number) => {
		setUploadedAttachments((prev) => {
			const updated = prev.filter((_, i) => i !== index);
			onAttachmentsChange(updated);
			return updated;
		});
	};

	return (
		<div className={cn("space-y-2", className)}>
			{/* Upload button */}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => fileInputRef.current?.click()}
				className="gap-1.5"
			>
				<Paperclip className="size-4" />
				Прикрепить файлы
			</Button>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				onChange={(e) => e.target.files && handleFiles(e.target.files)}
				className="hidden"
			/>

			{/* Uploading files */}
			{uploadingFiles.size > 0 && (
				<div className="space-y-1">
					{Array.from(uploadingFiles.values()).map((uploadingFile, index) => (
						<div
							key={index}
							className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm"
						>
							{uploadingFile.status === "uploading" ? (
								<Loader2 className="size-4 animate-spin text-muted-foreground" />
							) : uploadingFile.status === "error" ? (
								<X className="size-4 text-destructive" />
							) : (
								<File className="size-4 text-muted-foreground" />
							)}
							<span className="flex-1 truncate">{uploadingFile.file.name}</span>
							<span className="text-muted-foreground text-xs">
								{formatBytes(uploadingFile.file.size)}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Uploaded attachments */}
			{uploadedAttachments.length > 0 && (
				<div className="space-y-1">
					{uploadedAttachments.map((attachment, index) => (
						<div
							key={index}
							className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm"
						>
							<File className="size-4 text-muted-foreground" />
							<span className="flex-1 truncate">{attachment.fileName}</span>
							<span className="text-muted-foreground text-xs">
								{formatBytes(attachment.fileSize)}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-4"
								onClick={() => removeAttachment(index)}
							>
								<X className="size-3" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
