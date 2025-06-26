import Members from "@/components/common/members/members";
import Header from "@/components/layout/headers/members/header";
import MainLayout from "@/components/layout/main-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/members")({
	component: MembersPage,
});

function MembersPage() {
	return <Members />;
}
