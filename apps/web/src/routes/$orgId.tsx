import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$orgId")({
	component: OrgLayout,
});

function OrgLayout() {
	return <Outlet />;
}
