'use client';

import { type FC, useState, useMemo, useRef } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomDragLayer, IssueDragType, IssueGrid } from '../issues/issue-grid';
import { IssueLine } from '../issues/issue-line';
import { useConstructionData } from '@/hooks/use-construction-data';
import { ConstructionCreateIssueModal } from './construction-create-issue-modal';
import { CreateIssueModalProvider } from '../issues/create-issue-modal-provider';
import { Button } from '@/components/ui/button';
import { Database, Plus, Circle, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { sortIssuesByPriority } from '@/mock-data/issues';
import { AnimatePresence, motion } from 'motion/react';
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";
import { useViewStore } from '@/store/view-store';

// Types for construction tasks
interface ConstructionTask {
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

interface StatusType {
    _id: string;
    name: string;
    color: string;
    iconName: string;
}

// Status icon mapping based on iconName from database
const StatusIconMap = {
    'Circle': Circle,
    'Clock': Clock,
    'AlertCircle': AlertCircle,
    'CheckCircle': CheckCircle,
};

// Status icon component that uses database iconName
const StatusIcon: FC<{ iconName: string; color: string }> = ({ iconName, color }) => {
    const IconComponent = StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
    return <IconComponent style={{ color }} className="w-3.5 h-3.5" />;
};

export default function ConstructionTasks() {
    const [searchQuery] = useState('');
    const [hasActiveFilters] = useState(false);
    const { viewType } = useViewStore();

    const isSearching = searchQuery.trim() !== '';
    const isViewTypeGrid = viewType === 'grid';
    const isFiltering = hasActiveFilters;

    return (
        <div className={cn('w-full h-full', isViewTypeGrid && 'overflow-x-auto')}>
            {isSearching ? (
                <SearchTasksView />
            ) : isFiltering ? (
                <FilteredTasksView isViewTypeGrid={isViewTypeGrid} />
            ) : (
                <GroupTasksListView isViewTypeGrid={isViewTypeGrid} />
            )}
            <ConstructionCreateIssueModal />
            <CreateIssueModalProvider />
        </div>
    );
}

const SearchTasksView = () => (
    <div className="px-6 mb-6">
        <div className="p-8 text-center text-muted-foreground">
            Поиск задач (функция в разработке)
        </div>
    </div>
);

const FilteredTasksView: FC<{
    isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
    const { tasks, statuses } = useConstructionData();

    // Apply filters to get filtered tasks (placeholder for now)
    const filteredTasks = useMemo(() => {
        return tasks || [];
    }, [tasks]);

    // Group filtered tasks by status
    const filteredTasksByStatus = useMemo(() => {
        if (!statuses || !filteredTasks) return {};

        const result: Record<string, ConstructionTask[]> = {};
        for (const status of statuses) {
            result[status._id] = filteredTasks.filter(task => task.statusId === status._id);
        }
        return result;
    }, [filteredTasks, statuses]);

    if (!statuses) return <SeedDataView />;

    return (
        <DndProvider backend={HTML5Backend}>
            <CustomDragLayer />
            <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
                {statuses.map((status) => (
                    <ConstructionGroupIssues
                        key={status._id}
                        status={status}
                        issues={filteredTasksByStatus[status._id] || []}
                        count={filteredTasksByStatus[status._id]?.length || 0}
                        isViewTypeGrid={isViewTypeGrid}
                    />
                ))}
            </div>
        </DndProvider>
    );
};

const GroupTasksListView: FC<{
    isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
    const { tasks, statuses } = useConstructionData();

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        if (!tasks || !statuses) return {};

        const result: Record<string, ConstructionTask[]> = {};
        for (const status of statuses) {
            result[status._id] = tasks.filter(task => task.statusId === status._id);
        }
        return result;
    }, [tasks, statuses]);

    if (!statuses) return <SeedDataView />;

    return (
        <DndProvider backend={HTML5Backend}>
            <CustomDragLayer />
            <div className={cn(isViewTypeGrid && 'flex h-full gap-3 px-2 py-2 min-w-max')}>
                {statuses.map((status) => (
                    <ConstructionGroupIssues
                        key={status._id}
                        status={status}
                        issues={tasksByStatus[status._id] || []}
                        count={tasksByStatus[status._id]?.length || 0}
                        isViewTypeGrid={isViewTypeGrid}
                    />
                ))}
            </div>
        </DndProvider>
    );
};

// Construction-specific GroupIssues component
const ConstructionGroupIssues: FC<{
    status: StatusType;
    issues: ConstructionTask[];
    count: number;
    isViewTypeGrid: boolean;
}> = ({ status, issues, count, isViewTypeGrid }) => {
    const { openModal } = useCreateIssueStore();
    const sortedIssues = sortIssuesByPriority(issues);

    return (
        <div
            className={cn(
                'bg-conainer',
                isViewTypeGrid
                    ? 'overflow-hidden rounded-md h-full flex-shrink-0 w-[348px] flex flex-col'
                    : ''
            )}
        >
            <div
                className={cn(
                    'sticky top-0 z-10 bg-container w-full',
                    isViewTypeGrid ? 'rounded-t-md h-[50px]' : 'h-10'
                )}
            >
                <div
                    className={cn(
                        'w-full h-full flex items-center justify-between',
                        isViewTypeGrid ? 'px-3' : 'px-6'
                    )}
                    style={{
                        backgroundColor: isViewTypeGrid ? `${status.color}10` : `${status.color}08`,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <StatusIcon iconName={status.iconName} color={status.color} />
                        <span className="text-sm font-medium">{status.name}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                    </div>

                    <Button
                        className="size-6"
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            openModal(status);
                        }}
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>

            {!isViewTypeGrid ? (
                <div className="space-y-0">
                    {sortedIssues.map((issue) => (
                        <IssueLine key={issue._id} issue={issue} layoutId={true} />
                    ))}
                </div>
            ) : (
                <ConstructionIssueGridList issues={issues} status={status} />
            )}
        </div>
    );
};

// Construction-specific IssueGridList with Convex integration
const ConstructionIssueGridList: FC<{
    issues: ConstructionTask[];
    status: StatusType;
}> = ({ issues, status }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { updateTaskStatus } = useConstructionData();

    // Set up drop functionality to accept only issue items and update Convex
    const [{ isOver }, drop] = useDrop(() => ({
        accept: IssueDragType,
        drop: async (item: ConstructionTask, monitor) => {
            if (monitor.didDrop() && item.statusId !== status._id) {
                try {
                    await updateTaskStatus({
                        id: item._id as Id<"issues">,
                        statusId: status._id as Id<"status">
                    });
                    console.log(`Task ${item._id} moved to status ${status._id}`);
                } catch (error) {
                    console.error('Failed to update task status:', error);
                }
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));
    drop(ref);

    const sortedIssues = sortIssuesByPriority(issues);

    return (
        <div
            ref={ref}
            className="flex-1 h-full overflow-y-auto p-2 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50 relative"
        >
            <AnimatePresence>
                {isOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="fixed top-0 left-0 right-0 bottom-0 z-10 flex items-center justify-center pointer-events-none bg-background/90"
                        style={{
                            width: ref.current?.getBoundingClientRect().width || '100%',
                            height: ref.current?.getBoundingClientRect().height || '100%',
                            transform: `translate(${ref.current?.getBoundingClientRect().left || 0}px, ${ref.current?.getBoundingClientRect().top || 0}px)`,
                        }}
                    >
                        <div className="bg-background border border-border rounded-md p-3 shadow-md max-w-[90%]">
                            <p className="text-sm font-medium text-center">Board ordered by priority</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {sortedIssues.map((issue) => (
                <IssueGrid key={issue._id} issue={issue} />
            ))}
        </div>
    );
};

// Seed data view when no data is available
const SeedDataView = () => {
    const { seedData } = useConstructionData();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await seedData();
            alert('Данные успешно инициализированы!');
        } catch (error) {
            console.error('Error seeding data:', error);
            alert('Ошибка при инициализации данных');
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
                Данные не найдены. Инициализируйте тестовые данные.
            </div>
            <Button
                onClick={handleSeedData}
                disabled={isSeeding}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <Database className="h-4 w-4" />
                {isSeeding ? 'Инициализация...' : 'Инициализировать данные'}
            </Button>
        </div>
    );
}; 