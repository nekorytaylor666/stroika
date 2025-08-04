import { ProjectNavigation } from "@/components/construction/project-navigation";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId",
)({
	component: ProjectLayout,
});

function ProjectLayout() {
	return (
		<div className="flex h-full flex-col">
			<ProjectNavigation />
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}
