import { query } from "./_generated/server";

export const checkAuth = query({
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();

		return {
			hasIdentity: !!identity,
			identityKeys: identity ? Object.keys(identity) : [],
			identityData: identity
				? {
						// Just spread all properties
						...identity,
					}
				: null,
		};
	},
});
