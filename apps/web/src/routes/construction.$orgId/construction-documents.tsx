import { ConstructionDocuments } from "@/components/common/construction/construction-documents";
import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/construction-documents",
)({
	component: ConstructionDocumentsPage,
});

function ConstructionDocumentsPage() {
	return <ConstructionDocuments />;
}
