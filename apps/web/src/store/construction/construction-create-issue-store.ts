import type { Status } from "@/mock-data/status";
import type { Id } from "@stroika/backend";
import { create } from "../create-store";

interface ConstructionCreateIssueState {
	isOpen: boolean;
	defaultStatus: Status | null;
	defaultProjectId: Id<"constructionProjects"> | null;

	// Actions
	openModal: (options?: { status?: Status; projectId?: Id<"constructionProjects"> }) => void;
	closeModal: () => void;
	setDefaultStatus: (status: Status | null) => void;
	setDefaultProjectId: (projectId: Id<"constructionProjects"> | null) => void;
}

export { type ConstructionCreateIssueState };

export const useConstructionCreateIssueStore =
	create<ConstructionCreateIssueState>((set) => ({
		isOpen: false,
		defaultStatus: null,
		defaultProjectId: null,

		openModal: (options) => set({
			isOpen: true,
			defaultStatus: options?.status || null,
			defaultProjectId: options?.projectId || null
		}),
		closeModal: () => set({ isOpen: false, defaultStatus: null, defaultProjectId: null }),
		setDefaultStatus: (status) => set({ defaultStatus: status }),
		setDefaultProjectId: (projectId) => set({ defaultProjectId: projectId }),
	}));
