import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/projects/$projectId/tasks")({
  component: ProjectTasksPage,
});

function ProjectTasksPage() {
  const { projectId } = Route.useParams();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-8 w-8 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Задачи проекта</h1>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">
          Страница задач проекта {projectId} находится в разработке.
        </p>
      </Card>
    </div>
  );
}