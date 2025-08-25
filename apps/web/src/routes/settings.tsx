import { SettingsLayout } from "@/components/settings/settings-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	return <SettingsLayout />;
}
