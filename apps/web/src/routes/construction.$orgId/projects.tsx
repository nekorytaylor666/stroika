import Projects from "@/components/common/projects/projects";
import Header from "@/components/layout/headers/projects/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/projects")({
	component: ProjectsPage,
});

function ProjectsPage() {
	return (
		<MainLayout header={<Header />}>
			<Projects />
		</MainLayout>
	);
}
