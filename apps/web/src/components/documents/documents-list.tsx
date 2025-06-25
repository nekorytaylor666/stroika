"use client";

import { useDocumentsStore } from "@/store/documents-store";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { CreateDocumentModal } from "./create-document-modal";
import { DocumentBoard } from "./document-board";
import { DocumentDetailsModal } from "./document-details-modal";
import { DocumentGrid } from "./document-grid";
import { DocumentLine } from "./document-line";

interface DocumentsListProps {
	viewMode: "list" | "grid" | "board";
}

export function DocumentsList({ viewMode }: DocumentsListProps) {
	const { searchQuery, selectedParentId, filters } = useDocumentsStore();

	const documents = useQuery(api.documents.list, {
		parentId: selectedParentId,
		search: searchQuery || undefined,
	});

	if (documents === undefined) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
			</div>
		);
	}

	// Apply client-side filters
	let filteredDocs = documents;

	if (filters.status.length > 0) {
		filteredDocs = filteredDocs.filter((doc) =>
			filters.status.includes(doc.status),
		);
	}

	if (filters.assignee.length > 0) {
		filteredDocs = filteredDocs.filter(
			(doc) => doc.assignedTo && filters.assignee.includes(doc.assignedTo._id),
		);
	}

	if (filters.tags.length > 0) {
		filteredDocs = filteredDocs.filter((doc) =>
			doc.tags.some((tag) => filters.tags.includes(tag)),
		);
	}

	if (viewMode === "list") {
		return (
			<>
				<div className="flex h-full flex-col">
					<div className="flex-1 overflow-y-auto">
						<AnimatePresence mode="popLayout">
							{filteredDocs.map((document, index) => (
								<motion.div
									key={document._id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ delay: index * 0.03 }}
								>
									<DocumentLine document={document} />
								</motion.div>
							))}
						</AnimatePresence>

						{filteredDocs.length === 0 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="py-12 text-center"
							>
								<p className="text-gray-500 dark:text-gray-400">
									No documents found
								</p>
							</motion.div>
						)}
					</div>
				</div>
				<CreateDocumentModal />
				<DocumentDetailsModal />
			</>
		);
	}

	if (viewMode === "grid") {
		return (
			<>
				<div className="p-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						<AnimatePresence mode="popLayout">
							{filteredDocs.map((document, index) => (
								<motion.div
									key={document._id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ delay: index * 0.03 }}
								>
									<DocumentGrid document={document} />
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					{filteredDocs.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="py-12 text-center"
						>
							<p className="text-gray-500 dark:text-gray-400">
								No documents found
							</p>
						</motion.div>
					)}
				</div>
				<CreateDocumentModal />
				<DocumentDetailsModal />
			</>
		);
	}

	return (
		<>
			<DocumentBoard documents={filteredDocs} />
			<CreateDocumentModal />
			<DocumentDetailsModal />
		</>
	);
}
