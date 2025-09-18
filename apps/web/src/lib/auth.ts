import { convexAdapter } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { requireEnv } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import type { GenericCtx } from "@stroika/backend/convex/_generated/server";

const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:3001";

export const createAuth = (ctx: GenericCtx) =>
  // Configure your Better Auth instance here
  betterAuth({
    trustedOrigins: [siteUrl],
    database: convexAdapter(ctx, betterAuthComponent),

    // Simple non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    
    plugins: [
      // The Convex plugin is required
      convex(),

      // The cross domain plugin is required for client side frameworks
      crossDomain({
        siteUrl,
      }),
    ],
  });