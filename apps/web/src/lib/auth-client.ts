import { createAuthClient } from "better-auth/react";
import {
	convexClient,
	crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
	plugins: [
		convexClient(),
		organizationClient({
			teams: {
				enabled: true,
			},
		}),
		adminClient(),
		crossDomainClient(),
	],
	fetchOptions: {
		credentials: "include",
	},
});
