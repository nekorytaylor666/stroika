import { authClient } from "@/lib/auth-client";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@stroika/backend";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data, error, isPending } = authClient.useListOrganizations();
	const session = authClient.useSession();
	const navigate = useNavigate();
	useEffect(() => {
		if (!session) {
			return;
		}
		if (data && !isPending) {
			console.log("data", data);
			navigate({
				to: "/construction/$orgId/inbox",
				params: { orgId: data[0].id },
			});
		}
	}, [data, isPending, navigate, session]);
	if (isPending) {
		return <div>Loading...</div>;
	}
	if (error) {
		return <div>Error: {error.message}</div>;
	}
	return <div>Hello "/"!</div>;
}
