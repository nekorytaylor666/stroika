import { createFileRoute } from "@tanstack/react-router";
import { ConstructionProjectOverview } from "@/components/construction/project-overview";
import type { Id } from "@stroika/backend";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/header";

export const Route = createFileRoute("/construction/$orgId/projects/$projectId/overview")({
  component: ConstructionProjectOverviewPage,
});

function ConstructionProjectOverviewPage() {
  const { projectId } = Route.useParams();

  // Convert the string projectId to Convex Id type
  const convexProjectId = projectId as Id<"constructionProjects">;

  return (
    <ConstructionProjectOverview projectId={convexProjectId} />
  );
}