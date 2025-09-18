import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

// Use Convex deployment URL with /auth path
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://artful-flamingo-918.convex.cloud";
const baseURL = `${convexUrl}/auth`;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  },
  plugins: [
    convexClient(),
    crossDomainClient(),
  ],
});