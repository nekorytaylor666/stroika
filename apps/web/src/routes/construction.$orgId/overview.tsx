import { ConstructionOrganizationOverview } from "@/components/construction/construction-organization-overview";
import Loader from "@/components/loader";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/overview")({
	component: ConstructionOrganizationOverviewPage,
});

function ConstructionOrganizationOverviewPage() {
	return <ConstructionOrganizationOverview />;
}