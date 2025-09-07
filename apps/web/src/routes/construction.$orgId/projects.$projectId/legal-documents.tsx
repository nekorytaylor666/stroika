import { LegalDocumentFilters } from "@/components/construction/legal-documents/legal-document-filters";
import { LegalDocumentList } from "@/components/construction/legal-documents/legal-document-list";
import { LegalDocumentUploadDialog } from "@/components/construction/legal-documents/legal-document-upload-dialog";
import { Button } from "@/components/ui/button";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/legal-documents",
)({
	component: LegalDocumentsPage,
});

function LegalDocumentsPage() {
	const { projectId } = Route.useParams();
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const handleClearFilters = () => {
		setSearchQuery("");
		setDocumentTypeFilter("all");
		setStatusFilter("all");
	};

	return (
		<div className="h-full overflow-auto bg-background">
			<div className="mx-auto max-w-7xl p-6">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">Правовые документы</h1>
						<p className="mt-1 text-muted-foreground">
							Управление договорами, счетами и другими документами проекта
						</p>
					</div>
					<Button onClick={() => setUploadDialogOpen(true)}>
						<Upload className="mr-2 h-4 w-4" />
						Загрузить документ
					</Button>
				</div>

				<div className="mb-6">
					<LegalDocumentFilters
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						documentTypeFilter={documentTypeFilter}
						onDocumentTypeChange={setDocumentTypeFilter}
						statusFilter={statusFilter}
						onStatusChange={setStatusFilter}
						onClearFilters={handleClearFilters}
					/>
				</div>

				<LegalDocumentList
					projectId={projectId as Id<"constructionProjects">}
					searchQuery={searchQuery}
					documentTypeFilter={documentTypeFilter}
					statusFilter={statusFilter}
				/>

				<LegalDocumentUploadDialog
					open={uploadDialogOpen}
					onOpenChange={setUploadDialogOpen}
					projectId={projectId as Id<"constructionProjects">}
				/>
			</div>
		</div>
	);
}
