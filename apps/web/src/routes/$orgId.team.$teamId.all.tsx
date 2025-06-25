import { createFileRoute } from "@tanstack/react-router";
import AllIssues from "@/components/common/issues/all-issues";
import Header from "@/components/layout/headers/issues/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/$orgId/team/$teamId/all")({
    component: AllIssuesPage,
});

function AllIssuesPage() {
    return (
        <MainLayout header={<Header />}>
            <AllIssues />
        </MainLayout>
    );
} 