import { SeedButton } from "@/components/admin/seed-button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/seed")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div>
			Hello <SeedButton />
		</div>
	);
}
