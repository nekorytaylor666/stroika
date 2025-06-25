'use client';

import { useSearchStore } from '@/store/search-store';
import { useViewStore } from '@/store/view-store';
import { useFilterStore } from '@/store/filter-store';
import { type FC, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomDragLayer } from '../issues/issue-grid';
import { cn } from '@/lib/utils';
import { useConstructionData } from '@/hooks/use-construction-data';
import { ConstructionGroupIssues } from './construction-group-issues';
import { SearchIssues } from '../issues/search-issues';
import { ConstructionCreateIssueModal } from './construction-create-issue-modal';
import { CreateIssueModalProvider } from '../issues/create-issue-modal-provider';

// Types for construction tasks
export interface ConstructionTask {
    _id: string;
    identifier: string;
    title: string;
    description: string;
    statusId: string;
    assigneeId?: string;
    priorityId: string;
    labelIds: string[];
    createdAt: string;
    cycleId: string;
    projectId?: string;
    rank: string;
    dueDate?: string;
    isConstructionTask: boolean;
}

export interface StatusType {
    _id: string;
    name: string;
    color: string;
    iconName: string;
}

export default function ConstructionTasks() {
    const { isSearchOpen, searchQuery } = useSearchStore();
    const { viewType } = useViewStore();
    const { hasActiveFilters } = useFilterStore();

    const isSearching = isSearchOpen && searchQuery.trim() !== '';
    const isViewTypeGrid = viewType === 'grid';
    const isFiltering = hasActiveFilters();

    return (
        <>
            <div className={cn('w-full h-full', isViewTypeGrid && 'overflow-x-auto')}>
                {isSearching ? (
                    <SearchConstructionTasksView />
                ) : isFiltering ? (
                    <FilteredConstructionTasksView isViewTypeGrid={isViewTypeGrid} />
                ) : (
                    <GroupConstructionTasksListView isViewTypeGrid={isViewTypeGrid} />
                )}
            </div>
            <ConstructionCreateIssueModal />
            <CreateIssueModalProvider />
        </>
    );
}

const SearchConstructionTasksView = () => (
    <div className="px-6 mb-6">
        <SearchIssues />
    </div>
);

const FilteredConstructionTasksView: FC<{
    isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
    const { filters } = useFilterStore();
    const { tasks, statuses } = useConstructionData();

    // Apply filters to get filtered tasks
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        
        let result = tasks;

        // Filter by status
        if (filters.status && filters.status.length > 0) {
            result = result.filter((task) =>
                filters.status.includes(task.statusId)
            );
        }

        // Filter by assignee
        if (filters.assignee && filters.assignee.length > 0) {
            result = result.filter((task) => {
                if (filters.assignee.includes('unassigned')) {
                    // If 'unassigned' is selected and the task has no assignee
                    if (!task.assigneeId) {
                        return true;
                    }
                }
                // Check if the task's assignee is in the selected assignees
                return task.assigneeId && filters.assignee.includes(task.assigneeId);
            });
        }

        // Filter by priority
        if (filters.priority && filters.priority.length > 0) {
            result = result.filter((task) =>
                filters.priority.includes(task.priorityId)
            );
        }

        // Filter by labels
        if (filters.labels && filters.labels.length > 0) {
            result = result.filter((task) =>
                task.labelIds.some((labelId) => filters.labels.includes(labelId))
            );
        }

        // Filter by project
        if (filters.project && filters.project.length > 0) {
            result = result.filter(
                (task) => task.projectId && filters.project.includes(task.projectId)
            );
        }

        return result;
    }, [tasks, filters.status, filters.assignee, filters.priority, filters.labels, filters.project]);

    // Group filtered tasks by status
    const filteredTasksByStatus = useMemo(() => {
        if (!statuses) return {};
        
        const result: Record<string, ConstructionTask[]> = {};

        for (const statusItem of statuses) {
            result[statusItem._id] = filteredTasks.filter(
                (task) => task.statusId === statusItem._id
            );
        }

        return result;
    }, [filteredTasks, statuses]);

    if (!statuses) return null;

    return (
        <DndProvider backend={HTML5Backend}>
            <CustomDragLayer />
            <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
                {statuses.map((statusItem) => (
                    <ConstructionGroupIssues
                        key={statusItem._id}
                        status={statusItem}
                        issues={filteredTasksByStatus[statusItem._id] || []}
                        count={filteredTasksByStatus[statusItem._id]?.length || 0}
                    />
                ))}
            </div>
        </DndProvider>
    );
};

const GroupConstructionTasksListView: FC<{
    isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
    const { tasks, statuses } = useConstructionData();

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        if (!tasks || !statuses) return {};

        const result: Record<string, ConstructionTask[]> = {};
        for (const statusItem of statuses) {
            result[statusItem._id] = tasks.filter(task => task.statusId === statusItem._id);
        }
        return result;
    }, [tasks, statuses]);

    if (!statuses) return null;

    return (
        <DndProvider backend={HTML5Backend}>
            <CustomDragLayer />
            <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
                {statuses.map((statusItem) => (
                    <ConstructionGroupIssues
                        key={statusItem._id}
                        status={statusItem}
                        issues={tasksByStatus[statusItem._id] || []}
                        count={tasksByStatus[statusItem._id]?.length || 0}
                    />
                ))}
            </div>
        </DndProvider>
    );
};