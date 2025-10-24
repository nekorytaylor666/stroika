import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { doc } from "convex-helpers/validators";
import schema from "./schema";

export const listUsers = query({
	args: {
		ids: v.array(v.id("user")),
	},
	returns: v.array(doc(schema, "user")),

	handler: async (ctx, args) => {
		// If no IDs are provided, return an empty array
		if (!args.ids || args.ids.length === 0) {
			return [];
		}
		// Fetch users by their IDs
		const users = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
		// Filter out any nulls in case of missing users
		return users.filter((u) => u !== null);
	},
});
