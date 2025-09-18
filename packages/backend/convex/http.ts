import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { betterAuth } from "better-auth";
import { convexAdapter } from "@convex-dev/better-auth";

const http = httpRouter();

// Create Better Auth instance
http.route({
  path: "/auth/*",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = betterAuth({
      database: convexAdapter(ctx),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
    });
    
    return await auth.handler(request);
  }),
});

http.route({
  path: "/auth/*",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = betterAuth({
      database: convexAdapter(ctx),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
    });
    
    return await auth.handler(request);
  }),
});

export default http;