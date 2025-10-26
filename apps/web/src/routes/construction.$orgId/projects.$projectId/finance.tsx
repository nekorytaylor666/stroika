import { ProjectFinancePage } from "@/components/construction/project-finance/project-finance-page";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectPermissions } from "@/hooks/use-permissions";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/finance",
)({
	component: FinanceRoute,
});

function FinanceRoute() {
	const { projectId } = Route.useParams();

	// Convert string ID to typed ID
	const typedProjectId = projectId as Id<"constructionProjects">;

	// Use project permissions hook
	const permissions = useProjectPermissions(projectId);

	// Verify the project exists
	const project = useQuery(api.constructionProjects.getById, {
		id: typedProjectId,
	});

	// Loading state
	if (!permissions || !project) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view finance data (analytics permission covers finance)
	if (!permissions.canReadAnalytics) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет разрешения на просмотр финансовой информации. Необходимо
							разрешение на просмотр аналитики проекта.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <ProjectFinancePage projectId={typedProjectId} />;
}
