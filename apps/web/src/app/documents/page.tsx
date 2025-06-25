"use client";

import { DocumentsHeader } from "@/components/documents/documents-header";
import { DocumentsList } from "@/components/documents/documents-list";
import { useDocumentsStore } from "@/store/documents-store";

export default function DocumentsPage() {
	const { viewMode } = useDocumentsStore();

	return (
		<div className="flex h-full flex-col">
			<DocumentsHeader />
			<div className="flex-1 overflow-hidden">
				<DocumentsList viewMode={viewMode} />
			</div>
		</div>
	);
}
