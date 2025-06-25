import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const cleanupUsers = mutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		let cleaned = 0;

		for (const user of users) {
			const userAny = user as any;

			// Check if user has old 'role' field or missing required fields
			if ("role" in userAny || !("isActive" in userAny)) {
				// Create a clean user object with only valid fields
				const cleanUser = {
					name: user.name,
					email: user.email,
					avatarUrl: user.avatarUrl,
					status: user.status,
					roleId: user.roleId || undefined,
					joinedDate: user.joinedDate,
					teamIds: user.teamIds,
					position: user.position || undefined,
					workload: user.workload || undefined,
					authId: userAny.authId || undefined,
					isActive: userAny.isActive ?? true,
					lastLogin: userAny.lastLogin || undefined,
				};

				// Delete the old document
				await ctx.db.delete(user._id);

				// Insert clean document
				await ctx.db.insert("users", cleanUser);

				cleaned++;
			}
		}

		return {
			message: `Cleanup completed. Cleaned ${cleaned} users.`,
			totalUsers: users.length,
			cleaned,
		};
	},
});
