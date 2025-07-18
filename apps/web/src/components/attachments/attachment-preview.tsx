import { cn } from "@/lib/utils";
import {
	File,
	FileArchive,
	FileAudio,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileVideo,
	Image as ImageIcon,
	Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AttachmentPreviewProps {
	fileUrl: string;
	fileName: string;
	mimeType: string;
	className?: string;
	onLoad?: () => void;
	onError?: () => void;
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

export function AttachmentPreview({
	fileUrl,
	fileName,
	mimeType,
	className,
	onLoad,
	onError,
}: AttachmentPreviewProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	const category = getFileCategory(mimeType);
	const FileIcon = getFileIcon(category);

	useEffect(() => {
		setLoading(true);
		setError(false);
		setImageLoaded(false);
	}, [fileUrl]);

	const handleLoad = () => {
		setLoading(false);
		setImageLoaded(true);
		onLoad?.();
	};

	const handleError = () => {
		setLoading(false);
		setError(true);
		onError?.();
	};

	// For images, show actual preview
	if (category === "image" && !error) {
		return (
			<div className={cn("relative overflow-hidden", className)}>
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-muted/50">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
				<img
					src={fileUrl}
					alt={fileName}
					className={cn(
						"h-full w-full object-cover transition-opacity duration-200",
						imageLoaded ? "opacity-100" : "opacity-0",
					)}
					onLoad={handleLoad}
					onError={handleError}
				/>
			</div>
		);
	}

	// For PDFs, show embedded preview (thumbnail)
	if (category === "document" && mimeType === "application/pdf" && !error) {
		return (
			<div className={cn("relative overflow-hidden bg-white", className)}>
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-muted/50">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}
				<iframe
					src={`${fileUrl}#toolbar=0&navpanes=0&view=FitH`}
					className="h-full w-full"
					title={fileName}
					onLoad={handleLoad}
					onError={handleError}
				/>
			</div>
		);
	}

	// For videos, show video element with poster
	if (category === "video" && !error) {
		return (
			<div className={cn("relative overflow-hidden bg-black", className)}>
				<video
					src={fileUrl}
					className="h-full w-full object-contain"
					preload="metadata"
					onLoadedMetadata={handleLoad}
					onError={handleError}
				>
					<source src={fileUrl} type={mimeType} />
				</video>
			</div>
		);
	}

	// For other files, show icon with file info
	return (
		<div
			className={cn(
				"flex h-full w-full flex-col items-center justify-center bg-muted/10",
				className,
			)}
		>
			<FileIcon className="mb-2 h-16 w-16 text-muted-foreground" />
			<span className="max-w-[80%] truncate text-muted-foreground text-xs">
				{fileName}
			</span>
		</div>
	);
}
