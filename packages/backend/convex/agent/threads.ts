import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import {
	createThread as createThreadAgent,
	listMessages,
	saveMessage,
	storeFile,
	syncStreams,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
// See the docs at https://docs.convex.dev/agents/messages
import { api, components, internal } from "../_generated/api";
import { action, internalAction, mutation, query } from "../_generated/server";
import {
	getCurrentUser,
	getCurrentUserWithOrganization,
} from "../helpers/getCurrentUser";
import { createAgentWithContext } from "./agent";

/**
 * OPTION 1 (BASIC):
 * Generating via a single action call
 */

export const generateTextInAnAction = action({
	args: { prompt: v.string(), threadId: v.id("_agent_threads") },
	handler: async (ctx, { prompt, threadId }) => {
		// await authorizeThreadAccess(ctx, threadId);
		// Note: This example uses the default agent without context.
		// For context-aware responses, use the sendMessage mutation instead.
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization) {
			throw new Error("User or organization not found");
		}
		const contextData = await ctx.runQuery(api.contextData.buildAgentContext);
		const agentWithContext = await createAgentWithContext(
			ctx,
			contextData,
			user._id,
			organization.id,
		);
		const result = await agentWithContext.generateText(
			ctx,
			{ threadId },
			{ prompt },
		);
		return result.text;
	},
});

/**
 * OPTION 2 (RECOMMENDED):
 * Generating via a mutation & async action
 * This enables optimistic updates on the client.
 */

// Save a user message, and kick off an async response.
export const sendMessage = mutation({
	args: {
		prompt: v.string(),
		threadId: v.string(),
		fileIds: v.optional(v.array(v.string())),
	},
	handler: async (ctx, { prompt, threadId, fileIds }) => {
		// await authorizeThreadAccess(ctx, threadId);
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			throw new Error("User not authenticated");
		}

		// Fetch context data in the mutation (which has auth)
		const contextData = await ctx.runQuery(api.contextData.buildAgentContext);

		const { messageId } = await saveMessage(ctx, components.agent, {
			threadId,
			prompt,
			fileIds,
		});
		await ctx.scheduler.runAfter(0, internal.agent.threads.generateResponse, {
			threadId,
			promptMessageId: messageId,
			contextData: contextData || "",
			userId: user._id,
			organizationId: organization.id,
		});
	},
});

// Generate a response to a user message.
// Any clients listing the messages will automatically get the new message.
export const generateResponse = internalAction({
	args: {
		promptMessageId: v.string(),
		threadId: v.id("_agent_threads"),
		contextData: v.string(),
		userId: v.id("users"),
		organizationId: v.id("organizations"),
	},
	handler: async (
		ctx,
		{ promptMessageId, threadId, contextData, userId, organizationId },
	) => {
		// Create agent with context
		const agentWithContext = await createAgentWithContext(
			ctx,
			contextData,
			userId,
			organizationId,
		);

		// Stream text with the context-aware agent
		const result = await agentWithContext.streamText(
			ctx,
			{ threadId },
			{ promptMessageId },
			{
				saveStreamDeltas: {
					chunking: "word",
					throttleMs: 50,
				},
			},
		);
	},
});

// Equivalent:
// export const generateResponse = agent.asTextAction();

/**
 * Query & subscribe to messages & threads
 */

export const listThreadMessages = query({
	args: {
		threadId: v.string(),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		const { threadId, paginationOpts } = args;
		// await authorizeThreadAccess(ctx, threadId);

		// Get messages from the agent component
		const messages = await listMessages(ctx, components.agent, {
			threadId,
			paginationOpts,
		});

		// IMPORTANT: Sync streaming deltas for real-time updates
		// This ensures that streaming messages are properly synchronized
		const streams = await syncStreams(ctx, components.agent, {
			threadId,
		});
		
		// Return both messages and streams for proper client-side rendering
		return {
			...messages,
			streams,
		};
	},
});

export const listThreads = query({
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return [];
		}
		const threads = await ctx.runQuery(
			components.agent.threads.listThreadsByUserId,
			{ userId: user._id, paginationOpts: { numItems: 10, cursor: null } },
		);
		console.log(threads);
		return threads;
	},
});

export const createThread = mutation({
	args: {
		title: v.optional(v.string()),
		summary: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}
		const threadId = await createThreadAgent(ctx, components.agent, {
			userId: user._id,
			title: args.title || "Новый чат",
			summary: args.summary || "Новый чат",
		});
		return threadId;
	},
});

export const deleteThread = mutation({
	args: {
		threadId: v.id("_agent_threads"),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}

		// Verify thread belongs to user
		const thread = await ctx.db.get(args.threadId);
		if (!thread || thread.userId !== user._id) {
			throw new Error("Thread not found or unauthorized");
		}

		// Delete all messages in the thread
		const messages = await ctx.db
			.query("_agent_messages")
			.withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
			.collect();

		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		// Delete the thread
		await ctx.db.delete(args.threadId);
	},
});

export const deleteAllThreads = mutation({
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}

		// Get all threads for the user
		const threads = await ctx.runQuery(
			components.agent.threads.listThreadsByUserId,
			{ userId: user._id, paginationOpts: { numItems: 1000, cursor: null } },
		);

		// Delete all messages and threads
		for (const thread of threads.page) {
			const messages = await ctx.db
				.query("_agent_messages")
				.withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
				.collect();

			for (const message of messages) {
				await ctx.db.delete(message._id);
			}

			await ctx.db.delete(thread._id);
		}
	},
});

export const updateThread = mutation({
	args: {
		threadId: v.id("_agent_threads"),
		title: v.optional(v.string()),
		summary: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not found");
		}

		// Verify thread belongs to user
		const thread = await ctx.db.get(args.threadId);
		if (!thread || thread.userId !== user._id) {
			throw new Error("Thread not found or unauthorized");
		}

		// Update thread
		await ctx.db.patch(args.threadId, {
			title: args.title,
			summary: args.summary,
		});
	},
});

export const getThreadDetails = query({
	args: {
		threadId: v.id("_agent_threads"),
	},
	handler: async (ctx, args) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			return null;
		}

		const thread = await ctx.db.get(args.threadId);
		if (!thread || thread.userId !== user._id) {
			return null;
		}

		return thread;
	},
});

/**
 * Upload a file and store it for use with the agent
 */
export const uploadFile = mutation({
	args: {
		storageId: v.id("_storage"),
		contentType: v.string(),
		filename: v.string(),
	},
	handler: async (ctx, { storageId, contentType, filename }) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not authenticated");
		}

		// Store the file using the agent component's storeFile function
		const fileId = await storeFile(ctx, components.agent, {
			storageId,
			contentType,
			filename,
		});

		return fileId;
	},
});

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		if (!user) {
			throw new Error("User not authenticated");
		}

		return await ctx.storage.generateUploadUrl();
	},
});
