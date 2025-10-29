import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { api, components } from "../_generated/api";
import { internal } from "../_generated/api";
import { action, mutation, query } from "../_generated/server";
import { agent, createAgentWithContext } from "./agent";

/**
 * Send a message and initiate streaming response
 */
export const sendMessage = mutation({
	args: {
		threadId: v.id("_agent_threads"),
		message: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Verify thread belongs to user
		const thread = await ctx.db.get(args.threadId);
		if (!thread || thread.userId !== identity.subject) {
			throw new Error("Thread not found or unauthorized");
		}

		// Fetch context data in the mutation (which has auth)
		const contextData = await ctx.runQuery(api.contextData.buildAgentContext);

		// Initiate async streaming using the action
		await ctx.scheduler.runAfter(0, internal.agent.messages.streamResponse, {
			threadId: args.threadId,
			message: args.message,
			contextData: contextData || "",
		});

		return { success: true };
	},
});

/**
 * Internal action to handle streaming response
 */
export const streamResponse = action({
	args: {
		threadId: v.id("_agent_threads"),
		message: v.string(),
		contextData: v.string(),
	},
	handler: async (ctx, args) => {
		// Create the agent with context
		const agentWithContext = await createAgentWithContext(ctx, args.contextData);
		const threadHandle = await agentWithContext.continueThread(ctx, {
			threadId: args.threadId,
		});

		// Stream the response
		await threadHandle.streamText({
			prompt: args.message,
		});

		return { success: true };
	},
});

/**
 * Abort a streaming response
 */
export const abortStream = action({
	args: {
		threadId: v.id("_agent_threads"),
		order: v.number(),
	},
	handler: async (ctx, args) => {
		// Use the default agent for aborting (doesn't need context)
		const threadHandle = await agent.continueThread(ctx, {
			threadId: args.threadId,
		});

		await threadHandle.abortStreamByOrder({ order: args.order });

		return { success: true };
	},
});

/**
 * Get the current streaming status for a thread
 */
export const getStreamingStatus = query({
	args: {
		threadId: v.id("_agent_threads"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return { isStreaming: false };
		}

		// Verify thread belongs to user
		const thread = await ctx.db.get(args.threadId);
		if (!thread || thread.userId !== identity.subject) {
			return { isStreaming: false };
		}

		// Check if there are any messages with streaming status
		const streamingMessages = await ctx.db
			.query("_agent_messages")
			.withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
			.filter((q) => q.eq(q.field("status"), "streaming"))
			.first();

		return {
			isStreaming: !!streamingMessages,
			order: streamingMessages?.order,
		};
	},
});
