'use client';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useConstructionData } from '@/hooks/use-construction-data';
import { CheckIcon, Circle, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useId, useState, type FC } from 'react';
import { motion } from 'motion/react';
import type { Id } from "../../../../../../packages/backend/convex/_generated/dataModel";

interface ConstructionStatusSelectorProps {
    statusId: string;
    issueId: string;
}

// Status icon mapping
const StatusIconMap = {
    'circle': Circle,
    'timer': Clock,
    'alert-circle': AlertCircle,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
};

const StatusIcon: FC<{ iconName: string; color?: string }> = ({ iconName, color }) => {
    const IconComponent = StatusIconMap[iconName as keyof typeof StatusIconMap] || Circle;
    return <IconComponent style={color ? { color } : undefined} className="w-3.5 h-3.5" />;
};

export function ConstructionStatusSelector({ statusId, issueId }: ConstructionStatusSelectorProps) {
    const id = useId();
    const [open, setOpen] = useState<boolean>(false);
    const [value, setValue] = useState<string>(statusId);
    const { statuses, updateTaskStatus, tasks } = useConstructionData();

    useEffect(() => {
        setValue(statusId);
    }, [statusId]);

    const handleStatusChange = async (newStatusId: string) => {
        setValue(newStatusId);
        setOpen(false);

        if (issueId && newStatusId !== statusId) {
            try {
                await updateTaskStatus({
                    id: issueId as Id<"issues">,
                    statusId: newStatusId as Id<"status">
                });
            } catch (error) {
                console.error('Failed to update status:', error);
                // Revert on error
                setValue(statusId);
            }
        }
    };

    const currentStatus = statuses?.find(s => s._id === value);

    // Count tasks by status
    const getStatusCount = (statusId: string) => {
        return tasks?.filter(task => task.statusId === statusId).length || 0;
    };

    return (
        <div className="*:not-first:mt-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        className="size-7 flex items-center justify-center"
                        size="icon"
                        variant="ghost"
                        role="combobox"
                        aria-expanded={open}
                    >
                        <motion.div
                            key={value}
                            initial={{ scale: 0.8, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentStatus && (
                                <StatusIcon iconName={currentStatus.iconName} color={currentStatus.color} />
                            )}
                        </motion.div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder="Выберите статус..." />
                        <CommandList>
                            <CommandEmpty>Статус не найден.</CommandEmpty>
                            <CommandGroup>
                                {statuses?.map((item) => (
                                    <CommandItem
                                        key={item._id}
                                        value={item._id}
                                        onSelect={handleStatusChange}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <StatusIcon iconName={item.iconName} color={item.color} />
                                            {item.name}
                                        </div>
                                        {value === item._id && <CheckIcon size={16} className="ml-auto" />}
                                        <span className="text-muted-foreground text-xs">
                                            {getStatusCount(item._id)}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}