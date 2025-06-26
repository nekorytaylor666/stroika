import { LinearAllAttachments } from "@/components/attachments/linear-style/all-attachments";
import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/attachments")({
	component: AttachmentsPage,
});

function AttachmentsPage() {
	return (
		<LinearAllAttachments />
	)
}
