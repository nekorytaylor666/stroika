import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export interface RouterAppContext {
	queryClient: QueryClient;
}

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<Outlet />
			<Toaster richColors />
		</ThemeProvider>
	);
}
