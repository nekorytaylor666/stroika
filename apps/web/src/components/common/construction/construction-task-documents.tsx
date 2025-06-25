"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentsStore } from "@/store/documents-store";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ExternalLink, FileText, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "../../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionTaskDocumentsProps {
	taskId: string;
}

export function ConstructionTaskDocuments({
	taskId,
}: ConstructionTaskDocumentsProps) {
	const { setSelectedDocumentId } = useDocumentsStore();

	// Get documents linked to this task
	const taskDocuments = useQuery(api.documentTasks.getTaskDocuments, {
		taskId: taskId as Id<"issues">,
	});

	const handleViewDocument = (documentId: string) => {
		setSelectedDocumentId(documentId);
	};

	if (!taskDocuments || taskDocuments.length === 0) {
		return (
			<div className="py-4 text-center">
				<FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
				<p className="mb-2 text-muted-foreground text-sm">
					Нет прикрепленных документов
				</p>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						// Navigate to documents page with task filter
						window.location.href = `/construction/documents?taskId=${taskId}`;
					}}
				>
					<Plus className="mr-1 h-3 w-3" />
					Добавить документ
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="mb-2 flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-xs">
					Документы ({taskDocuments.length})
				</span>
				<Button
					size="sm"
					variant="ghost"
					className="h-6 px-2"
					onClick={() => {
						window.location.href = `/construction/documents?taskId=${taskId}`;
					}}
				>
					<Plus className="h-3 w-3" />
				</Button>
			</div>

			<AnimatePresence>
				{taskDocuments.map((link) => (
					<motion.div
						key={link._id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 10 }}
						className="group rounded-md bg-muted/50 p-2 transition-colors hover:bg-muted"
					>
						<div className="flex items-start gap-2">
							<FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />

							<div className="min-w-0 flex-1">
								<button
									onClick={() => handleViewDocument(link.document._id)}
									className="block truncate text-left font-medium text-sm hover:text-primary"
								>
									{link.document.title}
								</button>

								<div className="mt-1 flex items-center gap-2">
									<Badge variant="outline" className="h-5 px-1.5 text-xs">
										{link.relationshipType === "attachment" && "Вложение"}
										{link.relationshipType === "reference" && "Ссылка"}
										{link.relationshipType === "deliverable" && "Результат"}
										{link.relationshipType === "requirement" && "Требование"}
									</Badge>

									<span className="text-muted-foreground text-xs">
										{formatDistanceToNow(new Date(link.createdAt), {
											addSuffix: true,
											locale: ru,
										})}
									</span>
								</div>
							</div>

							<button
								onClick={() => handleViewDocument(link.document._id)}
								className="rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
							>
								<ExternalLink className="h-3 w-3 text-muted-foreground" />
							</button>
						</div>
					</motion.div>
				))}
			</AnimatePresence>

			<Button
				size="sm"
				variant="outline"
				className="w-full"
				onClick={() => {
					window.location.href = `/construction/documents?taskId=${taskId}`;
				}}
			>
				Управление документами
			</Button>
		</div>
	);
}
