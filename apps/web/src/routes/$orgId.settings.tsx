import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/layout/main-layout";
import Settings from "@/components/common/settings/settings";
import Header from "@/components/layout/headers/settings/header";

export const Route = createFileRoute("/$orgId/settings")({
    component: SettingsPage,
});

function SettingsPage() {
    return (
        <MainLayout header={<Header />} headersNumber={1}>
            <Settings />
        </MainLayout>
    );
} 