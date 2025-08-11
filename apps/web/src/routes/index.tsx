import { convexQuery } from "@convex-dev/react-query";
import { api } from "@stroika/backend";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: RouteComponent,

	loader: async ({ context }) => {
		if (!context.queryClient) {
			return redirect({
				to: "/auth",
			});
		}
		const user = await context.queryClient.fetchQuery(
			convexQuery(api.users.viewer, {}),
		);

		if (!user) {
			return redirect({
				to: "/auth",
			});
		}
		console.log("user", user);
		const organizations = await context.queryClient.fetchQuery(
			convexQuery(api.organizations.getUserOrganizations, {}),
		);
		if (!organizations) {
			return redirect({
				to: "/auth",
			});
		}
		console.log("organizations", organizations);

		// If user has no organizations, redirect to auth or a setup page
		if (!organizations || organizations.length === 0) {
			// You could redirect to an onboarding page or auth page
			return redirect({
				to: "/auth",
			});
		}

		return redirect({
			to: "/construction/$orgId/inbox",
			params: {
				orgId: organizations[0]._id,
			},
		});
	},
});

function RouteComponent() {
	return <div>Hello "/"!</div>;
}
