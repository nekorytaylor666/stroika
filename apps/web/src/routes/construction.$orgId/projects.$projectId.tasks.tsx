import ConstructionTasks from "@/components/common/construction/construction-tasks";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/tasks",
)({
	component: ProjectTasksPage,
});

function ProjectTasksPage() {
	const { projectId } = Route.useParams();

	// Convert the string projectId to Convex Id type
	const convexProjectId = projectId as Id<"constructionProjects">;

	return <ConstructionTasks />;
}
