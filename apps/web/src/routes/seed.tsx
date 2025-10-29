import { SeedButton } from "@/components/admin/seed-button";
import { Button } from "@/components/ui/button";
import { api } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { components } from "../../../../packages/backend/convex/_generated/api";

export const Route = createFileRoute("/seed")({
	component: RouteComponent,
});

function RouteComponent() {
	const createCustomRole = useMutation(api.customPermissions.createCustomRole);
	const buildAgentContext = useQuery(api.contextData.buildAgentContext);
	console.log("buildAgentContext", buildAgentContext);
	return (
		<div>
			Hello <SeedButton />
			<div>{buildAgentContext}</div>
			<Button
				onClick={() =>
					createCustomRole({
						name: "project-owner-test-2",
						displayName: "Project Owner Test",
						description: "Project Owner Test",
						permissions: JSON.stringify({
							organization: ["update", "delete"],
							member: ["create", "update", "delete"],
							invitation: ["create", "cancel"],
						}),
						scope: "organization",
						scopeId: "k171krs12kt0t1rwrka2k8gsxs7sx4j4",
					})
				}
			>
				Create Organization Role
			</Button>
		</div>
	);
}
