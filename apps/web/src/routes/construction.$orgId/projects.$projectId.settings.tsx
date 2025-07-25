import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/settings",
)({
	component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
	const { projectId } = Route.useParams();

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center gap-3">
				<Settings className="h-8 w-8 text-muted-foreground" />
				<h1 className="font-semibold text-2xl">Настройки проекта</h1>
			</div>
			<Card className="p-6">
				<p className="text-muted-foreground">
					Страница настроек проекта {projectId} находится в разработке.
				</p>
			</Card>
		</div>
	);
}
