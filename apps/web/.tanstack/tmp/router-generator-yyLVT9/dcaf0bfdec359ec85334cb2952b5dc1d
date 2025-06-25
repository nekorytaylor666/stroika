import { createFileRoute } from "@tanstack/react-router";
import ConstructionDashboard from "@/components/common/construction/construction-dashboard";
import Header from "@/components/layout/headers/projects/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/construction/$orgId/construction-dashboard")({
    component: ConstructionDashboardPage,
});

function ConstructionDashboardPage() {
    return (
        <MainLayout header={<Header />}>
            <ConstructionDashboard />
        </MainLayout>
    );
} 