import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <h1>hi</h1>;
}
