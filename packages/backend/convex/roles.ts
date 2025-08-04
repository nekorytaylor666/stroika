import { v } from "convex/values";
import { query } from "./_generated/server";

// List all roles
export const list = query({
	args: {},
	handler: async (ctx) => {
		const roles = await ctx.db.query("roles").collect();

		// Sort roles by their typical hierarchy
		const roleOrder = [
			"owner",
			"ceo",
			"chief_engineer",
			"department_head",
			"project_manager",
			"engineer",
			"viewer",
		];

		return roles.sort((a, b) => {
			const aIndex = roleOrder.indexOf(a.name);
			const bIndex = roleOrder.indexOf(b.name);

			// If both are in the order list, sort by that order
			if (aIndex !== -1 && bIndex !== -1) {
				return aIndex - bIndex;
			}

			// If only one is in the order list, it comes first
			if (aIndex !== -1) return -1;
			if (bIndex !== -1) return 1;

			// Otherwise, sort alphabetically by name
			return a.name.localeCompare(b.name);
		});
	},
});

// Get a specific role by ID
export const get = query({
	args: { roleId: v.id("roles") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.roleId);
	},
});

// Get role by name
export const getByName = query({
	args: { name: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("roles")
			.filter((q) => q.eq(q.field("name"), args.name))
			.first();
	},
});
