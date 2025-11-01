import { doc } from "convex-helpers/validators";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import schema from "./schema";

export const listMembersByOrg = query({
	args: {
		organizationId: v.id("organization"),
	},
	handler: async (ctx, args) => {
		const members = await ctx.db
			.query("member")
			.filter((q) => q.eq(q.field("organizationId"), args.organizationId))
			.collect();

		const enrichedMembers = await Promise.all(
			members.map(async (member) => {
				return {
					...member,
					user: await ctx.db.get(member.userId as any), // patch type for string id
				};
			}),
		);
		return enrichedMembers;
	},
});
