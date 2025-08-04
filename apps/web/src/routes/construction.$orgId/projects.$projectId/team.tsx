import { ProjectTeamManagementLinear } from "@/components/construction/project-team-management-linear";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/team",
)({
	component: ProjectTeamPage,
});

function ProjectTeamPage() {
	const { projectId } = Route.useParams();

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
