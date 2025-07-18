"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatFileSize } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Copy,
	Download,
	ExternalLink,
	FileText,
	Image as ImageIcon,
	MoreHorizontal,
	Trash2,
	Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AttachmentPreview } from "../attachment-preview";

interface LinearAttachmentCardProps {
	attachment: any;
	displayMode: "grid" | "list";
	view?: string;
	onPreview?: () => void;
	onDelete?: () => void;
}

export function LinearAttachmentCard({
	attachment,
	displayMode,
	view,
	onPreview,
	onDelete,
}: LinearAttachmentCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	const handleDownload = () => {
		const link = document.createElement("a");
		link.href = attachment.fileUrl;
		link.download = attachment.fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(attachment.fileUrl);
	};

	if (displayMode === "list") {
		return (
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				whileHover={{ x: 4 }}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<Card className="group relative overflow-hidden transition-all hover:shadow-md">
					<div className="flex items-center gap-4 p-4">
						{/* Thumbnail */}
						<div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
							<AttachmentPreview
								fileUrl={attachment.fileUrl}
								fileName={attachment.fileName}
								mimeType={attachment.mimeType}
								className="h-full w-full"
							/>
						</div>

						{/* File Info */}
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-sm">
								{attachment.fileName}
							</p>
							<div className="flex items-center gap-4 text-muted-foreground text-xs">
								<span>{formatFileSize(attachment.fileSize)}</span>
								<span>•</span>
								<span>
									{format(new Date(attachment.uploadedAt), "d MMM yyyy", {
										locale: ru,
									})}
								</span>
								{attachment.uploader && (
									<>
										<span>•</span>
										<div className="flex items-center gap-1">
											<Avatar className="h-4 w-4">
												<AvatarImage src={attachment.uploader.avatarUrl} />
												<AvatarFallback className="text-[10px]">
													{attachment.uploader.name?.[0]}
												</AvatarFallback>
											</Avatar>
											<span>{attachment.uploader.name}</span>
										</div>
									</>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleDownload}
							>
								<Download className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={onPreview}
							>
								<ExternalLink className="h-4 w-4" />
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={handleCopyLink}>
										<Copy className="mr-2 h-4 w-4" />
										Скопировать ссылку
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={onDelete} className="text-red-600">
										<Trash2 className="mr-2 h-4 w-4" />
										Удалить
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</Card>
			</motion.div>
		);
	}

	// Grid view
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ scale: 1.02 }}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Card className="group relative overflow-hidden transition-all hover:shadow-lg">
				{/* Image Preview */}
				<div
					className="aspect-square cursor-pointer overflow-hidden bg-muted"
					onClick={onPreview}
				>
					<AttachmentPreview
						fileUrl={attachment.fileUrl}
						fileName={attachment.fileName}
						mimeType={
							attachment.mimeType ||
							attachment.fileType ||
							"application/octet-stream"
						}
						className="h-full w-full transition-transform group-hover:scale-110"
					/>

					{/* Overlay Actions */}
					<motion.div
						className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
						initial={false}
						animate={{ opacity: isHovered ? 1 : 0 }}
					>
						<Button
							size="icon"
							variant="secondary"
							className="h-10 w-10 rounded-full"
							onClick={(e) => {
								e.stopPropagation();
								handleDownload();
							}}
						>
							<Download className="h-4 w-4" />
						</Button>
						<Button
							size="icon"
							variant="secondary"
							className="h-10 w-10 rounded-full"
							onClick={(e) => {
								e.stopPropagation();
								onPreview?.();
							}}
						>
							<ExternalLink className="h-4 w-4" />
						</Button>
					</motion.div>
				</div>

				{/* File Info */}
				<div className="p-3">
					<p className="mb-1 truncate font-medium text-sm">
						{attachment.fileName}
					</p>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">
							{formatFileSize(attachment.fileSize)}
						</span>
						{attachment.uploader && (
							<div className="flex items-center gap-1">
								<Avatar className="h-5 w-5">
									<AvatarImage src={attachment.uploader.avatarUrl} />
									<AvatarFallback className="text-[10px]">
										{attachment.uploader.name?.[0]}
									</AvatarFallback>
								</Avatar>
							</div>
						)}
					</div>
				</div>

				{/* More Options */}
				<div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="secondary"
								size="icon"
								className="h-8 w-8 rounded-full"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleCopyLink}>
								<Copy className="mr-2 h-4 w-4" />
								Скопировать ссылку
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onDelete} className="text-red-600">
								<Trash2 className="mr-2 h-4 w-4" />
								Удалить
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</Card>
		</motion.div>
	);
}
