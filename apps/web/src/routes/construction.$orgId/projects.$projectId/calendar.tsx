import { ConstructionProjectCalendar } from "@/components/construction/project-calendar";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/calendar",
)({
	component: ConstructionProjectCalendarPage,
});

function ConstructionProjectCalendarPage() {
	const { projectId } = Route.useParams();
	const convexProjectId = projectId as Id<"constructionProjects">;

	return <ConstructionProjectCalendar projectId={convexProjectId} />;
}
