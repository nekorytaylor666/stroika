import { AuthGuard } from "@/components/auth/auth-guard";
import ConstructionHeader from "@/components/layout/headers/construction/construction-header";
import MainLayout from "@/components/layout/main-layout";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/construction/$orgId")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<AuthGuard>
			<MainLayout headersNumber={1}>
				<Outlet />
			</MainLayout>
		</AuthGuard>
	);
}
