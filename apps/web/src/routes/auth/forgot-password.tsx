import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
