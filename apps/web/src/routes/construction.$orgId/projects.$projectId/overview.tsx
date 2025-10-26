import { ConstructionProjectOverview } from "@/components/construction/construction-project-overview";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectPermissions } from "@/hooks/use-permissions";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/overview",
)({
	component: ConstructionProjectOverviewPage,
});

function ConstructionProjectOverviewPage() {
	const { projectId } = Route.useParams();

	// Convert the string projectId to Convex Id type
	const convexProjectId = projectId as Id<"constructionProjects">;

	// Use the project permissions hook
	const permissions = useProjectPermissions(projectId);

	// Loading state
	if (!permissions) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can manage the project
	if (!permissions.canManageProject) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к обзору проекта. Только пользователи с правами
							управления проектом могут просматривать эту вкладку.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <ConstructionProjectOverview projectId={convexProjectId} />;
}
