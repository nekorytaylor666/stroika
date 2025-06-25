import { ConstructionDocuments } from "@/components/common/construction/construction-documents";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/construction-documents",
)({
	component: ConstructionDocumentsPage,
});

function ConstructionDocumentsPage() {
	return <ConstructionDocuments />;
}
