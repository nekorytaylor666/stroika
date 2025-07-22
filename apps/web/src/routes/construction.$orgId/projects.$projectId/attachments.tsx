import { LinearAllAttachments } from "@/components/attachments/linear-style/all-attachments";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/attachments",
)({
	component: ProjectAttachmentsPage,
});

function ProjectAttachmentsPage() {
	const { projectId } = Route.useParams();
	return <LinearAllAttachments projectId={projectId} />;
}
