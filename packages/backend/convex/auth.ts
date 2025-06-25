import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [
		Password({
			profile(params) {
				return {
					email: params.email as string,
					name: params.name as string,
					avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(params.name as string)}`,
					status: "offline" as const,
					joinedDate: new Date().toISOString(),
					teamIds: [],
					isActive: true,
					lastLogin: new Date().toISOString(),
				};
			},
		}),
	],
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			if (args.existingUserId) {
				// Update existing user in our users table
				const existingUser = await ctx.db
					.query("users")
					// @ts-expect-error
					.withIndex("by_email", (q) => q.eq("email", args.profile.email as string))
					.first();

				if (existingUser) {
					await ctx.db.patch(existingUser._id, {
						lastLogin: new Date().toISOString(),
						name: (args.profile.name as string) || existingUser.name,
					});
				}
			} else {
				// Create new user in our users table
				const email = args.profile.email as string;
				const name = (args.profile.name as string) || email;

				await ctx.db.insert("users", {
					name: name,
					email: email,
					avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
					status: "offline" as const,
					joinedDate: new Date().toISOString(),
					teamIds: [],
					isActive: true,
					lastLogin: new Date().toISOString(),
				});
			}
		},
	},
});
