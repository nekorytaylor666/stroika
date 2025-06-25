import { createFileRoute } from "@tanstack/react-router";
import Members from "@/components/common/members/members";
import Header from "@/components/layout/headers/members/header";
import MainLayout from "@/components/layout/main-layout";

export const Route = createFileRoute("/$orgId/members")({
    component: MembersPage,
});

function MembersPage() {
    return (
        <MainLayout header={<Header />}>
            <Members />
        </MainLayout>
    );
} 