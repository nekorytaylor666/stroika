import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.storage.delete(args.storageId);
  },
});

export const attachToDocument = mutation({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
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

    await ctx.db.insert("documentAttachments", {
      documentId: args.documentId,
      fileName: args.fileName,
      fileUrl: args.storageId,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("documentActivity", {
      documentId: args.documentId,
      userId: user._id,
      action: "attachment_added",
      details: args.fileName,
      timestamp: Date.now(),
    });
  },
});

export const getDocumentAttachments = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const attachments = await ctx.db
      .query("documentAttachments")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const attachmentsWithUsers = await Promise.all(
      attachments.map(async (attachment) => {
        const uploader = await ctx.db.get(attachment.uploadedBy);
        return { ...attachment, uploader };
      })
    );

    return attachmentsWithUsers;
  },
});

export const removeAttachment = mutation({
  args: { attachmentId: v.id("documentAttachments") },
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

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");

    await ctx.db.delete(args.attachmentId);

    // Log activity
    await ctx.db.insert("documentActivity", {
      documentId: attachment.documentId,
      userId: user._id,
      action: "attachment_removed",
      details: attachment.fileName,
      timestamp: Date.now(),
    });
  },
});