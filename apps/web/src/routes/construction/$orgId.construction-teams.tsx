import { createFileRoute } from "@tanstack/react-router";
import ConstructionTeams from "@/components/common/construction/construction-teams";
import Header from "@/components/layout/headers/teams/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/construction/$orgId/construction-teams")({
    component: ConstructionTeamsPage,
});

function ConstructionTeamsPage() {
    return (
        <MainLayout header={<Header />}>
            <ConstructionTeams />
        </MainLayout>
    );
} 