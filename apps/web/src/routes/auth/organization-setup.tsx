import { OrganizationSetup } from "@/components/auth/organization-setup";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/organization-setup")({
	component: OrganizationSetup,
});