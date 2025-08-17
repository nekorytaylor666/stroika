import { ConstructionProjectOverview } from "@/components/construction/construction-project-overview";
import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/overview",
)({
	component: ConstructionProjectOverviewPage,
});

function ConstructionProjectOverviewPage() {
	const { projectId } = Route.useParams();

	// Convert the string projectId to Convex Id type
	const convexProjectId = projectId as Id<"constructionProjects">;

	return <ConstructionProjectOverview projectId={convexProjectId} />;
}
