"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { cn } from "@/lib/utils";
import { useConstructionTaskDetailsStore } from "@/store/construction/construction-task-details-store";
import { useFilterStore } from "@/store/filter-store";
import { useSearchStore } from "@/store/search-store";
import { useViewStore } from "@/store/view-store";
import { type FC, useMemo, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { SearchIssues } from "../common/issues/search-issues";
import { ConstructionGroupIssues } from "../common/construction/construction-group-issues";
import { ConstructionCustomDragLayer } from "../common/construction/construction-issue-grid";
import { ConstructionTaskDetails } from "../common/construction/construction-task-details";
import { ProjectTaskCreateModal } from "./project-task-create-modal";
import { useQuery } from "convex/react";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

interface ProjectTasksProps {
  projectId: Id<"constructionProjects">;
}

export default function ProjectTasks({ projectId }: ProjectTasksProps) {
  const { isSearchOpen, searchQuery } = useSearchStore();
  const { viewType } = useViewStore();
  const { hasActiveFilters } = useFilterStore();
  const { isOpen, selectedTask, closeTaskDetails } = useConstructionTaskDetailsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch project-specific tasks
  const projectTasks = useQuery(api.constructionProjects.getTasksForProject, {
    constructionProjectId: projectId
  });

  // Fetch project details
  const project = useQuery(api.constructionProjects.getById, { id: projectId });

  const { statuses } = useConstructionData();

  const isSearching = isSearchOpen && searchQuery.trim() !== "";
  const isViewTypeGrid = viewType === "grid";
  const isFiltering = hasActiveFilters();

  // Override the filters to always filter by this project
  const { setFilter } = useFilterStore();

  useEffect(() => {
    // Set the project filter when component mounts
    setFilter("project", [projectId]);

    // Clear project filter when component unmounts
    return () => {
      setFilter("project", []);
    };
  }, [projectId, setFilter]);

  if (!projectTasks || !statuses) {
    return <ProjectTasksSkeleton />;
  }

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Задачи проекта</h2>
            {project && (
              <p className="text-sm text-muted-foreground">{project.name}</p>
            )}
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Новая задача
          </Button>
        </div>

        {/* Tasks Content */}
        <div className={cn("flex-1 overflow-auto", isViewTypeGrid && "overflow-x-auto")}>
          {isSearching ? (
            <SearchProjectTasksView tasks={projectTasks} />
          ) : isFiltering ? (
            <FilteredProjectTasksView
              tasks={projectTasks}
              isViewTypeGrid={isViewTypeGrid}
            />
          ) : (
            <GroupProjectTasksListView
              tasks={projectTasks}
              isViewTypeGrid={isViewTypeGrid}
            />
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <ProjectTaskCreateModal
        projectId={projectId}
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {/* Task Details */}
      <ConstructionTaskDetails
        task={selectedTask}
        open={isOpen}
        onOpenChange={closeTaskDetails}
      />
    </>
  );
}

const SearchProjectTasksView: FC<{ tasks: any[] }> = ({ tasks }) => {
  const { searchQuery } = useSearchStore();

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.identifier.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  return (
    <div className="mb-6 px-6">
      <SearchIssues />
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          Найдено {filteredTasks.length} задач
        </p>
      </div>
    </div>
  );
};

const FilteredProjectTasksView: FC<{
  tasks: any[];
  isViewTypeGrid: boolean;
}> = ({ tasks, isViewTypeGrid = false }) => {
  const { filters } = useFilterStore();
  const { statuses } = useConstructionData();

  // Apply filters (except project filter since tasks are already project-filtered)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    let result = tasks;

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      result = result.filter((task) => filters.status.includes(task.statusId));
    }

    // Filter by assignee
    if (filters.assignee && filters.assignee.length > 0) {
      result = result.filter((task) => {
        if (filters.assignee.includes("unassigned")) {
          if (!task.assigneeId) return true;
        }
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
        task.labelIds.some((labelId: string) => filters.labels.includes(labelId))
      );
    }

    return result;
  }, [tasks, filters.status, filters.assignee, filters.priority, filters.labels]);

  // Group filtered tasks by status
  const filteredTasksByStatus = useMemo(() => {
    if (!statuses) return {};

    const result: Record<string, any[]> = {};
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
      <ConstructionCustomDragLayer />
      <div className={cn(isViewTypeGrid && "flex h-full min-w-max gap-3 px-2 py-2")}>
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

const GroupProjectTasksListView: FC<{
  tasks: any[];
  isViewTypeGrid: boolean;
}> = ({ tasks, isViewTypeGrid = false }) => {
  const { statuses } = useConstructionData();

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    if (!tasks || !statuses) return {};

    const result: Record<string, any[]> = {};
    for (const statusItem of statuses) {
      result[statusItem._id] = tasks.filter(
        (task) => task.statusId === statusItem._id
      );
    }
    return result;
  }, [tasks, statuses]);

  if (!statuses) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <ConstructionCustomDragLayer />
      <div className={cn(isViewTypeGrid && "flex h-full min-w-max gap-3 px-2 py-2")}>
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

function ProjectTasksSkeleton() {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}