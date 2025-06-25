import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({
			to: "/$orgId/team/$teamId/all",
			params: { orgId: "lndev-ui", teamId: "CORE" },
		});
	},
});
