"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import { useMutation } from "convex/react";
import { CheckCircle, File, Loader2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";

interface DocumentUploadProps {
	documentId: Id<"documents">;
	onUploadComplete?: () => void;
}

interface UploadingFile {
	file: File;
	progress: number;
	status: "uploading" | "completed" | "error";
	error?: string;
}

export function DocumentUpload({
	documentId,
	onUploadComplete,
}: DocumentUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState<
		Map<string, UploadingFile>
	>(new Map());
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const attachToDocument = useMutation(api.files.attachToDocument);

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
							newMap.set(fileId, { ...current, progress: 100 });
						}
						return newMap;
					});

					// Attach to document
					await attachToDocument({
						documentId,
						storageId: storageId as Id<"_storage">,
						fileName: file.name,
						fileSize: file.size,
						mimeType: file.type || "application/octet-stream",
					});

					setUploadingFiles((prev) => {
						const newMap = new Map(prev);
						const current = newMap.get(fileId);
						if (current) {
							newMap.set(fileId, { ...current, status: "completed" });
						}
						return newMap;
					});

					// Remove from list after 2 seconds
					setTimeout(() => {
						setUploadingFiles((prev) => {
							const newMap = new Map(prev);
							newMap.delete(fileId);
							return newMap;
						});
					}, 2000);

					onUploadComplete?.();
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
							error: "Failed to get upload URL",
						});
					}
					return newMap;
				});
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFiles(e.target.files);
		}
	};

	const removeFile = (fileId: string) => {
		setUploadingFiles((prev) => {
			const newMap = new Map(prev);
			newMap.delete(fileId);
			return newMap;
		});
	};

	return (
		<div className="space-y-4">
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					"rounded-lg border-2 border-dashed p-8 text-center transition-colors",
					isDragging
						? "border-blue-500 bg-blue-50 dark:bg-blue-950"
						: "border-gray-300 dark:border-gray-700",
				)}
			>
				<Upload className="mx-auto mb-4 h-8 w-8 text-gray-400" />
				<p className="mb-2 text-gray-600 text-sm dark:text-gray-400">
					Drag and drop files here or
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={() => fileInputRef.current?.click()}
				>
					Browse Files
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>

			<AnimatePresence>
				{Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
					<motion.div
						key={fileId}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900"
					>
						<div className="flex items-start gap-3">
							<File className="mt-0.5 h-5 w-5 text-gray-500" />
							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center justify-between">
									<p className="truncate font-medium text-sm">
										{uploadingFile.file.name}
									</p>
									<button
										onClick={() => removeFile(fileId)}
										className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
									>
										<X className="h-4 w-4 text-gray-500" />
									</button>
								</div>
								<p className="mb-2 text-gray-500 text-xs">
									{formatBytes(uploadingFile.file.size)}
								</p>
								{uploadingFile.status === "uploading" && (
									<Progress value={uploadingFile.progress} className="h-1" />
								)}
								{uploadingFile.status === "completed" && (
									<div className="flex items-center gap-2 text-green-600">
										<CheckCircle className="h-4 w-4" />
										<span className="text-xs">Uploaded successfully</span>
									</div>
								)}
								{uploadingFile.status === "error" && (
									<p className="text-red-600 text-xs">{uploadingFile.error}</p>
								)}
							</div>
						</div>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}
