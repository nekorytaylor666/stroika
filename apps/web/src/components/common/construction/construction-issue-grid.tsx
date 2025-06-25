'use client';

import type { ConstructionTask } from './construction-tasks';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { type DragSourceMonitor, useDrag, useDragLayer, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { ConstructionAssigneeUser } from './construction-assignee-user';
import { ConstructionLabelBadge } from './construction-label-badge';
import { ConstructionPrioritySelector } from './construction-priority-selector';
import { ConstructionProjectBadge } from './construction-project-badge';
import { ConstructionStatusSelector } from './construction-status-selector';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { IssueContextMenu } from '../issues/issue-context-menu';
import { useConstructionData } from '@/hooks/use-construction-data';
import { useConstructionTaskDetailsStore } from '@/store/construction/construction-task-details-store';
import { IssueDragType } from '../issues/issue-grid';

type ConstructionIssueGridProps = {
    issue: ConstructionTask;
};

// Custom DragLayer component to render the drag preview
function ConstructionIssueDragPreview({ issue }: { issue: ConstructionTask }) {
    const { users, labels, priorities, projects } = useConstructionData();
    
    const assignee = issue.assigneeId ? users?.find(u => u._id === issue.assigneeId) : null;
    const taskLabels = issue.labelIds.map(id => labels?.find(l => l._id === id)).filter(Boolean);
    const priority = priorities?.find(p => p._id === issue.priorityId);
    const project = issue.projectId ? projects?.find(p => p._id === issue.projectId) : null;

    return (
        <div className="w-full p-3 bg-background rounded-md border border-border/50 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    {priority && <ConstructionPrioritySelector priority={priority} issueId={issue._id} />}
                    <span className="text-xs text-muted-foreground font-medium">{issue.identifier}</span>
                </div>
                <ConstructionStatusSelector statusId={issue.statusId} issueId={issue._id} />
            </div>

            <h3 className="text-sm font-semibold mb-3 line-clamp-2">{issue.title}</h3>

            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
                {taskLabels.length > 0 && <ConstructionLabelBadge labels={taskLabels as any} />}
                {project && <ConstructionProjectBadge project={project} />}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-xs text-muted-foreground">
                    {format(new Date(issue.createdAt), 'MMM dd')}
                </span>
                <ConstructionAssigneeUser user={assignee} />
            </div>
        </div>
    );
}

// Custom DragLayer component to show the preview during drag
export function ConstructionCustomDragLayer() {
    const { isDragging, issue, currentOffset } = useDragLayer((monitor) => ({
        isDragging: monitor.isDragging(),
        issue: monitor.getItem() as ConstructionTask,
        currentOffset: monitor.getSourceClientOffset(),
    }));

    if (!isDragging || !currentOffset) {
        return null;
    }

    return (
        <div
            className="fixed pointer-events-none z-50 left-0 top-0"
            style={{
                transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
                width: '348px',
            }}
        >
            <ConstructionIssueDragPreview issue={issue} />
        </div>
    );
}

export function ConstructionIssueGrid({ issue }: ConstructionIssueGridProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { users, labels, priorities, projects } = useConstructionData();
    const { openTaskDetails } = useConstructionTaskDetailsStore();
    
    const assignee = issue.assigneeId ? users?.find(u => u._id === issue.assigneeId) : null;
    const taskLabels = issue.labelIds.map(id => labels?.find(l => l._id === id)).filter(Boolean);
    const priority = priorities?.find(p => p._id === issue.priorityId);
    const project = issue.projectId ? projects?.find(p => p._id === issue.projectId) : null;

    // Set up drag functionality.
    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: IssueDragType,
        item: issue,
        collect: (monitor: DragSourceMonitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // Use empty image as drag preview (we'll create a custom one with DragLayer)
    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, [preview]);

    // Set up drop functionality.
    const [, drop] = useDrop(() => ({
        accept: IssueDragType,
    }));

    // Connect drag and drop to the element.
    drag(drop(ref));

    const handleClick = (e: React.MouseEvent) => {
        // Don't open details if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="combobox"]')) {
            return;
        }
        openTaskDetails(issue);
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <motion.div
                    ref={ref}
                    className="w-full p-3 bg-background rounded-md shadow-xs border border-border/50 cursor-pointer hover:shadow-sm transition-shadow"
                    layoutId={`issue-grid-${issue.identifier}`}
                    style={{
                        opacity: isDragging ? 0.5 : 1,
                        cursor: isDragging ? 'grabbing' : 'pointer',
                    }}
                    onClick={handleClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            {priority && <ConstructionPrioritySelector priority={priority} issueId={issue._id} />}
                            <span className="text-xs text-muted-foreground font-medium">
                                {issue.identifier}
                            </span>
                        </div>
                        <ConstructionStatusSelector statusId={issue.statusId} issueId={issue._id} />
                    </div>
                    <h3 className="text-sm font-semibold mb-3 line-clamp-2">{issue.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
                        {taskLabels.length > 0 && <ConstructionLabelBadge labels={taskLabels as any} />}
                        {project && <ConstructionProjectBadge project={project} />}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(issue.createdAt), 'MMM dd')}
                        </span>
                        <ConstructionAssigneeUser user={assignee} />
                    </div>
                </motion.div>
            </ContextMenuTrigger>
            <IssueContextMenu issueId={issue._id} />
        </ContextMenu>
    );
}