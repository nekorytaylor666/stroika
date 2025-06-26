import { create } from "./create-store";

interface InboxState {
	unreadCount: number;
}

export const useInboxStore = create<InboxState>(() => ({
	unreadCount: 5,
}));
