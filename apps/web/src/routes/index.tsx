import { authClient } from "@/lib/auth-client";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "@stroika/backend";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const session = authClient.useSession();
	const navigate = useNavigate();
	useEffect(() => {
		const navigateToOrganization = async () => {
			const { data: organizations, error } =
				await authClient.organization.list();
			if (error) {
				console.error("Error getting organizations:", error);
				return;
			}
			if (organizations.length === 0) {
				navigate({ to: "/auth/organization-setup" });
				return;
			}
			navigate({
				to: "/construction/$orgId/inbox",
				params: { orgId: organizations[0].id },
			});
		};
		if (!session) {
			return;
		}

		navigateToOrganization();
	}, [navigate, session]);

	return <div>Hello "/"!</div>;
}
