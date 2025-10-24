import { ConstructionCalendar } from "@/components/construction/construction-calendar";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/use-permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/calendar")({
	component: ConstructionCalendarPage,
});

function ConstructionCalendarPage() {
	const permissions = usePermissions();

	// Loading state
	if (permissions.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view calendar using colon notation
	const canViewCalendar =
		permissions.hasPermission("calendar:read") ||
		permissions.hasPermission("calendar:manage") ||
		permissions.hasPermission("projects:read") ||
		permissions.hasPermission("projects:manage") ||
		permissions.hasPermission("constructionProjects:read") ||
		permissions.hasPermission("constructionProjects:manage") ||
		permissions.isOwner;

	if (!canViewCalendar) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к календарю строительства. Необходимо разрешение
							"calendar:read" или "projects:read".
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <ConstructionCalendar />;
}
