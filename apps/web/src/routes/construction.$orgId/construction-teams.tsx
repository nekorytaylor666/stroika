import { ConstructionTeamsLinear } from "@/components/construction/teams/construction-teams-linear";
import Loader from "@/components/loader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/use-permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/construction/$orgId/construction-teams")(
	{
		component: ConstructionTeamsPage,
	},
);

function ConstructionTeamsPage() {
	const { orgId } = Route.useParams();
	const permissions = usePermissions();

	// Loading state
	if (permissions.isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can view teams using colon notation
	const canViewTeams =
		permissions.hasPermission("teams:read") ||
		permissions.hasPermission("teams:manage") ||
		permissions.hasPermission("constructionTeams:read") ||
		permissions.hasPermission("constructionTeams:manage") ||
		permissions.isOwner;

	if (!canViewTeams) {
		return (
			<div className="h-full overflow-auto bg-background">
				<div className="mx-auto max-w-7xl p-6">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к строительным командам. Необходимо разрешение
							"teams:read" или "constructionTeams:read".
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return <ConstructionTeamsLinear orgId={orgId} />;
}
