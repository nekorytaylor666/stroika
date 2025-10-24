import { LegalDocumentFilters } from "@/components/construction/legal-documents/legal-document-filters";
import { LegalDocumentList } from "@/components/construction/legal-documents/legal-document-list";
import { LegalDocumentUploadDialog } from "@/components/construction/legal-documents/legal-document-upload-dialog";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePermissions, useProjectPermissions } from "@/hooks/use-permissions";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Lock, Upload } from "lucide-react";
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

	// Use permission hooks with colon notation
	// Permission levels needed:
	// - documents:read - View documents
	// - documents:create - Upload new documents
	// - documents:update - Edit existing documents
	// - documents:manage - Full document management (create, read, update, delete)
	const permissions = usePermissions();
	const projectPermissions = useProjectPermissions(projectId);

	const handleClearFilters = () => {
		setSearchQuery("");
		setDocumentTypeFilter("all");
		setStatusFilter("all");
	};

	// Loading state
	if (permissions.isLoading || projectPermissions.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check basic project access first
	if (!projectPermissions.canView) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к этому проекту. Обратитесь к администратору для
							получения необходимых разрешений.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	// Check if user can view documents
	const canViewDocuments =
		permissions.hasPermission("documents:read") ||
		permissions.hasPermission("documents:manage") ||
		permissions.isOwner;

	if (!canViewDocuments) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к документам. Необходимы права на просмотр
							документов (documents:read) для доступа к этой странице.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	// Check if user can upload documents using colon notation
	const canUploadDocuments =
		projectPermissions.canEdit &&
		(permissions.hasPermission("documents:create") ||
			permissions.hasPermission("documents:manage"));

	// Check if user can manage (edit/delete) documents
	const canManageDocuments =
		projectPermissions.canAdmin ||
		permissions.hasPermission("documents:manage") ||
		permissions.isOwner;

	// Check if user can edit documents
	const canEditDocuments =
		projectPermissions.canEdit &&
		(permissions.hasPermission("documents:update") ||
			permissions.hasPermission("documents:manage"));

	// Check if user has read-only access
	const isReadOnly = !canUploadDocuments;

	return (
		<div className="h-full overflow-auto bg-background">
			<div className="mx-auto max-w-7xl p-6">
				{/* Show read-only notice if applicable */}
				{isReadOnly && (
					<Alert className="mb-6">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							У вас есть доступ только для просмотра документов этого проекта.
							Для загрузки документов необходимы права documents:create или
							documents:manage. Обратитесь к администратору для получения
							необходимых разрешений.
						</AlertDescription>
					</Alert>
				)}

				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">Правовые документы</h1>
						<p className="mt-1 text-muted-foreground">
							Управление договорами, счетами и другими документами проекта
							{isReadOnly && " (только просмотр)"}
						</p>
					</div>
					{canUploadDocuments && (
						<Button onClick={() => setUploadDialogOpen(true)}>
							<Upload className="mr-2 h-4 w-4" />
							Загрузить документ
						</Button>
					)}
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
					canEdit={canEditDocuments}
					canManage={canManageDocuments}
					canUpload={canUploadDocuments}
				/>

				{canUploadDocuments && (
					<LegalDocumentUploadDialog
						open={uploadDialogOpen}
						onOpenChange={setUploadDialogOpen}
						projectId={projectId as Id<"constructionProjects">}
					/>
				)}
			</div>
		</div>
	);
}
