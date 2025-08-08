"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { useFilterStore } from "@/store/filter-store";
import { useSearchStore } from "@/store/search-store";
import { useParams } from "@tanstack/react-router";
import { MobileTaskList } from "./mobile-task-list";

interface MobileTaskListWrapperProps {
	projectId?: string;
}

export function MobileTaskListWrapper({
	projectId,
}: MobileTaskListWrapperProps) {
	const { tasks, statuses, priorities, users } = useConstructionData();
	const { searchQuery } = useSearchStore();
	const { filters } = useFilterStore();

	if (!tasks || !statuses || !priorities || !users) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<div className="animate-pulse">
						<div className="mb-2 h-8 w-32 rounded bg-muted" />
						<div className="h-4 w-48 rounded bg-muted" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<MobileTaskList
			tasks={tasks}
			statuses={statuses}
			priorities={priorities}
			users={users}
			projectId={projectId}
			searchQuery={searchQuery}
			filters={filters}
		/>
	);
}
