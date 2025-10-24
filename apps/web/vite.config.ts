import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		tailwindcss(),
		TanStackRouterVite(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.ico", "favicon.svg", "robots.txt"],
			manifest: {
				name: "Stroika",
				short_name: "Stroika",
				description: "Construction project management platform",
				theme_color: "#ffffff",
				background_color: "#ffffff",
				display: "standalone",
				orientation: "portrait",
				scope: "/",
				start_url: "/",
				icons: [
					{
						src: "favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2}"],
				navigateFallback: null,
				navigateFallbackDenylist: [/^\/api/, /^\/$/],
				maximumFileSizeToCacheInBytes: 3000000,

				// Import custom service worker code
				importScripts: ["sw-push.js"],
				// Use NetworkFirst for API calls (Convex)
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === "navigate",
						handler: "NetworkFirst",
						options: {
							cacheName: "pages",
							plugins: [
								{
									handlerDidError: async () => {
										return caches.match("/offline.html");
									},
								},
							],
						},
					},
					{
						urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
						handler: "NetworkFirst",
						options: {
							cacheName: "convex-api",
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60, // 1 hour
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "google-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: "CacheFirst",
						options: {
							cacheName: "gstatic-fonts-cache",
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
});
