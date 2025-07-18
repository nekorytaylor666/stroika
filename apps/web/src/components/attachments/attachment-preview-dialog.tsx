import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Download,
	File,
	FileArchive,
	FileAudio,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Image as ImageIcon,
	Loader2,
	RotateCw,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useState } from "react";

interface AttachmentPreviewDialogProps {
	attachment: {
		fileUrl: string;
		fileName: string;
		mimeType: string;
		fileSize: number;
	};
	onDownload: () => void;
}

// Extended MIME type mappings
const mimeTypeCategories = {
	image: [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
		"image/bmp",
		"image/tiff",
	],
	video: [
		"video/mp4",
		"video/mpeg",
		"video/ogg",
		"video/webm",
		"video/quicktime",
		"video/x-msvideo",
	],
	audio: [
		"audio/mpeg",
		"audio/ogg",
		"audio/wav",
		"audio/webm",
		"audio/mp3",
		"audio/m4a",
	],
	document: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/plain",
		"text/rtf",
	],
	spreadsheet: [
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"text/csv",
	],
	presentation: [
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	],
	code: [
		"text/javascript",
		"application/javascript",
		"text/typescript",
		"text/html",
		"text/css",
		"application/json",
		"text/xml",
		"application/xml",
		"text/markdown",
		"text/x-python",
		"text/x-java",
		"text/x-c",
		"text/x-cpp",
		"text/x-csharp",
		"text/x-php",
		"text/x-ruby",
		"text/x-go",
		"text/x-rust",
		"text/x-swift",
		"text/x-kotlin",
	],
	archive: [
		"application/zip",
		"application/x-rar-compressed",
		"application/x-7z-compressed",
		"application/x-tar",
		"application/gzip",
		"application/x-bzip2",
	],
};

// Get file category from MIME type
function getFileCategory(mimeType: string): string {
	const normalizedMimeType = mimeType.toLowerCase();

	for (const [category, types] of Object.entries(mimeTypeCategories)) {
		if (types.some((type) => normalizedMimeType.includes(type))) {
			return category;
		}
	}

	// Check by common patterns
	if (normalizedMimeType.startsWith("image/")) return "image";
	if (normalizedMimeType.startsWith("video/")) return "video";
	if (normalizedMimeType.startsWith("audio/")) return "audio";
	if (normalizedMimeType.startsWith("text/")) return "code";

	return "other";
}

// Get icon for file type
function getFileIcon(category: string) {
	switch (category) {
		case "image":
			return ImageIcon;
		case "video":
			return FileVideo;
		case "audio":
			return FileAudio;
		case "document":
		case "pdf":
			return FileText;
		case "spreadsheet":
			return FileSpreadsheet;
		case "code":
			return FileCode;
		case "archive":
			return FileArchive;
		default:
			return File;
	}
}

export function AttachmentPreviewDialog({
	attachment,
	onDownload,
}: AttachmentPreviewDialogProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [scale, setScale] = useState(1);
	const [rotation, setRotation] = useState(0);

	const category = getFileCategory(attachment.mimeType);
	const FileIcon = getFileIcon(category);

	const handleZoomIn = () => {
		setScale((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setScale((prev) => Math.max(prev - 0.25, 0.5));
	};

	const handleRotate = () => {
		setRotation((prev) => (prev + 90) % 360);
	};

	const handleLoad = () => {
		setLoading(false);
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
	};

	// For images, show with zoom controls
	if (category === "image" && !error) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b p-2">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleZoomOut}
							disabled={scale <= 0.5}
						>
							<ZoomOut className="h-4 w-4" />
						</Button>
						<span className="text-muted-foreground text-sm">
							{Math.round(scale * 100)}%
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleZoomIn}
							disabled={scale >= 3}
						>
							<ZoomIn className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" onClick={handleRotate}>
							<RotateCw className="h-4 w-4" />
						</Button>
					</div>
					<Button variant="outline" size="sm" onClick={onDownload}>
						<Download className="mr-2 h-4 w-4" />
						Скачать
					</Button>
				</div>
				<div className="relative flex-1 overflow-auto bg-muted/10 p-4">
					{loading && (
						<div className="absolute inset-0 flex items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					)}
					<div className="flex h-full items-center justify-center">
						<img
							src={attachment.fileUrl}
							alt={attachment.fileName}
							className="max-h-full max-w-full object-contain transition-all duration-200"
							style={{
								transform: `scale(${scale}) rotate(${rotation}deg)`,
							}}
							onLoad={handleLoad}
							onError={handleError}
						/>
					</div>
				</div>
			</div>
		);
	}

	// For PDFs, show in iframe
	if (
		category === "document" &&
		attachment.mimeType === "application/pdf" &&
		!error
	) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-end border-b p-2">
					<Button variant="outline" size="sm" onClick={onDownload}>
						<Download className="mr-2 h-4 w-4" />
						Скачать
					</Button>
				</div>
				<div className="relative flex-1">
					{loading && (
						<div className="absolute inset-0 flex items-center justify-center bg-background">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					)}
					<iframe
						src={attachment.fileUrl}
						className="h-full w-full"
						title={attachment.fileName}
						onLoad={handleLoad}
						onError={handleError}
					/>
				</div>
			</div>
		);
	}

	// For videos, show video player
	if (category === "video" && !error) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-end border-b p-2">
					<Button variant="outline" size="sm" onClick={onDownload}>
						<Download className="mr-2 h-4 w-4" />
						Скачать
					</Button>
				</div>
				<div className="relative flex-1 bg-black">
					<video
						src={attachment.fileUrl}
						className="h-full w-full"
						controls
						onLoadedMetadata={handleLoad}
						onError={handleError}
					>
						<source src={attachment.fileUrl} type={attachment.mimeType} />
						Ваш браузер не поддерживает воспроизведение видео.
					</video>
				</div>
			</div>
		);
	}

	// For audio, show audio player
	if (category === "audio" && !error) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex flex-1 items-center justify-center p-8">
					<div className="w-full max-w-md space-y-4">
						<div className="flex justify-center">
							<div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
								<FileAudio className="h-16 w-16 text-muted-foreground" />
							</div>
						</div>
						<h3 className="text-center font-medium text-lg">
							{attachment.fileName}
						</h3>
						<audio
							src={attachment.fileUrl}
							className="w-full"
							controls
							onLoadedMetadata={handleLoad}
							onError={handleError}
						>
							<source src={attachment.fileUrl} type={attachment.mimeType} />
							Ваш браузер не поддерживает воспроизведение аудио.
						</audio>
						<div className="flex justify-center">
							<Button variant="outline" onClick={onDownload}>
								<Download className="mr-2 h-4 w-4" />
								Скачать файл
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// For code files, show with syntax highlighting (basic)
	if (category === "code" && !error) {
		return (
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b p-2">
					<span className="text-muted-foreground text-sm">
						{attachment.fileName}
					</span>
					<Button variant="outline" size="sm" onClick={onDownload}>
						<Download className="mr-2 h-4 w-4" />
						Скачать
					</Button>
				</div>
				<div className="relative flex-1 overflow-auto">
					{loading && (
						<div className="absolute inset-0 flex items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					)}
					<iframe
						src={attachment.fileUrl}
						className="h-full w-full bg-muted/10"
						title={attachment.fileName}
						onLoad={handleLoad}
						onError={handleError}
						sandbox="allow-same-origin"
					/>
				</div>
			</div>
		);
	}

	// For other files, show download prompt
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-muted-foreground">
			<FileIcon className="mb-4 h-20 w-20" />
			<h3 className="mb-2 font-medium text-lg">{attachment.fileName}</h3>
			<p className="mb-6 text-center text-sm">
				Предпросмотр недоступен для этого типа файла
			</p>
			<Button onClick={onDownload}>
				<Download className="mr-2 h-4 w-4" />
				Скачать файл
			</Button>
		</div>
	);
}
