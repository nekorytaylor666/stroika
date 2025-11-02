import { OrganizationFinancePage } from "@/components/construction/organization-finance/organization-finance-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/finance")({
	component: FinanceRoute,
});

function FinanceRoute() {
	const { orgId } = Route.useParams();

	// TODO: Add permission checking when useOrganizationPermissions is available
	// For now, we're bypassing permission checks

	return <OrganizationFinancePage organizationId={orgId} />;
}