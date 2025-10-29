import {
	createThread as createThreadAgent,
	listMessages,
	saveMessage,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
// See the docs at https://docs.convex.dev/agents/messages
import { components, internal } from "../_generated/api";
import { action, internalAction, mutation, query } from "../_generated/server";
import { getCurrentUser } from "../helpers/getCurrentUser";
import { agent } from "./agent";

/**
 * OPTION 1 (BASIC):
 * Generating via a single action call
 */

export const generateTextInAnAction = action({
	args: { prompt: v.string(), threadId: v.string() },
	handler: async (ctx, { prompt, threadId }) => {
		// await authorizeThreadAccess(ctx, threadId);
		// Create agent with context
		const { createAgentWithContext } = await import("./agent");
		const agentWithContext = await createAgentWithContext(ctx);

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
	args: { prompt: v.string(), threadId: v.string() },
	handler: async (ctx, { prompt, threadId }) => {
		// await authorizeThreadAccess(ctx, threadId);
		const { messageId } = await saveMessage(ctx, components.agent, {
			threadId,
			prompt,
		});
		await ctx.scheduler.runAfter(0, internal.agent.threads.generateResponse, {
			threadId,
			promptMessageId: messageId,
		});
	},
});

// Generate a response to a user message.
// Any clients listing the messages will automatically get the new message.
export const generateResponse = internalAction({
	args: { promptMessageId: v.string(), threadId: v.string() },
	handler: async (ctx, { promptMessageId, threadId }) => {
		// Create agent with context
		const { createAgentWithContext } = await import("./agent");
		const agentWithContext = await createAgentWithContext(ctx);

		// Generate text with the context-aware agent
		await agentWithContext.generateText(ctx, { threadId }, { promptMessageId });
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
		const messages = await listMessages(ctx, components.agent, {
			threadId,
			paginationOpts,
		});
		// You could add more fields here, join with other tables, etc.
		return messages;
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
