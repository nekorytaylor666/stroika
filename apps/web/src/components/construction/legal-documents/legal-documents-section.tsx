"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import {
	AlertTriangle,
	Briefcase,
	ChevronDown,
	DollarSign,
	FileCheck,
	FileText,
	Files,
	Plus,
	Receipt,
	Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { LegalDocumentList } from "./legal-document-list";
import { LegalDocumentUploadDialog } from "./legal-document-upload-dialog";

interface LegalDocumentsSectionProps {
	projectId: Id<"constructionProjects">;
	expanded?: boolean;
	onToggle?: (expanded: boolean) => void;
	compact?: boolean;
}

const documentTypeIcons = {
	contract: FileText,
	invoice: Receipt,
	permit: Shield,
	insurance: Shield,
	report: FileCheck,
	legal: Briefcase,
	financial: DollarSign,
	other: FileText,
};

export function LegalDocumentsSection({
	projectId,
	expanded = false,
	onToggle,
	compact = false,
}: LegalDocumentsSectionProps) {
	const [isExpanded, setIsExpanded] = useState(expanded);
	const [showUploadDialog, setShowUploadDialog] = useState(false);

	// Fetch document statistics
	const stats = useQuery(api.projectLegalDocuments.getDocumentStats, {
		constructionProjectId: projectId,
	});

	// Fetch recent documents for preview
	const recentDocuments = useQuery(
		api.projectLegalDocuments.getProjectDocuments,
		{
			constructionProjectId: projectId,
		},
	);

	const handleToggle = () => {
		const newState = !isExpanded;
		setIsExpanded(newState);
		onToggle?.(newState);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	if (compact) {
		// Compact view for project overview
		return (
			<Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
				<Card>
					<CardHeader className="p-4">
						<CollapsibleTrigger className="flex w-full items-center justify-between hover:no-underline">
							<div className="flex items-center gap-3">
								<Files className="h-5 w-5 text-muted-foreground" />
								<CardTitle className="text-base">Правовые документы</CardTitle>
								{stats && (
									<>
										<Badge variant="secondary" className="ml-2">
											{stats.total} документов
										</Badge>
										{stats.expiringSoon > 0 && (
											<Badge
												variant="outline"
												className="border-orange-500 text-orange-600"
											>
												<AlertTriangle className="mr-1 h-3 w-3" />
												{stats.expiringSoon} истекает
											</Badge>
										)}
										{stats.expired > 0 && (
											<Badge
												variant="outline"
												className="border-red-500 text-red-600"
											>
												{stats.expired} истекло
											</Badge>
										)}
									</>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={(e) => {
										e.stopPropagation();
										setShowUploadDialog(true);
									}}
								>
									<Plus className="h-4 w-4" />
								</Button>
								<ChevronDown
									className={cn(
										"h-4 w-4 text-muted-foreground transition-transform",
										isExpanded && "rotate-180 transform",
									)}
								/>
							</div>
						</CollapsibleTrigger>
					</CardHeader>
					<CollapsibleContent>
						<CardContent className="pt-0">
							<LegalDocumentList projectId={projectId} />
						</CardContent>
					</CollapsibleContent>
				</Card>

				<LegalDocumentUploadDialog
					open={showUploadDialog}
					onClose={() => setShowUploadDialog(false)}
					projectId={projectId}
				/>
			</Collapsible>
		);
	}

	// Full view
	return (
		<div className="space-y-4">
			{/* Header Stats */}
			{stats && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					{/* Total Documents */}
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">
										Всего документов
									</p>
									<p className="font-semibold text-2xl">{stats.total}</p>
									<p className="mt-1 text-muted-foreground text-xs">
										{formatFileSize(stats.totalSize)}
									</p>
								</div>
								<Files className="h-8 w-8 text-muted-foreground" />
							</div>
						</CardContent>
					</Card>

					{/* Approved Documents */}
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">Утверждено</p>
									<p className="font-semibold text-2xl text-green-600">
										{stats.byStatus.approved || 0}
									</p>
									<Progress
										value={((stats.byStatus.approved || 0) / stats.total) * 100}
										className="mt-2 h-1"
									/>
								</div>
								<FileCheck className="h-8 w-8 text-green-600" />
							</div>
						</CardContent>
					</Card>

					{/* Pending Documents */}
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">
										На рассмотрении
									</p>
									<p className="font-semibold text-2xl text-yellow-600">
										{stats.byStatus.pending || 0}
									</p>
									{stats.byStatus.draft && stats.byStatus.draft > 0 && (
										<p className="mt-1 text-muted-foreground text-xs">
											+{stats.byStatus.draft} черновиков
										</p>
									)}
								</div>
								<FileText className="h-8 w-8 text-yellow-600" />
							</div>
						</CardContent>
					</Card>

					{/* Expiring Documents */}
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">
										Требуют внимания
									</p>
									<p className="font-semibold text-2xl text-orange-600">
										{stats.expiringSoon + stats.expired}
									</p>
									<div className="mt-1 flex gap-2">
										{stats.expiringSoon > 0 && (
											<Badge
												variant="outline"
												className="border-orange-500 text-orange-600 text-xs"
											>
												{stats.expiringSoon} истекает
											</Badge>
										)}
										{stats.expired > 0 && (
											<Badge
												variant="outline"
												className="border-red-500 text-red-600 text-xs"
											>
												{stats.expired} истекло
											</Badge>
										)}
									</div>
								</div>
								<AlertTriangle className="h-8 w-8 text-orange-600" />
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Document Types Breakdown */}
			{stats && Object.keys(stats.byType).length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="font-medium text-sm">
							По типам документов
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
							{Object.entries(stats.byType).map(([type, count]) => {
								const Icon =
									documentTypeIcons[type as keyof typeof documentTypeIcons] ||
									FileText;
								const typeLabels: Record<string, string> = {
									contract: "Договоры",
									invoice: "Счета",
									permit: "Разрешения",
									insurance: "Страхование",
									report: "Отчеты",
									legal: "Юридические",
									financial: "Финансовые",
									other: "Другое",
								};
								return (
									<div
										key={type}
										className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
									>
										<Icon className="h-4 w-4 text-muted-foreground" />
										<div className="flex-1">
											<p className="text-muted-foreground text-xs">
												{typeLabels[type] || type}
											</p>
											<p className="font-semibold">{count}</p>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Documents List */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Документы</CardTitle>
						<Button onClick={() => setShowUploadDialog(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Добавить документ
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<LegalDocumentList projectId={projectId} />
				</CardContent>
			</Card>

			{/* Upload Dialog */}
			<LegalDocumentUploadDialog
				open={showUploadDialog}
				onClose={() => setShowUploadDialog(false)}
				projectId={projectId}
			/>
		</div>
	);
}

export function LegalDocumentsSectionSkeleton() {
	return (
		<Card>
			<CardHeader className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-5 w-32" />
						<Skeleton className="h-5 w-20" />
					</div>
					<Skeleton className="h-4 w-4" />
				</div>
			</CardHeader>
		</Card>
	);
}
