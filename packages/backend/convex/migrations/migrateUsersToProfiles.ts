import { internalMutation } from "../_generated/server";

export const migrateUsersToProfiles = internalMutation({
	async handler(ctx) {
		console.log("Starting migration of users to userProfiles...");

		// Get all existing users
		const users = await ctx.db.query("users").collect();
		console.log(`Found ${users.length} users to migrate`);

		for (const user of users) {
			// Create a new auth user entry (minimal)
			const authUserId = await ctx.db.insert("users", {
				email: user.email,
				name: user.name,
				image: user.avatarUrl,
			});

			// Create corresponding userProfile
			await ctx.db.insert("userProfiles", {
				userId: authUserId,
				phone: user.phone,
				status: user.status,
				roleId: user.roleId,
				joinedDate: user.joinedDate,
				teamIds: user.teamIds,
				position: user.position,
				workload: user.workload,
				currentOrganizationId: user.currentOrganizationId,
				authId: user.authId,
				tokenIdentifier: user.tokenIdentifier,
				isActive: user.isActive,
				lastLogin: user.lastLogin,
			});

			console.log(`Migrated user: ${user.email}`);
		}

		console.log("Migration completed successfully!");
	},
});