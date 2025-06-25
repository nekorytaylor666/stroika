"use client";

import { Button } from "@/components/ui/button";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { useDocumentsStore } from "@/store/documents-store";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { DocumentBoardCard } from "./document-board-card";

interface DocumentBoardProps {
	documents: any[];
}

const statusColumns = [
	{ id: "draft", label: "Draft", color: "bg-gray-200 dark:bg-gray-800" },
	{
		id: "in_progress",
		label: "In Progress",
		color: "bg-blue-200 dark:bg-blue-900",
	},
	{ id: "review", label: "Review", color: "bg-yellow-200 dark:bg-yellow-900" },
	{
		id: "completed",
		label: "Completed",
		color: "bg-green-200 dark:bg-green-900",
	},
];

export function DocumentBoard({ documents }: DocumentBoardProps) {
	const update = useMutation(api.documents.update);
	const { setIsCreateModalOpen } = useDocumentsStore();

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const documentId = active.id as string;
		const newStatus = over.id as string;

		await update({
			id: documentId as any,
			status: newStatus as any,
		});
	};

	const getDocumentsByStatus = (status: string) => {
		return documents.filter((doc) => doc.status === status);
	};

	return (
		<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<div className="flex h-full gap-4 overflow-x-auto p-6">
				{statusColumns.map((column) => {
					const columnDocs = getDocumentsByStatus(column.id);

					return (
						<motion.div
							key={column.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							className="w-80 flex-shrink-0"
						>
							<div className={`rounded-t-lg px-4 py-2 ${column.color}`}>
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-sm">{column.label}</h3>
									<span className="text-xs opacity-70">
										{columnDocs.length}
									</span>
								</div>
							</div>

							<div className="min-h-[calc(100vh-200px)] rounded-b-lg bg-gray-50 p-2 dark:bg-gray-900">
								<SortableContext
									items={columnDocs.map((doc) => doc._id)}
									strategy={verticalListSortingStrategy}
									id={column.id}
								>
									<div className="space-y-2">
										{columnDocs.map((document) => (
											<DocumentBoardCard
												key={document._id}
												document={document}
											/>
										))}
									</div>
								</SortableContext>

								{column.id === "draft" && (
									<Button
										variant="ghost"
										size="sm"
										className="mt-2 w-full justify-start text-gray-500"
										onClick={() => setIsCreateModalOpen(true)}
									>
										<Plus className="mr-2 h-4 w-4" />
										Add document
									</Button>
								)}
							</div>
						</motion.div>
					);
				})}
			</div>
		</DndContext>
	);
}
