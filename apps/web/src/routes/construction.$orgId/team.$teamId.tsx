import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/team/$teamId")({
	component: TeamLayout,
});

function TeamLayout() {
	return <Outlet />;
}
