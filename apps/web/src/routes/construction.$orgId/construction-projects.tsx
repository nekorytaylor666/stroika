import ConstructionProjects from "@/components/common/construction/construction-projects";
import Header from "@/components/layout/headers/projects/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/construction/$orgId/construction-projects",
)({
	component: ConstructionProjectsPage,
});

function ConstructionProjectsPage() {
	return <ConstructionProjects />;
}
