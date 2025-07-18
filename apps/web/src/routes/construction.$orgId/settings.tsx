import Header from "@/components/header";
import MainLayout from "@/components/layout/main-layout";
import { OrganizationSettings } from "@/components/settings/organization-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const { orgId } = Route.useParams();

	return <OrganizationSettings organizationId={orgId} />;
}
