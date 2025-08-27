"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import {
	Briefcase,
	Calendar,
	DollarSign,
	FileCheck,
	FileIcon,
	FileText,
	Loader2,
	MoreHorizontal,
	Receipt,
	Shield,
	Upload,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface LegalDocumentUploadDialogProps {
	open: boolean;
	onClose: () => void;
	projectId: Id<"constructionProjects">;
	onSuccess?: () => void;
}

const documentTypeConfig = {
	contract: {
		label: "Договор",
		icon: FileText,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
	},
	invoice: {
		label: "Счет/Фактура",
		icon: Receipt,
		color: "text-green-600",
		bgColor: "bg-green-50",
	},
	permit: {
		label: "Разрешение",
		icon: Shield,
		color: "text-purple-600",
		bgColor: "bg-purple-50",
	},
	insurance: {
		label: "Страхование",
		icon: Shield,
		color: "text-orange-600",
		bgColor: "bg-orange-50",
	},
	report: {
		label: "Отчет",
		icon: FileCheck,
		color: "text-cyan-600",
		bgColor: "bg-cyan-50",
	},
	legal: {
		label: "Юридический",
		icon: Briefcase,
		color: "text-indigo-600",
		bgColor: "bg-indigo-50",
	},
	financial: {
		label: "Финансовый",
		icon: DollarSign,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	other: {
		label: "Другое",
		icon: MoreHorizontal,
		color: "text-gray-600",
		bgColor: "bg-gray-50",
	},
};

const statusOptions = [
	{ value: "draft", label: "Черновик" },
	{ value: "pending", label: "На рассмотрении" },
	{ value: "approved", label: "Утвержден" },
	{ value: "rejected", label: "Отклонен" },
];

export function LegalDocumentUploadDialog({
	open,
	onClose,
	projectId,
	onSuccess,
}: LegalDocumentUploadDialogProps) {
	const [uploading, setUploading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [documentType, setDocumentType] = useState<string>("contract");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState<string>("pending");
	const [validUntil, setValidUntil] = useState("");
	const [tags, setTags] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const uploadDocument = useMutation(api.projectLegalDocuments.uploadDocument);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			// Auto-fill title from filename if empty
			if (!title) {
				const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
				setTitle(nameWithoutExt);
			}
		}
	};

	const handleUpload = async () => {
		if (!selectedFile || !title) {
			toast.error("Пожалуйста, выберите файл и введите название");
			return;
		}

		setUploading(true);
		try {
			// Step 1: Get upload URL
			const uploadUrl = await generateUploadUrl();

			// Step 2: Upload file to storage
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": selectedFile.type },
				body: selectedFile,
			});

			if (!result.ok) {
				throw new Error("Failed to upload file");
			}

			const { storageId } = await result.json();

			// Step 3: Create document record
			await uploadDocument({
				constructionProjectId: projectId,
				documentType: documentType as any,
				title,
				description: description || undefined,
				storageId,
				fileName: selectedFile.name,
				fileSize: selectedFile.size,
				mimeType: selectedFile.type,
				status: status as any,
				validUntil: validUntil || undefined,
				isPrivate,
				tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
			});

			toast.success("Документ успешно загружен");
			onSuccess?.();
			handleClose();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Ошибка при загрузке документа");
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		if (!uploading) {
			setSelectedFile(null);
			setTitle("");
			setDescription("");
			setStatus("pending");
			setValidUntil("");
			setTags("");
			setIsPrivate(false);
			onClose();
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Загрузить правовой документ</DialogTitle>
					<DialogDescription>
						Добавьте договор, счет, разрешение или другой документ к проекту
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Document Type Selection */}
					<div className="space-y-2">
						<Label htmlFor="type">Тип документа</Label>
						<Select value={documentType} onValueChange={setDocumentType}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(documentTypeConfig).map(([value, config]) => {
									const Icon = config.icon;
									return (
										<SelectItem key={value} value={value}>
											<div className="flex items-center gap-2">
												<Icon className={`h-4 w-4 ${config.color}`} />
												<span>{config.label}</span>
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</div>

					{/* File Upload */}
					<div className="space-y-2">
						<Label htmlFor="file">Файл</Label>
						<div
							className="cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary"
							onClick={() => fileInputRef.current?.click()}
						>
							<input
								ref={fileInputRef}
								type="file"
								className="hidden"
								onChange={handleFileSelect}
								accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
							/>
							{selectedFile ? (
								<div className="flex items-center justify-center gap-3">
									<FileIcon className="h-8 w-8 text-muted-foreground" />
									<div className="text-left">
										<p className="font-medium text-sm">{selectedFile.name}</p>
										<p className="text-muted-foreground text-xs">
											{formatFileSize(selectedFile.size)}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={(e) => {
											e.stopPropagation();
											setSelectedFile(null);
										}}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									<Upload className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="text-muted-foreground text-sm">
										Нажмите для выбора файла или перетащите его сюда
									</p>
									<p className="text-muted-foreground text-xs">
										PDF, Word, Excel, изображения (макс. 10MB)
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title">Название документа *</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Например: Договор подряда №123"
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Описание</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Дополнительная информация о документе..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						{/* Status */}
						<div className="space-y-2">
							<Label htmlFor="status">Статус</Label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{statusOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Valid Until */}
						<div className="space-y-2">
							<Label htmlFor="validUntil">Действителен до</Label>
							<div className="relative">
								<Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
								<Input
									id="validUntil"
									type="date"
									value={validUntil}
									onChange={(e) => setValidUntil(e.target.value)}
									className="pl-9"
									min={format(new Date(), "yyyy-MM-dd")}
								/>
							</div>
						</div>
					</div>

					{/* Tags */}
					<div className="space-y-2">
						<Label htmlFor="tags">Теги</Label>
						<Input
							id="tags"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder="Введите теги через запятую"
						/>
						<p className="text-muted-foreground text-xs">
							Например: важное, требует подписи, оригинал
						</p>
					</div>

					{/* Privacy */}
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="private"
							checked={isPrivate}
							onChange={(e) => setIsPrivate(e.target.checked)}
							className="rounded"
						/>
						<Label htmlFor="private" className="cursor-pointer">
							Приватный документ (доступ только для владельца)
						</Label>
					</div>
				</div>

				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={handleClose} disabled={uploading}>
						Отмена
					</Button>
					<Button
						onClick={handleUpload}
						disabled={uploading || !selectedFile || !title}
					>
						{uploading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Загрузка...
							</>
						) : (
							<>
								<Upload className="mr-2 h-4 w-4" />
								Загрузить
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
