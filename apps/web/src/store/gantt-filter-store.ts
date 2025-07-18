import { create } from "./create-store";

export interface GanttFilterState {
	// Filter options specific to Gantt view
	filters: {
		projectStatus: string[];
		project: string[];
	};

	// Actions
	setFilter: (type: "projectStatus" | "project", ids: string[]) => void;
	toggleFilter: (type: "projectStatus" | "project", id: string) => void;
	clearFilters: () => void;
	clearFilterType: (type: "projectStatus" | "project") => void;

	// Utility
	hasActiveFilters: () => boolean;
	getActiveFiltersCount: () => number;
}

export const useGanttFilterStore = create<GanttFilterState>((set, get) => ({
	// Initial state
	filters: {
		projectStatus: [],
		project: [],
	},

	// Actions
	setFilter: (type, ids) => {
		set((state) => ({
			filters: {
				...state.filters,
				[type]: ids,
			},
		}));
	},

	toggleFilter: (type, id) => {
		set((state) => {
			const currentFilters = state.filters[type];
			const newFilters = currentFilters.includes(id)
				? currentFilters.filter((item) => item !== id)
				: [...currentFilters, id];

			return {
				filters: {
					...state.filters,
					[type]: newFilters,
				},
			};
		});
	},

	clearFilters: () => {
		set({
			filters: {
				projectStatus: [],
				project: [],
			},
		});
	},

	clearFilterType: (type) => {
		set((state) => ({
			filters: {
				...state.filters,
				[type]: [],
			},
		}));
	},

	// Utility
	hasActiveFilters: () => {
		const { filters } = get();
		return Object.values(filters).some((filterArray) => filterArray.length > 0);
	},

	getActiveFiltersCount: () => {
		const { filters } = get();
		return Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);
	},
}));
