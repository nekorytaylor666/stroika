import { LinearActivityFeed } from "@/components/common/activity/linear-activity-feed";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProjectPermissions } from "@/hooks/use-permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Lock } from "lucide-react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/activity",
)({
	component: ProjectActivityPage,
});

function ProjectActivityPage() {
	const { projectId } = Route.useParams();

	// Check permissions
	const permissions = useProjectPermissions(projectId);

	// Loading state
	if (!permissions) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view activities
	if (!permissions.canReadActivities) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к активности этого проекта. Обратитесь к
							администратору проекта для получения необходимых разрешений.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="flex items-center gap-3 px-8 py-6">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Activity className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="font-semibold text-2xl">Активность проекта</h1>
						<p className="text-muted-foreground text-sm">
							История изменений и событий в проекте
						</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-8 py-6">
					<LinearActivityFeed type="project" projectId={projectId as any} />
				</div>
			</div>
		</div>
	);
}
