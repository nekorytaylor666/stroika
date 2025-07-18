import { ConstructionActivityFeed } from "@/components/common/construction/construction-activity-feed";
import ConstructionHeader from "@/components/layout/headers/construction/construction-header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/construction-tasks")(
	{
		component: ConstructionTasksPage,
	},
);

function ConstructionTasksPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			<div className="mb-6">
				<h1 className="font-bold text-2xl">
					Активность по строительным задачам
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Все события и прогресс по задачам строительства
				</p>
			</div>

			<ConstructionActivityFeed limit={100} />
		</div>
	);
}
