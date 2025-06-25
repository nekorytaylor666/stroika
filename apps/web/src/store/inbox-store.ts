import { create } from "zustand";

interface InboxState {
	unreadCount: number;
}

export const useInboxStore = create<InboxState>(() => ({
	unreadCount: 5,
}));
