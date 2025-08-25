import { query } from "./_generated/server";

// Debug query to check users
export const listAllUsers = query({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		return {
			count: users.length,
			users: users.map((u) => ({
				id: u._id,
				email: u.email,
				name: u.name,
				isActive: u.isActive,
			})),
		};
	},
});

// Debug query to check auth accounts
export const listAuthAccounts = query({
	args: {},
	handler: async (ctx) => {
		const accounts = await ctx.db.query("authAccounts").collect();
		return {
			count: accounts.length,
			accounts: accounts.map((a) => ({
				id: a._id,
				userId: a.userId,
				provider: a.provider,
			})),
		};
	},
});
