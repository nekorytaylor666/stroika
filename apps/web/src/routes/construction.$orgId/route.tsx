import { AuthGuard } from "@/components/auth/auth-guard";
import MainLayout from "@/components/layout/main-layout";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<MainLayout>
			<AuthGuard>
				<Outlet />
			</AuthGuard>
		</MainLayout>
	);
}
