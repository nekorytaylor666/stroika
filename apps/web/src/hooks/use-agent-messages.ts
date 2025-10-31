import { useMutation, useQuery } from "convex/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useCallback } from "react";
import {
	useThreadMessages,
	toUIMessages,
	optimisticallySendMessage,
	type UIMessage,
} from "@convex-dev/agent/react";

/**
 * Hook to manage messages in a thread (basic pattern without streaming)
 */
export function useAgentMessages(threadId: Id<"_agent_threads"> | null) {
	// Use the Convex agent's useThreadMessages hook (basic pattern)
	const messages = useThreadMessages(
		api.agent.threads.listThreadMessages,
		threadId ? { threadId } : "skip",
		{ initialNumItems: 10 },
	);

	// Convert message docs to UIMessages for easier rendering
	const uiMessages = toUIMessages(messages.results ?? []);

	// Create mutation with optimistic updates
	const sendMessage = useMutation(
		api.agent.threads.sendMessage,
	).withOptimisticUpdate(
		optimisticallySendMessage(api.agent.threads.listThreadMessages),
	);

	const handleSendMessage = useCallback(
		async (prompt: string) => {
			if (!threadId) {
				throw new Error("No thread selected");
			}

			try {
				await sendMessage({ threadId, prompt });
			} catch (error) {
				console.error("Failed to send message:", error);
				throw error;
			}
		},
		[threadId, sendMessage],
	);

	return {
		messages: uiMessages,
		isLoading: messages.status === "LoadingFirstPage",
		sendMessage: handleSendMessage,
		hasMore: messages.status === "CanLoadMore",
		loadMore: () => {
			if (messages.status === "CanLoadMore") {
				messages.loadMore(10);
			}
		},
	};
}
