import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/reset-password")({
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch<{ token?: string }>();

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<h2 className="mb-2 font-bold text-2xl">Недействительная ссылка</h2>
					<p className="text-muted-foreground">
						Ссылка для сброса пароля недействительна или устарела.
					</p>
				</div>
			</div>
		);
	}

	return <ResetPasswordForm token={token} />;
}
