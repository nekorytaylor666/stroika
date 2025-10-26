import { LinearAllAttachments } from "@/components/attachments/linear-style/all-attachments";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectPermissions } from "@/hooks/use-permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/attachments",
)({
	component: ProjectAttachmentsPage,
});

function ProjectAttachmentsPage() {
	const { projectId } = Route.useParams();

	// Check permissions
	const permissions = useProjectPermissions(projectId);

	// Loading state
	if (!permissions) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view attachments
	if (!permissions.canReadAttachments) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к вложениям этого проекта. Обратитесь к
							администратору проекта для получения необходимых разрешений.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <LinearAllAttachments projectId={projectId} />;
}
