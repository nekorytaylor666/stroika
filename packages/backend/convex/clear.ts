import { mutation } from "./_generated/server";

export const all = mutation({
	args: {},
	handler: async (ctx) => {
		// Get all tables
		const tables = [
			"users",
			"organizations",
			"organizationMembers",
			"organizationInvites",
			"teams",
			"teamMembers",
			"constructionProjects",
			"monthlyRevenue",
			"issues",
			"issueComments",
			"issueAttachments",
			"activities",
			"status",
			"priorities",
			"labels",
			"documents",
			"documentVersions",
			"documentActivity",
			"documentAttachments",
			"documentTasks",
			"departments",
			"userDepartments",
			"organizationalPositions",
			"roles",
			"rolePermissions",
			"permissions",
			"userPermissions",
			"permissionAuditLog",
			"constructionTeams",
		];

		const deletedCounts: Record<string, number> = {};

		for (const table of tables) {
			try {
				const items = await ctx.db.query(table as any).collect();
				let count = 0;
				for (const item of items) {
					await ctx.db.delete(item._id);
					count++;
				}
				deletedCounts[table] = count;
			} catch (error) {
				console.log(`Error clearing table ${table}:`, error);
				deletedCounts[table] = 0;
			}
		}

		return {
			message: "Database cleared successfully",
			deletedCounts,
		};
	},
});
