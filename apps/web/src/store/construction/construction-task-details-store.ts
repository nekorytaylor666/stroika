import { create } from 'zustand';
import type { ConstructionTask } from '@/components/common/construction/construction-tasks';

interface ConstructionTaskDetailsStore {
    isOpen: boolean;
    selectedTask: ConstructionTask | null;
    openTaskDetails: (task: ConstructionTask) => void;
    closeTaskDetails: () => void;
}

export const useConstructionTaskDetailsStore = create<ConstructionTaskDetailsStore>((set) => ({
    isOpen: false,
    selectedTask: null,
    openTaskDetails: (task) => set({ isOpen: true, selectedTask: task }),
    closeTaskDetails: () => set({ isOpen: false, selectedTask: null }),
}));