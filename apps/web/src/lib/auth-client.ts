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
		organizationClient(),
		adminClient(),
		crossDomainClient(),

		// crossDomainClient() - Temporarily removed due to version compatibility issues
		// between @convex-dev/better-auth (uses better-auth@1.3.13) and better-auth@1.3.27
		// The backend still has crossDomain plugin enabled for CORS handling
	],
	fetchOptions: {
		credentials: "include",
	},
});
