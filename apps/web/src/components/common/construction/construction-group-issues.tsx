'use client';

import type { ConstructionTask, StatusType } from './construction-tasks';
import { useViewStore } from '@/store/view-store';
import { cn } from '@/lib/utils';
import { Plus, Circle, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { type FC, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Button } from '../../ui/button';
import { IssueDragType, IssueGrid } from '../issues/issue-grid';
import { ConstructionIssueLine } from './construction-issue-line';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { sortIssuesByPriority } from '@/mock-data/issues';
import { AnimatePresence, motion } from 'motion/react';
import { useConstructionData } from '@/hooks/use-construction-data';
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionGroupIssuesProps {
    status: StatusType;
    issues: ConstructionTask[];
    count: number;
}

// Status icon mapping based on iconName from database
const StatusIconMap = {
    'circle': Circle,
    'timer': Clock,
    'alert-circle': AlertCircle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
};

// Status icon component that uses database iconName
const StatusIcon: FC<{ iconName: string; color: string }> = ({ iconName, color }) => {
    const IconComponent = StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
    return <IconComponent style={{ color }} className="w-3.5 h-3.5" />;
};

export function ConstructionGroupIssues({ status, issues, count }: ConstructionGroupIssuesProps) {
    const { viewType } = useViewStore();
    const isViewTypeGrid = viewType === 'grid';
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
                            // Convert StatusType to Status type expected by openModal
                            const statusForModal = {
                                id: status._id,
                                name: status.name,
                                color: status.color,
                                icon: () => <StatusIcon iconName={status.iconName} color={status.color} />
                            };
                            openModal(statusForModal as any);
                        }}
                    >
                        <Plus className="size-4" />
                    </Button>
                </div>
            </div>

            {viewType === 'list' ? (
                <div className="space-y-0">
                    {sortedIssues.map((issue) => (
                        <ConstructionIssueLine key={issue._id} issue={issue} layoutId={true} />
                    ))}
                </div>
            ) : (
                <ConstructionIssueGridList issues={issues} status={status} />
            )}
        </div>
    );
}

const ConstructionIssueGridList: FC<{ issues: ConstructionTask[]; status: StatusType }> = ({ issues, status }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { updateTaskStatus } = useConstructionData();

    // Set up drop functionality to accept only issue items.
    const [{ isOver }, drop] = useDrop(() => ({
        accept: IssueDragType,
        drop: async (item: ConstructionTask, monitor) => {
            if (monitor.didDrop() && item.statusId !== status._id) {
                try {
                    await updateTaskStatus({
                        id: item._id as Id<"issues">,
                        statusId: status._id as Id<"status">
                    });
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
                            <p className="text-sm font-medium text-center">Задачи отсортированы по приоритету</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {sortedIssues.map((issue) => (
                <IssueGrid key={issue._id} issue={issue as any} />
            ))}
        </div>
    );
};