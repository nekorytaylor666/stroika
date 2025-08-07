"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { Building, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ConstructionProjectCreateDialog } from "../construction-project-create-dialog";
import { MobileProjectCard } from "./mobile-project-card";

export function MobileProjectList() {
  const projects = useQuery(api.constructionProjects.getAll);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.customer?.toLowerCase().includes(query) ||
        project.manager?.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  if (!projects) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">
          Загружаем проекты...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск проектов..."
            className="pl-9 pr-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <MobileProjectCard key={project._id} project={project} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "Проекты не найдены" : "Нет проектов"}
            </p>
            {!searchQuery && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="mt-2"
              >
                Создать первый проект
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Create Project Dialog */}
      <ConstructionProjectCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}