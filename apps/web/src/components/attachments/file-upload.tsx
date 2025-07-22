"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import { useMutation } from "convex/react";
import { AlertCircle, CheckCircle2, File, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";

interface FileUploadProps {
	onUploadComplete?: (files: UploadedFile[]) => void;
	maxFiles?: number;
	maxFileSize?: number; // in bytes
	acceptedFileTypes?: string[];
	className?: string;
	projectId?: string;
}

interface UploadedFile {
	storageId: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
}

interface UploadingFile {
	id: string;
	file: File;
	progress: number;
	status: "uploading" | "success" | "error";
	error?: string;
}

export function FileUpload({
	onUploadComplete,
	maxFiles = 10,
	maxFileSize = 50 * 1024 * 1024, // 50MB default
	acceptedFileTypes = [],
	className,
	projectId,
}: FileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
	const [showDialog, setShowDialog] = useState(false);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const uploadToGeneral = useMutation(api.files.uploadToGeneral);
	const uploadToProject = useMutation(api.files.uploadToProject);

	const handleFiles = useCallback(
		async (files: File[]) => {
			// Validate files
			const validFiles = files.filter((file) => {
				if (file.size > maxFileSize) {
					console.error(`File ${file.name} is too large`);
					return false;
				}
				if (
					acceptedFileTypes.length > 0 &&
					!acceptedFileTypes.includes(file.type)
				) {
					console.error(`File type ${file.type} not accepted`);
					return false;
				}
				return true;
			});

			if (validFiles.length === 0) return;

			// Limit number of files
			const filesToUpload = validFiles.slice(0, maxFiles);

			// Show dialog
			setShowDialog(true);

			// Create uploading file entries
			const newUploadingFiles: UploadingFile[] = filesToUpload.map((file) => ({
				id: Math.random().toString(36).substring(7),
				file,
				progress: 0,
				status: "uploading" as const,
			}));

			setUploadingFiles(newUploadingFiles);

			// Upload files
			const uploadedFiles: UploadedFile[] = [];

			for (const uploadingFile of newUploadingFiles) {
				try {
					// Get upload URL
					const uploadUrl = await generateUploadUrl();

					// Upload file
					const response = await fetch(uploadUrl, {
						method: "POST",
						headers: { "Content-Type": uploadingFile.file.type },
						body: uploadingFile.file,
					});

					if (!response.ok) {
						throw new Error("Upload failed");
					}

					const { storageId } = await response.json();

					// Save to database
					if (projectId) {
						await uploadToProject({
							storageId,
							fileName: uploadingFile.file.name,
							fileSize: uploadingFile.file.size,
							mimeType: uploadingFile.file.type,
							projectId: projectId as any,
						});
					} else {
						await uploadToGeneral({
							storageId,
							fileName: uploadingFile.file.name,
							fileSize: uploadingFile.file.size,
							mimeType: uploadingFile.file.type,
						});
					}

					// Update status
					setUploadingFiles((prev) =>
						prev.map((f) =>
							f.id === uploadingFile.id
								? { ...f, status: "success" as const, progress: 100 }
								: f,
						),
					);

					uploadedFiles.push({
						storageId,
						fileName: uploadingFile.file.name,
						fileSize: uploadingFile.file.size,
						mimeType: uploadingFile.file.type,
					});
				} catch (error) {
					console.error("Upload error:", error);
					setUploadingFiles((prev) =>
						prev.map((f) =>
							f.id === uploadingFile.id
								? {
										...f,
										status: "error" as const,
										error: "Ошибка загрузки",
									}
								: f,
						),
					);
				}
			}

			// Call onUploadComplete after all uploads
			if (uploadedFiles.length > 0 && onUploadComplete) {
				onUploadComplete(uploadedFiles);
			}

			// Clear dialog after a delay
			setTimeout(() => {
				setUploadingFiles([]);
				setShowDialog(false);
			}, 2000);
		},
		[
			maxFileSize,
			acceptedFileTypes,
			maxFiles,
			generateUploadUrl,
			uploadToGeneral,
			uploadToProject,
			projectId,
			onUploadComplete,
		],
	);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = Array.from(e.dataTransfer.files);
			handleFiles(files);
		},
		[handleFiles],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			handleFiles(files);
		},
		[handleFiles],
	);

	const removeFile = useCallback((id: string) => {
		setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	return (
		<>
			<div
				className={cn(
					"relative rounded-lg border-2 border-dashed transition-colors",
					isDragging
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50",
					className,
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<input
					type="file"
					id="file-upload"
					className="sr-only"
					multiple
					onChange={handleFileSelect}
					accept={acceptedFileTypes.join(",")}
				/>
				<label
					htmlFor="file-upload"
					className="flex cursor-pointer flex-col items-center justify-center px-6 py-8"
				>
					<Upload className="mb-3 h-10 w-10 text-muted-foreground" />
					<p className="mb-2 text-muted-foreground text-sm">
						<span className="font-medium">Нажмите для загрузки</span> или
						перетащите файлы
					</p>
					<p className="text-muted-foreground text-xs">
						Максимум {maxFiles} файлов, до{" "}
						{Math.round(maxFileSize / 1024 / 1024)}МБ каждый
					</p>
				</label>
			</div>

			<Dialog open={showDialog} onOpenChange={setShowDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Загрузка файлов</DialogTitle>
						<DialogDescription>
							{uploadingFiles.filter((f) => f.status === "uploading").length > 0
								? "Файлы загружаются..."
								: "Загрузка завершена"}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						{uploadingFiles.map((file) => (
							<motion.div
								key={file.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-center gap-3 rounded-lg border p-3"
							>
								<File className="h-8 w-8 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">
										{file.file.name}
									</p>
									<p className="text-muted-foreground text-xs">
										{(file.file.size / 1024 / 1024).toFixed(2)} МБ
									</p>
									{file.status === "uploading" && (
										<Progress value={file.progress} className="mt-1 h-1" />
									)}
								</div>
								<div className="flex items-center gap-2">
									{file.status === "success" && (
										<CheckCircle2 className="h-5 w-5 text-green-500" />
									)}
									{file.status === "error" && (
										<AlertCircle className="h-5 w-5 text-destructive" />
									)}
									{file.status === "uploading" && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => removeFile(file.id)}
										>
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
