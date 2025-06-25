import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/headers/projects/header";
import Projects from "@/components/common/projects/projects";

export const Route = createFileRoute("/$orgId/projects")({
    component: ProjectsPage,
});

function ProjectsPage() {
    return (
        <MainLayout header={<Header />}>
            <Projects />
        </MainLayout>
    );
} 