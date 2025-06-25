import { AuthForm } from "@/components/auth/auth-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
	component: AuthForm,
});
