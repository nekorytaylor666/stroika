import ConstructionDashboard from "@/components/common/construction/construction-dashboard";
import Header from "@/components/layout/headers/projects/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/construction-dashboard",
)({
	component: ConstructionDashboardPage,
});

function ConstructionDashboardPage() {
	return <ConstructionDashboard />;
}
