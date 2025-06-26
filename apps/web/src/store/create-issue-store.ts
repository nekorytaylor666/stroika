import type { Id } from "@stroika/backend";
import { create } from "zustand";

// Define Status type based on Convex schema
interface Status {
	id: Id<"status">;
	name: string;
	color: string;
	icon: () => JSX.Element;
}

interface CreateIssueState {
	isOpen: boolean;
	defaultStatus: Status | null;
	defaultProjectId: Id<"constructionProjects"> | null;

	// Actions
	openModal: ({
		status,
		projectId,
	}: { status?: Status; projectId?: Id<"constructionProjects"> }) => void;
	closeModal: () => void;
	setDefaultStatus: (status: Status | null) => void;
}

export const useCreateIssueStore = create<CreateIssueState>((set) => ({
	// Initial state
	isOpen: false,
	defaultStatus: null,
	defaultProjectId: null,
	// Actions
	openModal: ({
		status,
		projectId,
	}: { status?: Status; projectId?: Id<"constructionProjects"> }) =>
		set({
			isOpen: true,
			defaultStatus: status || null,
			defaultProjectId: projectId || null,
		}),
	closeModal: () => set({ isOpen: false }),
	setDefaultStatus: (status) => set({ defaultStatus: status }),
}));
