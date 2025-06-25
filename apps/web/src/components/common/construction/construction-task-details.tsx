'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Copy,
    Link2,
    MessageSquare,
    Clock,
    Calendar,
    User,
    Tag,
    FileText,
    MoreHorizontal,
    ChevronRight,
    Plus,
    Paperclip,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useConstructionData } from '@/hooks/use-construction-data';
import { ConstructionStatusSelector } from './construction-status-selector';
import { ConstructionPrioritySelector } from './construction-priority-selector';
import { ConstructionAssigneeUser } from './construction-assignee-user';
import type { ConstructionTask } from './construction-tasks';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ConstructionTaskDetailsProps {
    task: ConstructionTask | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConstructionTaskDetails({ task, open, onOpenChange }: ConstructionTaskDetailsProps) {
    const { users, priorities, labels, projects, updateTask } = useConstructionData();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
        }
    }, [task]);

    if (!task) return null;

    const assignee = task.assigneeId ? users?.find(u => u._id === task.assigneeId) : null;
    const priority = priorities?.find(p => p._id === task.priorityId);
    const taskLabels = task.labelIds.map(id => labels?.find(l => l._id === id)).filter(Boolean);
    const project = task.projectId ? projects?.find(p => p._id === task.projectId) : null;

    const handleTitleSave = async () => {
        if (title !== task.title && updateTask) {
            await updateTask({ id: task._id, title });
        }
        setIsEditingTitle(false);
    };

    const handleDescriptionSave = async () => {
        if (description !== task.description && updateTask) {
            await updateTask({ id: task._id, description });
        }
        setIsEditingDescription(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/task/${task.identifier}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="h-[85vh] !max-w-6xl w-full gap-0 overflow-hidden p-0 flex flex-col" hideCloseButton>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            {priority && (
                                <ConstructionPrioritySelector priority={priority} issueId={task._id} />
                            )}
                        </motion.div>
                        <span className="text-sm text-muted-foreground font-mono">
                            {task.identifier}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                            <Link2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Дублировать</DropdownMenuItem>
                                <DropdownMenuItem>Переместить</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                {isEditingTitle ? (
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleTitleSave();
                                            if (e.key === 'Escape') {
                                                setTitle(task.title);
                                                setIsEditingTitle(false);
                                            }
                                        }}
                                        className="text-2xl font-semibold border-none px-0 h-auto"
                                        autoFocus
                                    />
                                ) : (
                                    <h2
                                        className="text-2xl font-semibold cursor-text hover:bg-muted/50 rounded px-2 -mx-2 py-1"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        {title}
                                    </h2>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Описание</span>
                                </div>
                                {isEditingDescription ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="min-h-[100px] resize-none"
                                            placeholder="Добавьте описание..."
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleDescriptionSave}>
                                                Сохранить
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setDescription(task.description);
                                                    setIsEditingDescription(false);
                                                }}
                                            >
                                                Отмена
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="min-h-[60px] cursor-text hover:bg-muted/50 rounded p-3"
                                        onClick={() => setIsEditingDescription(true)}
                                    >
                                        {description || (
                                            <span className="text-muted-foreground">
                                                Нажмите для добавления описания...
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Comments Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Комментарии</span>
                                </div>

                                {/* Comment Input */}
                                <div className="flex gap-3 mb-4">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="/api/placeholder/32/32" />
                                        <AvatarFallback>ME</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Написать комментарий..."
                                            className="min-h-[80px] resize-none"
                                        />
                                        {comment && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setComment('')}
                                                >
                                                    Отмена
                                                </Button>
                                                <Button size="sm">
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Отправить
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/api/placeholder/32/32" />
                                            <AvatarFallback>АИ</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">Александр Иванов</span>
                                                <span className="text-xs text-muted-foreground">2 часа назад</span>
                                            </div>
                                            <p className="text-sm">Начал работу над задачей</p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 border-l bg-muted/30 p-4 space-y-4 overflow-y-auto">
                        {/* Status */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Статус
                            </label>
                            <ConstructionStatusSelector statusId={task.statusId} issueId={task._id} />
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Исполнитель
                            </label>
                            <Button variant="ghost" className="w-full justify-start h-8 px-2">
                                {assignee ? (
                                    <>
                                        <ConstructionAssigneeUser user={assignee} />
                                        <span className="ml-2 text-sm">{assignee.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4 mr-2" />
                                        <span className="text-sm text-muted-foreground">Не назначен</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Приоритет
                            </label>
                            <Button variant="ghost" className="w-full justify-start h-8 px-2">
                                {priority && (
                                    <>
                                        <ConstructionPrioritySelector priority={priority} issueId={task._id} />
                                        <span className="ml-2 text-sm">{priority.name}</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Срок выполнения
                            </label>
                            <Button variant="ghost" className="w-full justify-start h-8 px-2">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="text-sm">
                                    {task.dueDate
                                        ? format(new Date(task.dueDate), 'd MMM', { locale: ru })
                                        : 'Не указан'
                                    }
                                </span>
                            </Button>
                        </div>

                        {/* Labels */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                Метки
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {taskLabels.map((label: any) => (
                                    <span
                                        key={label._id}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs"
                                        style={{
                                            backgroundColor: `${label.color}20`,
                                            color: label.color,
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                ))}
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Project */}
                        {project && (
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Проект
                                </label>
                                <Button variant="ghost" className="w-full justify-start h-8 px-2">
                                    <span className="text-sm">{project.name}</span>
                                </Button>
                            </div>
                        )}

                        <Separator />

                        {/* Activity */}
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                Активность
                            </label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Создано</span>
                                    <span>{format(new Date(task.createdAt), 'd MMM yyyy', { locale: ru })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}