import {
	convexClient,
	crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

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
