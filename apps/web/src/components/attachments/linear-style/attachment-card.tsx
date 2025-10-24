import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatFileSize } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Copy,
	Download,
	ExternalLink,
	File,
	FileImage,
	FileSpreadsheet,
	FileText,
	Link2,
	MoreHorizontal,
} from "lucide-react";
import { useState } from "react";

interface AttachmentCardProps {
	attachment: {
		_id: string;
		fileName: string;
		fileUrl: string;
		fileSize: number;
		mimeType: string;
		uploadedAt: string;
		issue?: {
			_id: string;
			identifier: string;
			title: string;
			isConstructionTask: boolean;
		} | null;
		uploader?: {
			_id: string;
			name: string;
			email: string;
			image: string | null;
		} | null;
		constructionProject?: {
			_id: string;
			name: string;
		} | null;
	};
	viewMode: "grid" | "list";
	onPreview: () => void;
	onDownload: () => void;
	orgId?: string;
}

export function LinearAttachmentCard({
	attachment,
	viewMode,
	onPreview,
	onDownload,
	orgId,
}: AttachmentCardProps) {
	const [imageError, setImageError] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const getFileIcon = () => {
		const mimeType = attachment.mimeType.toLowerCase();
		if (mimeType.startsWith("image/")) return FileImage;
		if (mimeType === "application/pdf") return FileText;
		if (
			mimeType.includes("word") ||
			mimeType.includes("document") ||
			mimeType.includes("text")
		) {
			return FileText;
		}
		if (
			mimeType.includes("excel") ||
			mimeType.includes("spreadsheet") ||
			mimeType === "text/csv"
		) {
			return FileSpreadsheet;
		}
		return File;
	};

	const FileIcon = getFileIcon();
	const isImage = attachment.mimeType.toLowerCase().startsWith("image/");

	const getIssueUrl = () => {
		if (!attachment.issue || !orgId) return null;
		if (attachment.issue.isConstructionTask) {
			return `/construction/${orgId}/tasks/${attachment.issue._id}`;
		}
		return "/lndev-ui/team/all/all";
	};

	const issueUrl = getIssueUrl();

	const copyLink = () => {
		navigator.clipboard.writeText(attachment.fileUrl);
	};

	if (viewMode === "list") {
		return (
			<div
				className="group flex items-center gap-4 rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-muted/30"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-muted/50 transition-colors hover:bg-muted"
					onClick={onPreview}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onPreview();
						}
					}}
					role="button"
					tabIndex={0}
				>
					<FileIcon className="h-5 w-5 text-muted-foreground" />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h3
							className="cursor-pointer truncate font-medium text-sm hover:text-foreground/80"
							title={attachment.fileName}
							onClick={onPreview}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onPreview();
								}
							}}
							role="button"
							tabIndex={0}
						>
							{attachment.fileName}
						</h3>
					</div>
					<div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
						<span>{formatFileSize(attachment.fileSize)}</span>
						<span>•</span>
						<span>
							{format(new Date(attachment.uploadedAt), "d MMM", { locale: ru })}
						</span>
						{attachment.issue && (
							<>
								<span>•</span>
								{issueUrl ? (
									<Link
										to={issueUrl}
										className="flex items-center gap-1 hover:text-foreground"
									>
										<span>{attachment.issue.identifier}</span>
									</Link>
								) : (
									<span>{attachment.issue.identifier}</span>
								)}
							</>
						)}
						{attachment.uploader && (
							<>
								<span>•</span>
								<span>{attachment.uploader.name}</span>
							</>
						)}
					</div>
				</div>

				<div
					className={cn(
						"flex items-center gap-1 transition-opacity",
						isHovered ? "opacity-100" : "opacity-0",
					)}
				>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={onDownload}
					>
						<Download className="h-4 w-4" />
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onPreview}>
								<ExternalLink className="mr-2 h-4 w-4" />
								Открыть
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDownload}>
								<Download className="mr-2 h-4 w-4" />
								Скачать
							</DropdownMenuItem>
							<DropdownMenuItem onClick={copyLink}>
								<Copy className="mr-2 h-4 w-4" />
								Копировать ссылку
							</DropdownMenuItem>
							{attachment.issue && issueUrl && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link to={issueUrl}>
											<Link2 className="mr-2 h-4 w-4" />
											Перейти к задаче
										</Link>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}

	// Grid view
	return (
		<div
			className="group relative overflow-hidden rounded-lg border border-transparent bg-card transition-all hover:border-border hover:shadow-sm"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div
				className="aspect-square cursor-pointer overflow-hidden bg-muted/30"
				onClick={onPreview}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onPreview();
					}
				}}
				role="button"
				tabIndex={0}
			>
				{isImage && !imageError ? (
					<img
						src={attachment.fileUrl}
						alt={attachment.fileName}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						onError={() => setImageError(true)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<FileIcon className="h-12 w-12 text-muted-foreground/50" />
					</div>
				)}

				{/* Overlay on hover */}
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
						isHovered ? "opacity-100" : "opacity-0",
					)}
				>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="icon"
							className="h-9 w-9"
							onClick={(e) => {
								e.stopPropagation();
								onDownload();
							}}
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<div className="p-3">
				<h3
					className="mb-1 line-clamp-1 font-medium text-sm"
					title={attachment.fileName}
				>
					{attachment.fileName}
				</h3>
				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					<span>{formatFileSize(attachment.fileSize)}</span>
					<span>•</span>
					<span>
						{format(new Date(attachment.uploadedAt), "d MMM", { locale: ru })}
					</span>
				</div>
				{attachment.issue && (
					<div className="mt-1.5 text-xs">
						{issueUrl ? (
							<Link
								to={issueUrl}
								className="text-muted-foreground hover:text-foreground"
							>
								{attachment.issue.identifier}: {attachment.issue.title}
							</Link>
						) : (
							<span className="text-muted-foreground">
								{attachment.issue.identifier}: {attachment.issue.title}
							</span>
						)}
					</div>
				)}
			</div>

			{/* Quick actions */}
			<div
				className={cn(
					"absolute top-2 right-2 transition-opacity",
					isHovered ? "opacity-100" : "opacity-0",
				)}
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="h-7 w-7 shadow-sm"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="h-3 w-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onPreview}>
							<ExternalLink className="mr-2 h-4 w-4" />
							Открыть
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onDownload}>
							<Download className="mr-2 h-4 w-4" />
							Скачать
						</DropdownMenuItem>
						<DropdownMenuItem onClick={copyLink}>
							<Copy className="mr-2 h-4 w-4" />
							Копировать ссылку
						</DropdownMenuItem>
						{attachment.issue && issueUrl && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to={issueUrl}>
										<Link2 className="mr-2 h-4 w-4" />
										Перейти к задаче
									</Link>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
