import { mutation } from "../_generated/server";

export const migrateUsersToRoleId = mutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").collect();
		let migrated = 0;

		for (const user of users) {
			// Check if user has old 'role' field
			if ("role" in user && !user.roleId) {
				// Remove the role field by creating a clean update object
				const { role, ...cleanUser } = user as any;

				// Update the user without the role field
				await ctx.db.replace(user._id, {
					...cleanUser,
					isActive: cleanUser.isActive ?? true,
				});

				migrated++;
			}
		}

		return {
			message: `Migration completed. Migrated ${migrated} users.`,
			totalUsers: users.length,
			migrated,
		};
	},
});
