import { useQuery, useMutation } from "convex/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useCallback } from "react";

/**
 * Hook to manage agent threads
 */
export function useAgentThreads() {
	const threads = useQuery(api.agent.threads.listThreads, {});
	const createThreadMutation = useMutation(api.agent.threads.createThread);
	const deleteThreadMutation = useMutation(api.agent.threads.deleteThread);
	const deleteAllThreadsMutation = useMutation(
		api.agent.threads.deleteAllThreads,
	);
	const updateThreadMutation = useMutation(api.agent.threads.updateThread);

	const createThread = useCallback(
		async (args?: { title?: string; summary?: string }) => {
			return await createThreadMutation(args || {});
		},
		[createThreadMutation],
	);

	const deleteThread = useCallback(
		async (threadId: Id<"_agent_threads">) => {
			return await deleteThreadMutation({ threadId });
		},
		[deleteThreadMutation],
	);

	const deleteAllThreads = useCallback(async () => {
		return await deleteAllThreadsMutation({});
	}, [deleteAllThreadsMutation]);

	const updateThread = useCallback(
		async (
			threadId: Id<"_agent_threads">,
			updates: { title?: string; summary?: string },
		) => {
			return await updateThreadMutation({ threadId, ...updates });
		},
		[updateThreadMutation],
	);

	return {
		threads: threads?.page || [],
		isLoading: threads === undefined,
		createThread,
		deleteThread,
		deleteAllThreads,
		updateThread,
	};
}
