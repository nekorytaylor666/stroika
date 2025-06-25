import { create } from "zustand";

type ViewMode = "list" | "grid" | "board";
type SortBy = "title" | "date" | "status" | "assignee";
type SortOrder = "asc" | "desc";

interface DocumentsStore {
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;

	searchQuery: string;
	setSearchQuery: (query: string) => void;

	selectedDocumentId: string | null;
	setSelectedDocumentId: (id: string | null) => void;

	sortBy: SortBy;
	setSortBy: (sortBy: SortBy) => void;

	sortOrder: SortOrder;
	setSortOrder: (order: SortOrder) => void;

	filters: {
		status: string[];
		assignee: string[];
		tags: string[];
	};
	setFilters: (filters: Partial<DocumentsStore["filters"]>) => void;

	isCreateModalOpen: boolean;
	setIsCreateModalOpen: (open: boolean) => void;

	selectedParentId: string | null;
	setSelectedParentId: (id: string | null) => void;
}

export const useDocumentsStore = create<DocumentsStore>((set) => ({
	viewMode: "list",
	setViewMode: (mode) => set({ viewMode: mode }),

	searchQuery: "",
	setSearchQuery: (query) => set({ searchQuery: query }),

	selectedDocumentId: null,
	setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),

	sortBy: "date",
	setSortBy: (sortBy) => set({ sortBy }),

	sortOrder: "desc",
	setSortOrder: (order) => set({ sortOrder: order }),

	filters: {
		status: [],
		assignee: [],
		tags: [],
	},
	setFilters: (filters) =>
		set((state) => ({
			filters: { ...state.filters, ...filters },
		})),

	isCreateModalOpen: false,
	setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

	selectedParentId: null,
	setSelectedParentId: (id) => set({ selectedParentId: id }),
}));
