import { ConstructionTeamsLinear } from "@/components/construction/teams/construction-teams-linear";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/construction-teams")(
	{
		component: ConstructionTeamsPage,
	},
);

function ConstructionTeamsPage() {
	const { orgId } = Route.useParams();
	return <ConstructionTeamsLinear orgId={orgId} />;
}
