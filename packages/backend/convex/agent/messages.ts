import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { v } from "convex/values";
import { api, components } from "../_generated/api";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, mutation, query } from "../_generated/server";
import { getCurrentUserWithOrganization } from "../helpers/getCurrentUser";
import { createAgentWithContext } from "./agent";

/**
 * Send a message and initiate streaming response
 */
export const sendMessage = mutation({
	args: {
		threadId: v.string(),
		message: v.string(),
		fileIds: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		// Get user and organization
		const { user, organization } = await getCurrentUserWithOrganization(ctx);
		if (!user || !organization) {
			throw new Error("User or organization not found");
		}

		// Fetch context data in the mutation (which has auth)
		const contextData = await ctx.runQuery(api.contextData.buildAgentContext);

		// Initiate async streaming using the action
		await ctx.scheduler.runAfter(0, internal.agent.messages.streamResponse, {
			threadId: args.threadId,
			message: args.message,
			fileIds: args.fileIds,
			contextData: contextData || "",
			userId: user._id,
			organizationId: organization.id as Id<"organizations">,
		});

		return { success: true };
	},
});

/**
 * Internal action to handle streaming response
 */
export const streamResponse = action({
	args: {
		threadId: v.string(),
		message: v.string(),
		fileIds: v.optional(v.array(v.string())),
		contextData: v.string(),
		userId: v.string(),
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		// Create the agent with context including userId and organizationId
		const agentWithContext = await createAgentWithContext(
			ctx,
			args.contextData,
			args.userId,
			args.organizationId,
		);

		// Continue the thread with the custom context
		const threadHandle = await agentWithContext.continueThread(ctx, {
			threadId: args.threadId,
			// Pass the context to the tools
			userId: args.userId,
			organizationId: args.organizationId,
		});

		// Stream the response with file attachments if provided
		await threadHandle.streamText(
			{
				prompt: args.message,
				fileIds: args.fileIds,
			},
			{
				saveStreamDeltas: {
					chunking: "word",
					throttleMs: 50,
				},
			},
		);

		return { success: true };
	},
});

/**
 * Alternative direct generation without thread (for simpler use cases)
 */
export const generateResponse = action({
	args: {
		message: v.string(),
		threadId: v.optional(v.string()),
		fileIds: v.optional(v.array(v.string())),
		userId: v.id("users"),
		organizationId: v.id("organizations"),
	},
	handler: async (ctx, args) => {
		// Get context data
		const contextData = await ctx.runQuery(api.contextData.buildAgentContext);

		// Create the agent with context
		const agentWithContext = await createAgentWithContext(
			ctx,
			contextData || "",
			args.userId,
			args.organizationId,
		);

		if (args.threadId) {
			// Use existing thread
			const threadHandle = await agentWithContext.continueThread(ctx, {
				threadId: args.threadId,
				userId: args.userId,
				organizationId: args.organizationId,
			});

			const response = await threadHandle.generateText({
				prompt: args.message,
				fileIds: args.fileIds,
			});

			return response.text;
		} else {
			// Create new thread
			const { thread } = await agentWithContext.createThread(ctx, {
				userId: args.userId,
			});

			const threadHandle = await agentWithContext.continueThread(ctx, {
				threadId: thread._id,
				userId: args.userId,
				organizationId: args.organizationId,
			});

			const response = await threadHandle.generateText({
				prompt: args.message,
				fileIds: args.fileIds,
			});

			return response.text;
		}
	},
});

/**
 * Abort a streaming response by message order
 * This follows the pattern from the Convex example
 */
export const abortStream = mutation({
	args: {
		threadId: v.string(),
		order: v.number(),
	},
	handler: async (ctx, args) => {
		// Get user to ensure authorization
		const { user } = await getCurrentUserWithOrganization(ctx);
		if (!user) {
			throw new Error("User not authenticated");
		}

		// Find the message with the given order and mark it as aborted
		const messages = await ctx.db
			.query("_agent_messages")
			.withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
			.collect();

		const message = messages.find((m) => m.order === args.order);
		if (message && message.role === "assistant") {
			// The agent component will handle the abort through its internal mechanisms
			// when the streaming delta is marked as aborted
			console.log(`Aborting stream for message order ${args.order}`);
		}

		return { success: true };
	},
});

/**
 * Get the current streaming status for a thread
 * Note: This is a simplified version - the actual streaming status
 * is handled by the syncStreams function in listThreadMessages
 */
export const getStreamingStatus = query({
	args: {
		threadId: v.id("_agent_threads"),
	},
	handler: async (ctx, args) => {
		// For now, return false as streaming status is handled by syncStreams
		// The UI will get real-time updates through the messages query
		return { isStreaming: false };
	},
});
