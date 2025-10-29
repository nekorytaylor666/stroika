import { doc } from "convex-helpers/validators";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { api, components } from "./_generated/api";
import schema from "./schema";
export const addTeamMembers = mutation({
	args: {
		teamId: v.id("team"),
		userIds: v.array(v.id("user")),
	},
	handler: async (ctx, args) => {
		await Promise.all(
			args.userIds.map(async (userId) => {
				await ctx.db.insert("teamMember", {
					teamId: args.teamId,
					userId: userId,
				});
			}),
		);
		return { success: true };
	},
});

export const addTeamMembersByTeamName = mutation({
	args: {
		teamName: v.string(),
		userIds: v.array(v.id("user")),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db
			.query("team")
			.filter((q) => q.eq(q.field("name"), args.teamName))
			.first();
		if (!team) {
			throw new Error("Team not found");
		}
		await Promise.all(
			args.userIds.map(async (userId) => {
				await ctx.db.insert("teamMember", {
					teamId: team._id,
					userId: userId,
				});
			}),
		);
		return { success: true };
	},
});

export const removeTeamMembersByTeamName = mutation({
	args: {
		teamName: v.string(),
		userId: v.id("user"),
	},
	handler: async (ctx, args) => {
		const team = await ctx.db
			.query("team")
			.filter((q) => q.eq(q.field("name"), args.teamName))
			.first();
		if (!team) {
			throw new Error("Team not found");
		}
		const member = await ctx.db
			.query("teamMember")
			.filter((q) =>
				q.and(
					q.eq(q.field("teamId"), team._id),
					q.eq(q.field("userId"), args.userId),
				),
			)
			.first();
		if (!member) {
			throw new Error("Member not found");
		}
		await ctx.db.delete(member._id);
		return { success: true };
	},
});

export const getTeamMembersByTeamName = query({
	args: {
		name: v.string(),
	},
	returns: v.array(doc(schema, "user")),
	handler: async (ctx, args): Promise<Doc<"user">[]> => {
		const team = await ctx.db
			.query("team")
			.filter((q) => q.eq(q.field("name"), args.name))
			.first();
		if (!team) {
			throw new Error("Team not found");
		}
		const members = await ctx.db
			.query("teamMember")
			.filter((q) => q.eq(q.field("teamId"), team._id))
			.collect();

		const users = await ctx.runQuery(api.users.listUsers, {
			ids: members.map((member) => member.userId),
		});
		return users;
	},
});
