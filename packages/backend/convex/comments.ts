import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    parentCommentId: v.optional(v.id("documentComments")),
    mentionedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    const commentId = await ctx.db.insert("documentComments", {
      documentId: args.documentId,
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
        await ctx.db.insert("documentMentions", {
          commentId,
          documentId: args.documentId,
          mentionedUserId,
          mentionedBy: user._id,
          createdAt: Date.now(),
          isRead: false,
        });
      }
    }

    // Log activity
    await ctx.db.insert("documentActivity", {
      documentId: args.documentId,
      userId: user._id,
      action: "commented",
      details: args.content.substring(0, 100),
      timestamp: Date.now(),
    });

    return commentId;
  },
});

export const list = query({
  args: { 
    documentId: v.id("documents"),
    includeResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let comments = await ctx.db
      .query("documentComments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    if (!args.includeResolved) {
      comments = comments.filter(comment => !comment.isResolved);
    }

    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        const [author, childrenCount, mentions] = await Promise.all([
          ctx.db.get(comment.authorId),
          ctx.db
            .query("documentComments")
            .withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
            .collect()
            .then(children => children.length),
          ctx.db
            .query("documentMentions")
            .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
            .collect()
            .then(async mentions => {
              const mentionedUsers = await Promise.all(
                mentions.map(m => ctx.db.get(m.mentionedUserId))
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
      })
    );

    // Organize comments in thread structure
    const rootComments = commentsWithDetails.filter(c => !c.parentCommentId);
    const commentMap = new Map(commentsWithDetails.map(c => [c._id, c]));

    const buildThreads = (comments: typeof commentsWithDetails) => {
      return comments.map(comment => ({
        ...comment,
        replies: commentsWithDetails
          .filter(c => c.parentCommentId === comment._id)
          .map(reply => buildThreads([reply])[0]),
      }));
    };

    return buildThreads(rootComments);
  },
});

export const update = mutation({
  args: {
    id: v.id("documentComments"),
    content: v.string(),
    mentionedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });

    // Update mentions
    if (args.mentionedUserIds !== undefined) {
      // Remove old mentions
      const oldMentions = await ctx.db
        .query("documentMentions")
        .withIndex("by_comment", (q) => q.eq("commentId", args.id))
        .collect();
      
      for (const mention of oldMentions) {
        await ctx.db.delete(mention._id);
      }

      // Add new mentions
      for (const mentionedUserId of args.mentionedUserIds) {
        await ctx.db.insert("documentMentions", {
          commentId: args.id,
          documentId: comment.documentId,
          mentionedUserId,
          mentionedBy: user._id,
          createdAt: Date.now(),
          isRead: false,
        });
      }
    }
  },
});

export const resolve = mutation({
  args: {
    id: v.id("documentComments"),
    isResolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      isResolved: args.isResolved,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("documentComments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== user._id) throw new Error("Not authorized");

    // Delete mentions
    const mentions = await ctx.db
      .query("documentMentions")
      .withIndex("by_comment", (q) => q.eq("commentId", args.id))
      .collect();
    
    for (const mention of mentions) {
      await ctx.db.delete(mention._id);
    }

    // Delete replies recursively
    const deleteReplies = async (commentId: Id<"documentComments">) => {
      const replies = await ctx.db
        .query("documentComments")
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
    userId: v.optional(v.id("users")),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    const targetUserId = args.userId || user._id;

    let mentions = await ctx.db
      .query("documentMentions")
      .withIndex("by_mentioned_user", (q) => q.eq("mentionedUserId", targetUserId))
      .order("desc")
      .collect();

    if (args.onlyUnread) {
      mentions = mentions.filter(m => !m.isRead);
    }

    const mentionsWithDetails = await Promise.all(
      mentions.map(async (mention) => {
        const [comment, document, mentionedBy] = await Promise.all([
          ctx.db.get(mention.commentId),
          ctx.db.get(mention.documentId),
          ctx.db.get(mention.mentionedBy),
        ]);

        return {
          ...mention,
          comment,
          document,
          mentionedBy,
        };
      })
    );

    return mentionsWithDetails.filter(m => m.comment && m.document);
  },
});

export const markMentionAsRead = mutation({
  args: { mentionId: v.id("documentMentions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.mentionId, {
      isRead: true,
    });
  },
});