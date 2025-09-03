import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LegalDocumentUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId: Id<"constructionProjects">;
}

const documentTypes = [
	{ value: "contract", label: "Договор" },
	{ value: "invoice", label: "Счет" },
	{ value: "receipt", label: "Квитанция" },
	{ value: "permit", label: "Разрешение" },
	{ value: "certificate", label: "Сертификат" },
	{ value: "report", label: "Отчет" },
	{ value: "protocol", label: "Протокол" },
	{ value: "other", label: "Другое" },
];

export function LegalDocumentUploadDialog({
	open,
	onOpenChange,
	projectId,
}: LegalDocumentUploadDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [documentType, setDocumentType] = useState<string>("");
	const [description, setDescription] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const uploadDocument = useMutation(api.projectLegalDocuments.uploadDocument);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
		}
	};

	const handleUpload = async () => {
		if (!file || !documentType) {
			toast.error("Выберите файл и тип документа");
			return;
		}

		setIsUploading(true);
		try {
			// Generate upload URL
			const uploadUrl = await generateUploadUrl();

			// Upload file to storage
			const response = await fetch(uploadUrl, {
				method: "POST",
				body: file,
			});

			if (!response.ok) {
				throw new Error("Failed to upload file");
			}

			const { storageId } = await response.json();

			// Create document record
			await uploadDocument({
				constructionProjectId: projectId,
				storageId,
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type || "application/octet-stream",
				documentType: documentType as any,
				description: description || undefined,
			});

			toast.success("Документ успешно загружен");
			onOpenChange(false);

			// Reset form
			setFile(null);
			setDocumentType("");
			setDescription("");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Ошибка при загрузке документа");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Загрузить правовой документ</DialogTitle>
					<DialogDescription>
						Добавьте договор, счет или другой документ к проекту
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="file">Файл документа</Label>
						<div className="flex items-center gap-2">
							<Input
								id="file"
								type="file"
								onChange={handleFileChange}
								disabled={isUploading}
								className="flex-1"
							/>
							{file && (
								<div className="flex items-center gap-1 text-muted-foreground text-sm">
									<FileText className="h-4 w-4" />
									{file.name}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="type">Тип документа</Label>
						<Select
							value={documentType}
							onValueChange={setDocumentType}
							disabled={isUploading}
						>
							<SelectTrigger id="type">
								<SelectValue placeholder="Выберите тип документа" />
							</SelectTrigger>
							<SelectContent>
								{documentTypes.map((type) => (
									<SelectItem key={type.value} value={type.value}>
										{type.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Описание (необязательно)</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Краткое описание документа"
							disabled={isUploading}
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isUploading}
					>
						Отмена
					</Button>
					<Button
						onClick={handleUpload}
						disabled={isUploading || !file || !documentType}
					>
						{isUploading ? (
							"Загрузка..."
						) : (
							<>
								<Upload className="mr-2 h-4 w-4" />
								Загрузить
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
