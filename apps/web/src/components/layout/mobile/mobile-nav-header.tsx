"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSearchStore } from "@/store/search-store";
import { useParams, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { OrgSwitcher } from "../sidebar/org-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileNavHeaderProps {
  scrollDirection: "up" | "down";
}

export function MobileNavHeader({ scrollDirection }: MobileNavHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useSearchStore();
  const currentUser = useCurrentUser();
  const params = useParams({ strict: false });
  const router = useRouterState();
  
  // Get current page title based on route
  const getPageTitle = () => {
    const pathname = router.location.pathname;
    
    if (pathname.includes("/tasks")) return "Задачи";
    if (pathname.includes("/construction-projects")) return "Проекты";
    if (pathname.includes("/construction-teams")) return "Команды";
    if (pathname.includes("/inbox")) return "Активность";
    if (pathname.includes("/calendar")) return "Календарь";
    if (pathname.includes("/members")) return "Участники";
    
    // For project-specific pages
    if (pathname.includes("/projects/") && params.projectId) {
      return "Проект"; // You could fetch actual project name here
    }
    
    return "Строительство";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transform transition-transform duration-300",
        scrollDirection === "down" && !isSearchOpen ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="flex h-14 items-center px-4">
        {/* Left side - Menu and Title */}
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {!isSearchOpen && (
            <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
          )}
        </div>

        {/* Search */}
        {isSearchOpen ? (
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="h-8 w-full pl-8 pr-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-left">Меню</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col gap-4 p-4">
            {/* Organization Switcher */}
            <div className="mb-2">
              <OrgSwitcher />
            </div>
            
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-sm">
                    {currentUser.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
            )}
            
            {/* Additional menu items could go here */}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}