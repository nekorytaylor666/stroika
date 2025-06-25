import { createFileRoute } from "@tanstack/react-router";
import Teams from "@/components/common/teams/teams";
import Header from "@/components/layout/headers/teams/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/$orgId/teams")({
    component: TeamsPage,
});

function TeamsPage() {
    return (
        <MainLayout header={<Header />}>
            <Teams />
        </MainLayout>
    );
} 