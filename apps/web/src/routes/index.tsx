import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({
			to: "/construction/$orgId",
			params: { orgId: "lndev-ui" },
		});
	},
});
