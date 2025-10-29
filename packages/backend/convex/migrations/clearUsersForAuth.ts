import { internalMutation, mutation } from "../_generated/server";

export const backupAndClearUsers = mutation({
	async handler(ctx) {
		console.log(
			"Backing up existing users and clearing table for Convex Auth...",
		);

		// Get all existing users
		const users = await ctx.db.query("users").collect();
		console.log(`Found ${users.length} users to backup`);

		// Store backup data in a temp table or log it
		for (const user of users) {
			console.log(`Backing up user: ${JSON.stringify(user)}`);
		}

		// Clear all users
		for (const user of users) {
			await ctx.db.delete(user._id);
		}

		console.log(
			"Users table cleared. You can now use Convex Auth OTP authentication.",
		);
		console.log(
			"Note: You'll need to recreate user accounts through the new OTP flow.",
		);

		return {
			message: "Users table cleared successfully",
			backedUpUsers: users.length,
		};
	},
});
