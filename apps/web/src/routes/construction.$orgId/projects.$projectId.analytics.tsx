import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/analytics",
)({
	component: ProjectAnalyticsPage,
});

function ProjectAnalyticsPage() {
	const { projectId } = Route.useParams();

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-3">
				<BarChart3 className="h-8 w-8 text-muted-foreground" />
				<h1 className="font-semibold text-2xl">Аналитика проекта</h1>
			</div>
			<Card className="p-6">
				<p className="text-muted-foreground">
					Страница аналитики проекта {projectId} находится в разработке.
				</p>
			</Card>
		</div>
	);
}
