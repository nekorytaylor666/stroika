import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc, type Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getCurrentUserWithOrganization } from "./helpers/getCurrentUser";

export const create = mutation({
	args: {
		issueId: v.id("issues"),
		authorId: v.string(),
		content: v.string(),
		parentCommentId: v.optional(v.id("issueComments")),
		mentionedUserIds: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) throw new Error("User not found");
		const commentId = await ctx.db.insert("issueComments", {
			issueId: args.issueId,
			authorId: user._id,
			content: args.content,
			parentCommentId: args.parentCommentId,
			isResolved: false,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Create mentions
		if (args.mentionedUserIds && args.mentionedUserIds.length > 0) {
			for (const mentionedUserId of args.mentionedUserIds) {
				await ctx.db.insert("issueMentions", {
					commentId,
					issueId: args.issueId,
					mentionedUserId,
					mentionedBy: user._id,
					createdAt: Date.now(),
					isRead: false,
				});
			}
		}

		// Send notification for new comment
		await ctx.runMutation(api.issueNotifications.notifyTaskCommented, {
			issueId: args.issueId,
			commentId,
			commentAuthorId: user._id,
		});

		return commentId;
	},
});

export const list = query({
	args: {
		issueId: v.id("issues"),
		includeResolved: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		let comments = await ctx.db
			.query("issueComments")
			.withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
			.collect();

		if (!args.includeResolved) {
			comments = comments.filter((comment) => !comment.isResolved);
		}

		const commentsWithDetails = await Promise.all(
			comments.map(async (comment) => {
				const [author, childrenCount, mentions] = await Promise.all([
					ctx.db.get(comment.authorId),
					ctx.db
						.query("issueComments")
						.withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
						.collect()
						.then((children) => children.length),
					ctx.db
						.query("issueMentions")
						.withIndex("by_comment", (q) => q.eq("commentId", comment._id))
						.collect()
						.then(async (mentions) => {
							const mentionedUsers = await Promise.all(
								mentions.map((m) => ctx.db.get(m.mentionedUserId)),
							);
							return mentionedUsers.filter(Boolean);
						}),
				]);

				return {
					...comment,
					author,
					childrenCount,
					mentionedUsers: mentions,
				};
			}),
		);

		// Organize comments in thread structure
		const rootComments = commentsWithDetails.filter((c) => !c.parentCommentId);
		const commentMap = new Map(commentsWithDetails.map((c) => [c._id, c]));

		const buildThreads = (comments: typeof commentsWithDetails): any[] => {
			return comments.map((comment) => ({
				...comment,
				replies: commentsWithDetails
					.filter((c) => c.parentCommentId === comment._id)
					.map((reply) => buildThreads([reply])[0]),
			}));
		};

		return buildThreads(rootComments);
	},
});

export const update = mutation({
	args: {
		id: v.id("issueComments"),
		userId: v.string(),
		content: v.string(),
		mentionedUserIds: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const comment = await ctx.db.get(args.id);
		if (!comment) throw new Error("Comment not found");
		if (comment.authorId !== args.userId) throw new Error("Not authorized");

		await ctx.db.patch(args.id, {
			content: args.content,
			updatedAt: Date.now(),
		});

		// Update mentions
		if (args.mentionedUserIds !== undefined) {
			// Remove old mentions
			const oldMentions = await ctx.db
				.query("issueMentions")
				.withIndex("by_comment", (q) => q.eq("commentId", args.id))
				.collect();

			for (const mention of oldMentions) {
				await ctx.db.delete(mention._id);
			}

			// Add new mentions
			for (const mentionedUserId of args.mentionedUserIds) {
				await ctx.db.insert("issueMentions", {
					commentId: args.id,
					issueId: comment.issueId,
					mentionedUserId,
					mentionedBy: args.userId,
					createdAt: Date.now(),
					isRead: false,
				});
			}
		}
	},
});

export const resolve = mutation({
	args: {
		id: v.id("issueComments"),
		isResolved: v.boolean(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.id, {
			isResolved: args.isResolved,
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: {
		id: v.id("issueComments"),
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const comment = await ctx.db.get(args.id);
		if (!comment) throw new Error("Comment not found");
		if (comment.authorId !== args.userId) throw new Error("Not authorized");

		// Delete mentions
		const mentions = await ctx.db
			.query("issueMentions")
			.withIndex("by_comment", (q) => q.eq("commentId", args.id))
			.collect();

		for (const mention of mentions) {
			await ctx.db.delete(mention._id);
		}

		// Delete replies recursively
		const deleteReplies = async (commentId: Id<"issueComments">) => {
			const replies = await ctx.db
				.query("issueComments")
				.withIndex("by_parent", (q) => q.eq("parentCommentId", commentId))
				.collect();

			for (const reply of replies) {
				await deleteReplies(reply._id);
				await ctx.db.delete(reply._id);
			}
		};

		await deleteReplies(args.id);
		await ctx.db.delete(args.id);
	},
});

export const getUserMentions = query({
	args: {
		userId: v.id("users"),
		onlyUnread: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const targetUserId = args.userId;

		let mentions = await ctx.db
			.query("issueMentions")
			.withIndex("by_mentioned_user", (q) =>
				q.eq("mentionedUserId", targetUserId),
			)
			.order("desc")
			.collect();

		if (args.onlyUnread) {
			mentions = mentions.filter((m) => !m.isRead);
		}

		const mentionsWithDetails = await Promise.all(
			mentions.map(async (mention) => {
				const [comment, issue, mentionedBy] = await Promise.all([
					ctx.db.get(mention.commentId),
					ctx.db.get(mention.issueId),
					ctx.db.get(mention.mentionedBy),
				]);

				return {
					...mention,
					comment,
					issue,
					mentionedBy,
				};
			}),
		);

		return mentionsWithDetails.filter((m) => m.comment && m.issue);
	},
});

export const markMentionAsRead = mutation({
	args: { mentionId: v.id("issueMentions") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.mentionId, {
			isRead: true,
		});
	},
});
