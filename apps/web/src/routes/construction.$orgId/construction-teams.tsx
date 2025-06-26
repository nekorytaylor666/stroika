import ConstructionTeams from "@/components/common/construction/construction-teams";
import Header from "@/components/layout/headers/teams/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/construction-teams")(
	{
		component: ConstructionTeamsPage,
	},
);

function ConstructionTeamsPage() {
	return (
		<ConstructionTeams />
	)
}
