import { LinearActivityFeed } from "@/components/common/activity/linear-activity-feed";
import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/activity")({
	component: ActivityPage,
});

function ActivityPage() {
	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b">
				<div className="flex items-center gap-3 px-8 py-6">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
						<Activity className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="font-semibold text-2xl">Активность организации</h1>
						<p className="text-muted-foreground text-sm">
							Все события и изменения в задачах
						</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-8 py-6">
					<LinearActivityFeed type="organization" />
				</div>
			</div>
		</div>
	);
}
