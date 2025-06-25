import { createFileRoute } from "@tanstack/react-router";
import ConstructionTasks from "@/components/common/construction/construction-tasks";
import Header from "@/components/layout/headers/issues/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/construction/$orgId/construction-tasks")({
    component: ConstructionTasksPage,
});

function ConstructionTasksPage() {
    return (
        <MainLayout header={<Header />}>
            <ConstructionTasks />
        </MainLayout>
    );
} 