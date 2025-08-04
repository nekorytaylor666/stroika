import { query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

// List all departments for the current organization
export const list = query({
	handler: async (ctx) => {
		try {
			const { organization } = await getCurrentUserWithOrganization(ctx);

			const departments = await ctx.db
				.query("departments")
				.withIndex("by_organization", (q) =>
					q.eq("organizationId", organization._id),
				)
				.filter((q) => q.eq(q.field("isActive"), true))
				.collect();

			// Sort by level and name
			departments.sort((a, b) => {
				if (a.level !== b.level) {
					return a.level - b.level;
				}
				return a.displayName.localeCompare(b.displayName);
			});

			return departments;
		} catch (error) {
			// Return empty array if user has no organization
			return [];
		}
	},
});
