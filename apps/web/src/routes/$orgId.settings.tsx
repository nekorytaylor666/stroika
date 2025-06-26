import { OrganizationSettings } from "@/components/settings/organization-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$orgId/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { orgId } = Route.useParams();
	return <OrganizationSettings organizationId={orgId} />;
}
