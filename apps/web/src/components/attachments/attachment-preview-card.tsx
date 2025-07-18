import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatFileSize } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Download, Eye, MoreVertical } from "lucide-react";
import { AttachmentPreview } from "./attachment-preview";

interface AttachmentPreviewCardProps {
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
	onPreview: () => void;
	onDownload: () => void;
}

export function AttachmentPreviewCard({
	attachment,
	onPreview,
	onDownload,
}: AttachmentPreviewCardProps) {
	const getIssueUrl = () => {
		if (!attachment.issue) return null;
		if (attachment.issue.isConstructionTask) {
			return `/construction/lndev-ui/construction-tasks`;
		}
		return `/lndev-ui/team/all/all`;
	};

	const issueUrl = getIssueUrl();

	return (
		<Card className="group relative overflow-hidden transition-all hover:shadow-md">
			<div
				className="aspect-square cursor-pointer overflow-hidden bg-muted/50"
				onClick={onPreview}
			>
				<AttachmentPreview
					fileUrl={attachment.fileUrl}
					fileName={attachment.fileName}
					mimeType={attachment.mimeType}
					className="h-full w-full transition-transform group-hover:scale-105"
				/>
			</div>

			<div className="p-4">
				<div className="mb-2 flex items-start justify-between">
					<h3
						className="line-clamp-1 font-medium text-sm"
						title={attachment.fileName}
					>
						{attachment.fileName}
					</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-6 w-6">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onPreview}>
								<Eye className="mr-2 h-4 w-4" />
								Просмотр
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDownload}>
								<Download className="mr-2 h-4 w-4" />
								Скачать
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="space-y-2 text-muted-foreground text-xs">
					<div className="flex items-center justify-between">
						<span>{formatFileSize(attachment.fileSize)}</span>
						<span>
							{format(new Date(attachment.uploadedAt), "d MMM", { locale: ru })}
						</span>
					</div>

					{attachment.issue && (
						<div className="flex items-center gap-1">
							<span className="truncate">
								{issueUrl ? (
									<Link
										to={issueUrl}
										className="hover:text-foreground hover:underline"
									>
										{attachment.issue.identifier}: {attachment.issue.title}
									</Link>
								) : (
									<>
										{attachment.issue.identifier}: {attachment.issue.title}
									</>
								)}
							</span>
							{attachment.issue.isConstructionTask && (
								<Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
									Строительство
								</Badge>
							)}
						</div>
					)}

					{attachment.constructionProject && (
						<div className="truncate text-xs">
							Проект: {attachment.constructionProject.name}
						</div>
					)}

					{attachment.uploader && (
						<div className="flex items-center gap-2">
							<Avatar className="h-5 w-5">
								<AvatarImage src={attachment.uploader.image || undefined} />
								<AvatarFallback className="text-[10px]">
									{attachment.uploader.name.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="truncate">{attachment.uploader.name}</span>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
