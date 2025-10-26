import { ProjectTeamManagementLinear } from "@/components/construction/project-team-management-linear";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectPermissions } from "@/hooks/use-permissions";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/team",
)({
	component: ProjectTeamPage,
});

function ProjectTeamPage() {
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

	// Check if user can view team members
	if (!permissions.canReadMembers) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к команде этого проекта. Обратитесь к
							администратору проекта для получения необходимых разрешений.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="mx-auto flex h-full w-full max-w-7xl flex-col p-4">
				<ProjectTeamManagementLinear
					projectId={projectId as Id<"constructionProjects">}
				/>
			</div>
		</div>
	);
}
