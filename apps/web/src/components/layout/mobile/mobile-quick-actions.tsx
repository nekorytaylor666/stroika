"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConstructionCreateIssueStore } from "@/store/construction/construction-create-issue-store";
import { useParams } from "@tanstack/react-router";
import {
  Building,
  CheckSquare,
  FileText,
  Plus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { ConstructionProjectCreateDialog } from "@/components/common/construction/construction-project-create-dialog";

interface MobileQuickActionsProps {
  scrollDirection: "up" | "down";
}

export function MobileQuickActions({ scrollDirection }: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const { openModal: openTaskModal } = useConstructionCreateIssueStore();
  const params = useParams({ strict: false });

  const quickActions = [
    {
      label: "Новая задача",
      icon: CheckSquare,
      onClick: () => {
        openTaskModal();
        setIsOpen(false);
      },
    },
    {
      label: "Новый проект",
      icon: Building,
      onClick: () => {
        setShowProjectDialog(true);
        setIsOpen(false);
      },
    },
    {
      label: "Добавить документ",
      icon: FileText,
      onClick: () => {
        // TODO: Implement document upload
        console.log("Add document");
        setIsOpen(false);
      },
    },
    {
      label: "Создать команду",
      icon: Users,
      onClick: () => {
        // TODO: Implement team creation
        console.log("Create team");
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className={cn(
              "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
              "transform transition-all duration-300",
              scrollDirection === "down" ? "translate-y-20 scale-90" : "translate-y-0 scale-100",
              isOpen && "rotate-45"
            )}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="w-48 mb-2"
          sideOffset={8}
        >
          {quickActions.map((action, index) => (
            <DropdownMenuItem
              key={action.label}
              onClick={action.onClick}
              className="gap-2"
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ConstructionProjectCreateDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
      />
    </>
  );
}