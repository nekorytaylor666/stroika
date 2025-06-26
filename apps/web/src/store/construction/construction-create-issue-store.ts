import type { Status } from "@/mock-data/status";
import { create } from "../create-store";

interface ConstructionCreateIssueState {
	isOpen: boolean;
	defaultStatus: Status | null;

	// Actions
	openModal: (status?: Status) => void;
	closeModal: () => void;
	setDefaultStatus: (status: Status | null) => void;
}

export const useConstructionCreateIssueStore =
	create<ConstructionCreateIssueState>((set) => ({
		isOpen: false,
		defaultStatus: null,

		openModal: (status) => set({ isOpen: true, defaultStatus: status || null }),
		closeModal: () => set({ isOpen: false, defaultStatus: null }),
		setDefaultStatus: (status) => set({ defaultStatus: status }),
	}));
