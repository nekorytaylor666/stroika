import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { LegalDocumentUploadDialog } from "./legal-document-upload-dialog";

interface LegalDocumentsSidebarProps {
	projectId: Id<"constructionProjects">;
}

const documentTypeLabels: Record<string, string> = {
	contract: "Договор",
	invoice: "Счет",
	receipt: "Квитанция",
	permit: "Разрешение",
	certificate: "Сертификат",
	report: "Отчет",
	protocol: "Протокол",
	other: "Другое",
};

const statusColors: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	pending_review: "bg-yellow-100 text-yellow-700",
	approved: "bg-green-100 text-green-700",
	rejected: "bg-red-100 text-red-700",
	expired: "bg-orange-100 text-orange-700",
};

export function LegalDocumentsSidebar({
	projectId,
}: LegalDocumentsSidebarProps) {
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const documents = useQuery(api.projectLegalDocuments.getProjectDocuments, {
		constructionProjectId: projectId,
	});

	// Get recent documents (last 5)
	const recentDocuments = documents?.slice(0, 5) || [];

	if (documents === undefined) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="font-medium text-sm">Документы</h3>
					<Skeleton className="h-8 w-8" />
				</div>
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-14" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">Документы</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={() => setUploadDialogOpen(true)}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>

			{recentDocuments.length === 0 ? (
				<Card className="p-4">
					<div className="flex flex-col items-center justify-center text-center">
						<FileText className="mb-2 h-8 w-8 text-muted-foreground" />
						<p className="text-muted-foreground text-xs">Нет документов</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => setUploadDialogOpen(true)}
						>
							<Upload className="mr-1.5 h-3 w-3" />
							Загрузить
						</Button>
					</div>
				</Card>
			) : (
				<div className="space-y-2">
					{recentDocuments.map((doc) => (
						<Card
							key={doc._id}
							className="cursor-pointer p-3 transition-colors hover:bg-muted/50"
							onClick={() => window.open(doc.fileUrl, "_blank")}
						>
							<div className="space-y-1.5">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-xs">
											{doc.title || doc.fileName}
										</p>
										<p className="text-muted-foreground text-xs">
											{documentTypeLabels[doc.documentType]}
										</p>
									</div>
									<Badge
										className={cn(
											"flex-shrink-0 text-xs",
											statusColors[doc.status],
										)}
										variant="secondary"
									>
										{doc.status === "approved" && "✓"}
										{doc.status === "pending_review" && "⏳"}
										{doc.status === "rejected" && "✗"}
										{doc.status === "draft" && "📝"}
										{doc.status === "expired" && "⚠"}
									</Badge>
								</div>
								<p className="text-muted-foreground text-xs">
									{format(new Date(doc.uploadedAt), "d MMM", { locale: ru })}
								</p>
							</div>
						</Card>
					))}

					{documents.length > 5 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-8 w-full"
							onClick={() => {
								// Navigate to legal documents page
								const params = window.location.pathname.split("/");
								const orgId = params[2];
								window.location.href = `/construction/${orgId}/projects/${projectId}/legal-documents`;
							}}
						>
							Показать все ({documents.length})
						</Button>
					)}
				</div>
			)}

			<LegalDocumentUploadDialog
				open={uploadDialogOpen}
				onOpenChange={setUploadDialogOpen}
				projectId={projectId}
			/>
		</div>
	);
}

// Helper function
function cn(...classes: (string | undefined | false)[]) {
	return classes.filter(Boolean).join(" ");
}
