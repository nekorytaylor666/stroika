import ConstructionProjects from "@/components/common/construction/construction-projects";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/use-permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/construction-projects",
)({
	component: ConstructionProjectsPage,
});

function ConstructionProjectsPage() {
	const permissions = usePermissions();

	// Loading state
	if (permissions.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view construction projects using colon notation
	const canViewProjects =
		permissions.hasPermission("projects:read") ||
		permissions.hasPermission("projects:manage") ||
		permissions.hasPermission("constructionProjects:read") ||
		permissions.hasPermission("constructionProjects:manage") ||
		permissions.isOwner;

	if (!canViewProjects) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к строительным проектам. Необходимо разрешение
							"projects:read" или "constructionProjects:read".
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <ConstructionProjects />;
}
