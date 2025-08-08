import { create } from "./create-store";

interface CommandPaletteState {
	isOpen: boolean;
	selectedCategory: "all" | "tasks" | "projects" | "members" | "teams";

	openCommandPalette: () => void;
	closeCommandPalette: () => void;
	toggleCommandPalette: () => void;
	setSelectedCategory: (
		category: CommandPaletteState["selectedCategory"],
	) => void;
	resetCommandPalette: () => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
	isOpen: false,
	selectedCategory: "all",

	openCommandPalette: () => set({ isOpen: true }),
	closeCommandPalette: () => set({ isOpen: false, selectedCategory: "all" }),
	toggleCommandPalette: () => set((state) => ({ isOpen: !state.isOpen })),
	setSelectedCategory: (category) => set({ selectedCategory: category }),
	resetCommandPalette: () => set({ isOpen: false, selectedCategory: "all" }),
}));
