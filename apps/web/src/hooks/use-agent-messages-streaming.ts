import {
	optimisticallySendMessage,
	useUIMessages,
} from "@convex-dev/agent/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { useCallback } from "react";

/**
 * Hook to manage messages in a thread with streaming support
 */
export function useAgentMessagesStreaming(
	threadId: Id<"_agent_threads"> | null,
) {
	// Use useUIMessages with streaming enabled - matches the example pattern
	const {
		results: messages,
		status,
		loadMore,
	} = useUIMessages(
		api.agent.threads.listThreadMessages,
		threadId ? { threadId } : "skip",
		{ initialNumItems: 10, stream: true },
	);

	// Create mutation with optimistic updates - uses sendMessage from threads.ts
	const sendMessage = useMutation(
		api.agent.threads.sendMessage,
	).withOptimisticUpdate(
		optimisticallySendMessage(api.agent.threads.listThreadMessages),
	);

	// Abort stream mutation
	const abortStreamByOrder = useMutation(api.agent.messages.abortStream);

	// Detect streaming status from the messages
	const streamingMessage = (messages ?? []).find(
		(msg) => msg.status === "streaming",
	);
	const isStreaming = !!streamingMessage;

	const handleSendMessage = useCallback(
		async (prompt: string, fileIds?: string[]) => {
			if (!threadId) {
				throw new Error("No thread selected");
			}

			try {
				// Use the optimistic update version
				await sendMessage({ threadId, prompt, fileIds });
			} catch (error) {
				console.error("Failed to send message:", error);
				throw error;
			}
		},
		[threadId, sendMessage],
	);

	const handleAbortStream = useCallback(async () => {
		if (!threadId || !streamingMessage) {
			return;
		}

		try {
			await abortStreamByOrder({
				threadId,
				order: streamingMessage.order ?? 0,
			});
		} catch (error) {
			console.error("Failed to abort stream:", error);
		}
	}, [threadId, streamingMessage, abortStreamByOrder]);

	return {
		messages: messages ?? [],
		isLoading: status === "LoadingFirstPage",
		sendMessage: handleSendMessage,
		hasMore: status === "CanLoadMore",
		loadMore: () => {
			if (status === "CanLoadMore") {
				loadMore(10);
			}
		},
		isStreaming,
		abortStream: handleAbortStream,
		streamingMessage,
	};
}
