export default {
  providers: [
    {
      // @ts-expect-error
      domain: process.env.CONVEX_SITE_URL || "http://localhost:3000",
      applicationID: "convex",
    },
  ],
};
