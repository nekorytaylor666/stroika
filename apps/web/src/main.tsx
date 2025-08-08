import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import {
	PWAUpdatePrompt,
	usePWAInstall,
} from "./components/ui/pwa-update-prompt";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { createRouter } from "./router";

// Create a new router instance
const router = createRouter();

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Create a client
const queryClient = new QueryClient();

// Root component with PWA features
function App() {
	// Enable PWA install prompt
	usePWAInstall();

	// Update theme color meta tag based on current theme
	React.useEffect(() => {
		const updateThemeColor = () => {
			const isDark = document.documentElement.classList.contains("dark");
			const themeColorMeta = document.querySelector(
				'meta[name="theme-color"]:not([media])',
			);
			if (themeColorMeta) {
				themeColorMeta.setAttribute("content", isDark ? "#101011" : "#ffffff");
			}
		};

		updateThemeColor();

		// Watch for theme changes
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					updateThemeColor();
				}
			});
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			<PWAUpdatePrompt />
		</QueryClientProvider>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
