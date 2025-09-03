import { v } from "convex/values";
import { query } from "./_generated/server";

// Alias for metadata.getLabelsByIds for compatibility
export const getByIds = query({
	args: { ids: v.array(v.id("labels")) },
	handler: async (ctx, args) => {
		const labels = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
		return labels.filter((label) => label !== null);
	},
});
