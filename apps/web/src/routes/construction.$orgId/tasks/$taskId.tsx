import { ConstructionTaskDetailsPage } from "@/components/common/construction/construction-task-details-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/tasks/$taskId")({
	component: TaskDetailsPage,
});

function TaskDetailsPage() {
	const { taskId, orgId } = Route.useParams();
	
	return (
		<div className="flex h-full bg-background">
			<ConstructionTaskDetailsPage taskId={taskId} orgId={orgId} />
		</div>
	);
}