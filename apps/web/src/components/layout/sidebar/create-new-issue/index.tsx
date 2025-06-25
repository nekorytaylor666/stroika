import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RiEditLine } from '@remixicon/react';
import { useState, useEffect, useCallback } from 'react';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { useConstructionData } from '@/hooks/use-construction-data';
import { toast } from 'sonner';
import { StatusSelector } from './status-selector';
import { PrioritySelector } from './priority-selector';
import { AssigneeSelector } from './assignee-selector';
import { ProjectSelector } from './project-selector';
import { LabelSelector } from './label-selector';
import { DialogTitle } from '@radix-ui/react-dialog';
import type { Id } from '../../../../../../packages/backend/convex/_generated/dataModel';

interface ConstructionTaskForm {
   identifier: string;
   title: string;
   description: string;
   statusId: Id<"status"> | null;
   assigneeId: Id<"users"> | null;
   priorityId: Id<"priorities"> | null;
   labelIds: Id<"labels">[];
   cycleId: string;
   projectId: Id<"projects"> | null;
   rank: string;
   dueDate?: string;
}

export function CreateNewIssue() {
   const [createMore, setCreateMore] = useState<boolean>(false);
   const { isOpen, defaultStatus, openModal, closeModal } = useCreateIssueStore();
   const {
      createTask,
      statuses,
      priorities,
      labels,
      users,
      projects,
      tasks,
      isLoading
   } = useConstructionData();

   const generateUniqueIdentifier = useCallback(() => {
      const identifiers = tasks?.map((task) => task.identifier) || [];
      let identifier = Math.floor(Math.random() * 999)
         .toString()
         .padStart(3, '0');
      while (identifiers.includes(`СТРФ-${identifier}`)) {
         identifier = Math.floor(Math.random() * 999)
            .toString()
            .padStart(3, '0');
      }
      return identifier;
   }, [tasks]);

   const createDefaultData = useCallback((): ConstructionTaskForm => {
      const identifier = generateUniqueIdentifier();
      const defaultStatusId = defaultStatus
         ? (statuses?.find(s => s.name === defaultStatus) || statuses?.[0])
         : statuses?.[0];
      const defaultPriorityId = priorities?.find((p) => p.name === 'Средний') || priorities?.[0];

      return {
         identifier: `СТРФ-${identifier}`,
         title: '',
         description: '',
         statusId: defaultStatusId?._id || null,
         assigneeId: null,
         priorityId: defaultPriorityId?._id || null,
         labelIds: [],
         cycleId: 'cycle-1',
         projectId: null,
         rank: `rank-${Date.now()}`,
      };
   }, [defaultStatus, generateUniqueIdentifier, statuses, priorities]);

   const [addTaskForm, setAddTaskForm] = useState<ConstructionTaskForm>(createDefaultData());

   useEffect(() => {
      setAddTaskForm(createDefaultData());
   }, [createDefaultData]);

   const createConstructionTask = async () => {
      if (!addTaskForm.title.trim()) {
         toast.error('Название обязательно');
         return;
      }

      if (!addTaskForm.statusId || !addTaskForm.priorityId) {
         toast.error('Статус и приоритет обязательны');
         return;
      }

      try {
         await createTask({
            identifier: addTaskForm.identifier,
            title: addTaskForm.title.trim(),
            description: addTaskForm.description.trim(),
            statusId: addTaskForm.statusId,
            assigneeId: addTaskForm.assigneeId || undefined,
            priorityId: addTaskForm.priorityId,
            labelIds: addTaskForm.labelIds,
            cycleId: addTaskForm.cycleId,
            projectId: addTaskForm.projectId || undefined,
            rank: addTaskForm.rank,
            dueDate: addTaskForm.dueDate,
         });

         toast.success('Задача создана');

         if (!createMore) {
            closeModal();
         }
         setAddTaskForm(createDefaultData());
      } catch (error) {
         console.error('Failed to create task:', error);
         toast.error('Ошибка при создании задачи');
      }
   };

   // Show loading state while data is loading
   if (isLoading) {
      return null;
   }

   return (
      <Dialog open={isOpen} onOpenChange={(value) => (value ? openModal() : closeModal())}>
         <DialogTrigger asChild>
            <Button className="size-8 shrink-0" variant="secondary" size="icon">
               <RiEditLine />
            </Button>
         </DialogTrigger>
         <DialogContent className="w-full sm:max-w-[750px] p-0 shadow-xl top-[30%]">
            <DialogHeader>
               <DialogTitle>
                  <div className="flex items-center px-4 pt-4 gap-2">
                     <Button size="sm" variant="outline" className="gap-1.5">
                        <Heart className="size-4 text-orange-500 fill-orange-500" />
                        <span className="font-medium">СТРОИТЕЛЬСТВО</span>
                     </Button>
                  </div>
               </DialogTitle>
            </DialogHeader>

            <div className="px-4 pb-0 space-y-3 w-full">
               <Input
                  className="border-none w-full shadow-none outline-none text-2xl font-medium px-0 h-auto focus-visible:ring-0 overflow-hidden text-ellipsis whitespace-normal break-words"
                  placeholder="Название задачи"
                  value={addTaskForm.title}
                  onChange={(e) => setAddTaskForm({ ...addTaskForm, title: e.target.value })}
               />

               <Textarea
                  className="border-none w-full shadow-none outline-none resize-none px-0 min-h-16 focus-visible:ring-0 break-words whitespace-normal overflow-wrap"
                  placeholder="Добавить описание..."
                  value={addTaskForm.description}
                  onChange={(e) =>
                     setAddTaskForm({ ...addTaskForm, description: e.target.value })
                  }
               />

               <div className="w-full flex items-center justify-start gap-1.5 flex-wrap">
                  <StatusSelector
                     status={statuses?.find(s => s._id === addTaskForm.statusId) || null}
                     onChange={(newStatus) =>
                        setAddTaskForm({ ...addTaskForm, statusId: newStatus?._id || null })
                     }
                  />
                  <PrioritySelector
                     priority={priorities?.find(p => p._id === addTaskForm.priorityId) || null}
                     onChange={(newPriority) =>
                        setAddTaskForm({ ...addTaskForm, priorityId: newPriority?._id || null })
                     }
                  />
                  <AssigneeSelector
                     assignee={users?.find(u => u._id === addTaskForm.assigneeId) || null}
                     onChange={(newAssignee) =>
                        setAddTaskForm({ ...addTaskForm, assigneeId: newAssignee?._id || null })
                     }
                  />
                  <ProjectSelector
                     project={projects?.find(p => p._id === addTaskForm.projectId) || null}
                     onChange={(newProject) =>
                        setAddTaskForm({ ...addTaskForm, projectId: newProject?._id || null })
                     }
                  />
                  <LabelSelector
                     selectedLabels={labels?.filter(l => addTaskForm.labelIds.includes(l._id)) || []}
                     onChange={(newLabels) =>
                        setAddTaskForm({ ...addTaskForm, labelIds: newLabels.map(l => l._id) })
                     }
                  />
               </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-4 w-full border-t">
               <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                     <Switch
                        id="create-more"
                        checked={createMore}
                        onCheckedChange={setCreateMore}
                     />
                     <Label htmlFor="create-more">Создать ещё</Label>
                  </div>
               </div>
               <Button
                  size="sm"
                  onClick={createConstructionTask}
                  disabled={isLoading}
               >
                  Создать задачу
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
