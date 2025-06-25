"use client";

import { DocumentsHeader } from "@/components/documents/documents-header";
import { DocumentsList } from "@/components/documents/documents-list";
import { Button } from "@/components/ui/button";
import { useDocumentsStore } from "@/store/documents-store";
import { useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { api } from "../../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

export function ConstructionDocuments() {
	const { viewMode, setSelectedParentId } = useDocumentsStore();
	const search = useSearch({
		from: "/construction/$orgId/construction-documents",
	});
	const taskId = (search as any)?.taskId;

	// If we have a taskId, show a special header
	const taskDetails = useQuery(
		api.constructionTasks.getById,
		taskId ? { id: taskId as Id<"issues"> } : "skip",
	);

	const linkToTask = useMutation(api.documentTasks.linkToTask);

	// Auto-link newly created documents to the task if taskId is present
	useEffect(() => {
		if (taskId) {
			// Store taskId in localStorage to be used by document creation
			localStorage.setItem("linkToTaskId", taskId);
		}
		return () => {
			localStorage.removeItem("linkToTaskId");
		};
	}, [taskId]);

	return (
		<div className="flex h-full flex-col">
			{taskId && taskDetails ? (
				<div className="border-gray-200 border-b px-6 py-4 dark:border-gray-800">
					<div className="mb-4 flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => window.history.back()}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Назад к задаче
						</Button>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
								Документы для задачи #{taskDetails.identifier}
							</h1>
							<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
								{taskDetails.title}
							</p>
						</div>
					</div>
				</div>
			) : (
				<ConstructionDocumentsHeader />
			)}

			<div className="flex-1 overflow-hidden">
				<DocumentsList viewMode={viewMode} />
			</div>
		</div>
	);
}

function ConstructionDocumentsHeader() {
	return (
		<div className="border-gray-200 border-b px-6 py-4 dark:border-gray-800">
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
						Строительная документация
					</h1>
					<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
						Управление документами и чертежами проекта
					</p>
				</div>
			</div>

			<DocumentsHeader />
		</div>
	);
}
