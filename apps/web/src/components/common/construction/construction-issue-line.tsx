'use client';

import type { ConstructionTask } from './construction-tasks';
import { format } from 'date-fns';
import { ConstructionAssigneeUser } from './construction-assignee-user';
import { ConstructionLabelBadge } from './construction-label-badge';
import { ConstructionPrioritySelector } from './construction-priority-selector';
import { ConstructionProjectBadge } from './construction-project-badge';
import { ConstructionStatusSelector } from './construction-status-selector';
import { motion, AnimatePresence } from 'motion/react';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { IssueContextMenu } from '../issues/issue-context-menu';
import { useConstructionData } from '@/hooks/use-construction-data';
import { useState, useEffect } from 'react';

interface ConstructionIssueLineProps {
    issue: ConstructionTask;
    layoutId?: boolean;
}

export function ConstructionIssueLine({ issue, layoutId = false }: ConstructionIssueLineProps) {
    const { users, labels, priorities, projects } = useConstructionData();
    const [isStatusChanging, setIsStatusChanging] = useState(false);
    const [prevStatusId, setPrevStatusId] = useState(issue.statusId);

    // Detect status changes for animation
    useEffect(() => {
        if (issue.statusId !== prevStatusId) {
            setIsStatusChanging(true);
            setPrevStatusId(issue.statusId);
            
            // Reset animation state after animation completes
            const timer = setTimeout(() => {
                setIsStatusChanging(false);
            }, 600);
            
            return () => clearTimeout(timer);
        }
    }, [issue.statusId, prevStatusId]);

    // Find related entities
    const assignee = issue.assigneeId ? users?.find(u => u._id === issue.assigneeId) : null;
    const taskLabels = issue.labelIds.map(id => labels?.find(l => l._id === id)).filter(Boolean);
    const priority = priorities?.find(p => p._id === issue.priorityId);
    const project = issue.projectId ? projects?.find(p => p._id === issue.projectId) : null;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <motion.div
                    {...(layoutId && { layoutId: `issue-line-${issue.identifier}` })}
                    className="w-full"
                    initial={false}
                    animate={isStatusChanging ? {
                        scale: [1, 1.02, 1],
                        backgroundColor: ['transparent', 'rgba(59, 130, 246, 0.1)', 'transparent'],
                    } : {}}
                    transition={{
                        duration: 0.6,
                        ease: "easeInOut",
                    }}
                >
                    <div className="w-full flex items-center justify-start h-11 px-6 hover:bg-sidebar/50">
                        <div className="flex items-center gap-0.5">
                            {priority && (
                                <ConstructionPrioritySelector priority={priority} issueId={issue._id} />
                            )}
                            <span className="text-sm hidden sm:inline-block text-muted-foreground font-medium w-[66px] truncate shrink-0 mr-0.5">
                                {issue.identifier}
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={issue.statusId}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ConstructionStatusSelector statusId={issue.statusId} issueId={issue._id} />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <span className="min-w-0 flex items-center justify-start mr-1 ml-0.5">
                            <span className="text-xs sm:text-sm font-medium sm:font-semibold truncate">
                                {issue.title}
                            </span>
                        </span>
                        <div className="flex items-center justify-end gap-2 ml-auto sm:w-fit">
                            <div className="w-3 shrink-0"></div>
                            <div className="-space-x-5 hover:space-x-1 lg:space-x-1 items-center justify-end hidden sm:flex duration-200 transition-all">
                                {taskLabels.length > 0 && (
                                    <ConstructionLabelBadge labels={taskLabels as any} />
                                )}
                                {project && <ConstructionProjectBadge project={project} />}
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-block">
                                {format(new Date(issue.createdAt), 'MMM dd')}
                            </span>
                            <ConstructionAssigneeUser user={assignee} />
                        </div>
                    </div>
                </motion.div>
            </ContextMenuTrigger>
            <IssueContextMenu issueId={issue._id} />
        </ContextMenu>
    );
}