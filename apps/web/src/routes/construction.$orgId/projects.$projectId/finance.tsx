import { ProjectFinancePage } from "@/components/construction/project-finance/project-finance-page";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/finance",
)({
	component: FinanceRoute,
});

function FinanceRoute() {
	const { projectId } = Route.useParams();

	// Convert string ID to typed ID
	const typedProjectId = projectId as Id<"constructionProjects">;

	// Verify the project exists
	const project = useQuery(api.constructionProjects.getById, {
		id: typedProjectId,
	});

	if (!project) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-muted-foreground">Загрузка...</div>
			</div>
		);
	}

	return <ProjectFinancePage projectId={typedProjectId} />;
}
