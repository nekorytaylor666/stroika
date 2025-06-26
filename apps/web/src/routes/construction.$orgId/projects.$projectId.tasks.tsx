import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import ProjectTasks from "@/components/construction/project-tasks";
import type { Id } from "@stroika/backend";
import ConstructionTasks from "@/components/common/construction/construction-tasks";

export const Route = createFileRoute("/construction/$orgId/projects/$projectId/tasks")({
  component: ProjectTasksPage,
});

function ProjectTasksPage() {
  const { projectId } = Route.useParams();

  // Convert the string projectId to Convex Id type
  const convexProjectId = projectId as Id<"constructionProjects">;

  return (
    <ConstructionTasks />
  );
}