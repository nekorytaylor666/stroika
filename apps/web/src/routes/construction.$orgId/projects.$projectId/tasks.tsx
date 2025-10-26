import { ConstructionTasksContainer } from "@/components/common/construction/construction-tasks";
import { ConstructionFilter } from "@/components/layout/headers/construction/filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Loader from "@/components/loader";
import { useMobile } from "@/hooks/use-mobile";
import { useProjectPermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";
import { useCreateIssueStore } from "@/store/create-issue-store";
import { useSearchStore } from "@/store/search-store";
import { useViewStore } from "@/store/view-store";
import type { Id } from "@stroika/backend";
import { createFileRoute } from "@tanstack/react-router";
import { Grid3X3, List, Plus, Search, Lock } from "lucide-react";

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
	const isMobile = useMobile();

	// Convert the string projectId to Convex Id type
	const convexProjectId = projectId as Id<"constructionProjects">;

	// Check permissions
	const permissions = useProjectPermissions(projectId);

	// Loading state
	if (!permissions) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader />
			</div>
		);
	}

	// Check if user can read tasks
	if (!permissions.canReadTasks) {
		return (
			<div className="h-full bg-background p-6">
				<div className="mx-auto max-w-7xl">
					<Alert className="mx-auto mt-20 max-w-md">
						<Lock className="h-4 w-4" />
						<AlertDescription>
							У вас нет доступа к задачам этого проекта. Обратитесь к
							администратору проекта для получения доступа.
						</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div
				className={cn(
					"relative flex items-center justify-between border-b",
					isMobile ? "h-14 px-4" : "h-12 px-6",
				)}
			>
				{/* Linear-style gradient border */}
				<div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

				{isMobile ? (
					// Mobile header
					<>
						<h1 className="font-semibold text-base">Задачи проекта</h1>
						<div className="flex items-center gap-2">
							<Button
								size="icon"
								variant="ghost"
								onClick={() => {
									const { setIsSearchOpen } = useSearchStore.getState();
									setIsSearchOpen(true);
								}}
								className="h-8 w-8"
							>
								<Search className="h-4 w-4" />
							</Button>
						</div>
					</>
				) : (
					// Desktop header
					<>
						<div className="flex items-center gap-4">
							<h1 className="font-semibold text-lg">Задачи</h1>
							<div className="flex items-center gap-1">
								<Button
									size="sm"
									variant={viewType === "list" ? "default" : "ghost"}
									onClick={() => setViewType("list")}
									className="px-2"
								>
									<List className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
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
							{permissions.canCreateTasks && (
								<Button
									size="sm"
									onClick={() => openModal({ projectId: convexProjectId })}
								>
									<Plus className="mr-1 h-4 w-4" />
									Новый раздел
								</Button>
							)}
						</div>
					</>
				)}
			</div>

			{/* Tasks content */}
			<div className="flex-1 overflow-hidden">
				<ConstructionTasksContainer projectId={projectId} />
			</div>
		</div>
	);
}
