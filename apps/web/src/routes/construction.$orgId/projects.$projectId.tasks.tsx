import ConstructionTasks from "@/components/common/construction/construction-tasks";
import { ConstructionFilter } from "@/components/layout/headers/construction/filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { useSearchStore } from "@/store/search-store";
import { useViewStore } from "@/store/view-store";
import type { Id } from "@stroika/backend";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Grid3X3, List, Plus, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute(
	"/construction/$orgId/projects/$projectId/tasks",
)({
	component: ProjectTasksPage,
});

function ProjectTasksPage() {
	const { projectId, orgId } = Route.useParams();
	const { viewType, setViewType } = useViewStore();
	const { openModal } = useCreateIssueStore();
	const { searchQuery, setSearchQuery } = useSearchStore();

	// Convert the string projectId to Convex Id type
	const convexProjectId = projectId as Id<"constructionProjects">;

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="relative flex h-12 items-center justify-between border-b px-6">
				{/* Linear-style gradient border */}
				<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
				<div className="flex items-center gap-4">
					<h1 className="font-semibold text-lg">Задачи</h1>
					<div className="flex items-center gap-1">
						<Button
							size="xs"
							variant={viewType === "list" ? "default" : "ghost"}
							onClick={() => setViewType("list")}
							className="px-2"
						>
							<List className="h-4 w-4" />
						</Button>
						<Button
							size="xs"
							variant={viewType === "grid" ? "default" : "ghost"}
							onClick={() => setViewType("grid")}
							className="px-2"
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
					</div>
					<ConstructionFilter />
				</div>
				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Поиск задач..."
							className="h-8 w-64 pr-3 pl-8"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
							}}
							onFocus={() => {
								const { setIsSearchOpen } = useSearchStore.getState();
								setIsSearchOpen(true);
							}}
							onBlur={(e) => {
								if (e.target.value === "") {
									const { setIsSearchOpen } = useSearchStore.getState();
									setIsSearchOpen(false);
								}
							}}
						/>
					</div>
					<Button
						size="xs"
						onClick={() => openModal({ projectId: convexProjectId })}
					>
						<Plus className="mr-1 h-4 w-4" />
						Новый раздел
					</Button>
				</div>
			</div>

			{/* Tasks content */}
			<div className="flex-1 overflow-hidden">
				<ConstructionTasks />
			</div>
		</div>
	);
}
