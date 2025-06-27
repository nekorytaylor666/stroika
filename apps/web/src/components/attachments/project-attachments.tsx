"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { usePaginatedQuery } from "convex/react";
import { File, FileText, Grid3X3, Image, List, Video } from "lucide-react";
import { useState, useTransition } from "react";
import { AttachmentFilterPopover } from "./linear-style/attachment-filter-popover";
import { AttachmentStats } from "./linear-style/attachment-stats";
import { LinearAttachmentCard } from "./linear-style/linear-attachment-card";

type ProjectAttachmentsProps = {
	projectId: string;
	className?: string;
};

type ViewMode = "grid" | "list";
type FileType = "all" | "image" | "video" | "document";
type DateRange = {
	from?: Date;
	to?: Date;
};

const fileTypeOptions = [
	{ value: "all", label: "Все", icon: File },
	{ value: "image", label: "Изображения", icon: Image },
	{ value: "video", label: "Видео", icon: Video },
	{ value: "document", label: "Документы", icon: FileText },
];

export function ProjectAttachments({
	projectId,
	className,
}: ProjectAttachmentsProps) {
	const [pending] = useTransition();
	const [attachmentSearch, setAttachmentSearch] = useState("");
	const [attachmentFileType, setAttachmentFileType] = useState<FileType>("all");
	const [attachmentUploaderId, setAttachmentUploaderId] =
		useState<Id<"users"> | null>(null);
	const [attachmentDateRange, setAttachmentDateRange] =
		useState<DateRange | null>(null);
	const [attachmentDisplayMode, setAttachmentDisplayMode] =
		useState<ViewMode>("grid");
	const [attachmentView, setAttachmentView] = useState<ViewMode>("grid");

	const { results, status, loadMore } = usePaginatedQuery(
		api.attachments.projectAttachments.getPaginated,
		{
			projectId: projectId as Id<"constructionProjects">,
			search: attachmentSearch || undefined,
			fileType: attachmentFileType || undefined,
			uploaderId: attachmentUploaderId || undefined,
			startDate: attachmentDateRange?.from?.toISOString() || undefined,
			endDate: attachmentDateRange?.to?.toISOString() || undefined,
		},
		{ initialNumItems: 24 },
	);

	const attachments = results ?? [];
	const isLoading = status === "LoadingFirstPage" || pending;

	const displayModeIcon = {
		grid: Grid3X3,
		list: List,
	}[attachmentDisplayMode];

	const DisplayModeIcon = displayModeIcon;

	return (
		<div className={cn("mx-auto flex-1 p-6", className)}>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="w-auto font-semibold text-2xl">Файлы проекта</h1>
				<div className="flex items-center gap-2">
					<ToggleGroup
						type="single"
						value={attachmentFileType || "all"}
						onValueChange={(value) =>
							setAttachmentFileType((value || "all") as FileType)
						}
						className="rounded-md bg-muted p-1"
					>
						{fileTypeOptions.map((option) => (
							<ToggleGroupItem
								key={option.value}
								value={option.value}
								className="px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
							>
								<option.icon className="h-4 w-6" />
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					<ToggleGroup
						type="single"
						value={attachmentDisplayMode}
						onValueChange={(value) =>
							setAttachmentDisplayMode(value as ViewMode)
						}
						className="rounded-md bg-muted p-1"
					>
						<ToggleGroupItem
							value="grid"
							className="px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
						>
							<Grid3X3 className="h-4 w-4" />
						</ToggleGroupItem>
						<ToggleGroupItem
							value="list"
							className="px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm"
						>
							<List className="h-4 w-4" />
						</ToggleGroupItem>
					</ToggleGroup>
					<AttachmentFilterPopover />
				</div>
			</div>

			{isLoading && attachments.length === 0 ? (
				<div className="grid gap-4 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
					))}
				</div>
			) : attachments.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20">
					<File className="mb-4 h-12 w-12 text-muted-foreground" />
					<p className="text-muted-foreground">Нет файлов для отображения</p>
				</div>
			) : (
				<>
					<div
						className={cn(
							attachmentDisplayMode === "grid"
								? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
								: "space-y-2",
						)}
					>
						{attachments.map((attachment) => (
							<LinearAttachmentCard
								key={attachment._id}
								attachment={attachment}
								displayMode={attachmentDisplayMode}
								view={attachmentView}
							/>
						))}
					</div>
					{status === "CanLoadMore" && (
						<div className="mt-8 flex justify-center">
							<button
								type="button"
								onClick={() => loadMore(24)}
								className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
								disabled={pending}
							>
								Загрузить еще
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
