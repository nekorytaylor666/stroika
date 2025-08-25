"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Download,
	ExternalLink,
	File,
	FileAudio,
	FileCode,
	FileImage,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Trash2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface DocumentViewerProps {
	documentId: Id<"documents">;
}

const getFileIcon = (mimeType: string) => {
	if (mimeType.startsWith("image/")) return FileImage;
	if (mimeType.startsWith("video/")) return FileVideo;
	if (mimeType.startsWith("audio/")) return FileAudio;
	if (mimeType.includes("pdf")) return FileText;
	if (mimeType.includes("sheet") || mimeType.includes("excel"))
		return FileSpreadsheet;
	if (
		mimeType.includes("code") ||
		mimeType.includes("json") ||
		mimeType.includes("javascript")
	)
		return FileCode;
	return File;
};

const isPreviewable = (mimeType: string) => {
	return (
		mimeType.startsWith("image/") ||
		mimeType === "application/pdf" ||
		mimeType.startsWith("text/")
	);
};

export function DocumentViewer({ documentId }: DocumentViewerProps) {
	const [selectedFile, setSelectedFile] = useState<any>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	const attachments = useQuery(api.files.getDocumentAttachments, {
		documentId,
	});
	const removeAttachment = useMutation(api.files.removeAttachment);
	const getUrl = useQuery(
		api.files.getUrl,
		selectedFile ? { storageId: selectedFile.fileUrl } : "skip",
	);

	// Update preview URL when getUrl changes
	if (getUrl && getUrl !== previewUrl) {
		setPreviewUrl(getUrl);
	}

	const handleRemove = async (attachmentId: Id<"documentAttachments">) => {
		await removeAttachment({ attachmentId });
	};

	const handleDownload = async (attachment: any) => {
		const url = await api.files.getUrl({ storageId: attachment.fileUrl });
		if (url) {
			const a = document.createElement("a");
			a.href = url;
			a.download = attachment.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	};

	if (!attachments || attachments.length === 0) {
		return (
			<div className="py-8 text-center text-gray-500">
				<FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
				<p className="text-sm">Файлы не прикреплены</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-3">
				<AnimatePresence>
					{attachments.map((attachment) => {
						const Icon = getFileIcon(attachment.mimeType);
						const canPreview = isPreviewable(attachment.mimeType);

						return (
							<motion.div
								key={attachment._id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								className="group rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
							>
								<div className="flex items-start gap-3">
									<div className="rounded-lg bg-white p-2 shadow-sm dark:bg-gray-800">
										<Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
									</div>

									<div className="min-w-0 flex-1">
										<div className="mb-1 flex items-center justify-between">
											<h4
												className="cursor-pointer truncate font-medium text-sm hover:text-blue-600"
												onClick={() =>
													canPreview && setSelectedFile(attachment)
												}
											>
												{attachment.fileName}
											</h4>
											<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
												{canPreview && (
													<Button
														size="icon"
														variant="ghost"
														className="h-8 w-8"
														onClick={() => setSelectedFile(attachment)}
													>
														<ExternalLink className="h-4 w-4" />
													</Button>
												)}
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8"
													onClick={() => handleDownload(attachment)}
												>
													<Download className="h-4 w-4" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-red-600"
													onClick={() => handleRemove(attachment._id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>

										<div className="flex items-center gap-4 text-gray-500 text-xs">
											<span>{formatBytes(attachment.fileSize)}</span>
											<span>•</span>
											<div className="flex items-center gap-1">
												<Avatar className="h-4 w-4">
													<AvatarImage src={attachment.uploader?.avatarUrl} />
													<AvatarFallback className="text-xs">
														{attachment.uploader?.name.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<span>{attachment.uploader?.name}</span>
											</div>
											<span>•</span>
											<span>
												{formatDistanceToNow(new Date(attachment.uploadedAt), {
													addSuffix: true,
													locale: ru,
												})}
											</span>
										</div>
									</div>
								</div>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			<Dialog
				open={!!selectedFile}
				onOpenChange={() => {
					setSelectedFile(null);
					setPreviewUrl(null);
				}}
			>
				<DialogContent className="h-[80vh] max-w-4xl" hideCloseButton>
					{selectedFile && (
						<div className="flex h-full flex-col">
							<div className="flex items-center justify-between border-b p-4">
								<h3 className="font-medium">{selectedFile.fileName}</h3>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleDownload(selectedFile)}
									>
										<Download className="mr-2 h-4 w-4" />
										Download
									</Button>
									<button
										onClick={() => {
											setSelectedFile(null);
											setPreviewUrl(null);
										}}
										className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
									>
										<X className="h-5 w-5" />
									</button>
								</div>
							</div>

							<div className="flex-1 overflow-auto p-4">
								{previewUrl && selectedFile.mimeType.startsWith("image/") && (
									<img
										src={previewUrl}
										alt={selectedFile.fileName}
										className="mx-auto h-auto max-w-full"
									/>
								)}
								{previewUrl && selectedFile.mimeType === "application/pdf" && (
									<iframe
										src={previewUrl}
										className="h-full w-full"
										title={selectedFile.fileName}
									/>
								)}
								{previewUrl && selectedFile.mimeType.startsWith("text/") && (
									<iframe
										src={previewUrl}
										className="h-full w-full bg-white dark:bg-gray-900"
										title={selectedFile.fileName}
									/>
								)}
								{!isPreviewable(selectedFile.mimeType) && (
									<div className="py-12 text-center">
										<File className="mx-auto mb-4 h-16 w-16 text-gray-400" />
										<p className="text-gray-500">
											Preview not available for this file type
										</p>
										<Button
											className="mt-4"
											onClick={() => handleDownload(selectedFile)}
										>
											<Download className="mr-2 h-4 w-4" />
											Download File
										</Button>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
