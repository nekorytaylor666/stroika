"use client";

import { cn } from "@/lib/utils";
import { useFilterStore } from "@/store/filter-store";
import { useIssuesStore } from "@/store/issues-store";
import { useSearchStore } from "@/store/search-store";
import { useViewStore } from "@/store/view-store";
import { type FC, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GroupIssues } from "./group-issues";
import { CustomDragLayer } from "./issue-grid";
import { SearchIssues } from "./search-issues";

export default function AllIssues() {
	const { isSearchOpen, searchQuery } = useSearchStore();
	const { viewType } = useViewStore();
	const { hasActiveFilters } = useFilterStore();

	const isSearching = isSearchOpen && searchQuery.trim() !== "";
	const isViewTypeGrid = viewType === "grid";
	const isFiltering = hasActiveFilters();

	return (
		<div className={cn("h-full w-full", isViewTypeGrid && "overflow-x-auto")}>
			{isSearching ? (
				<SearchIssuesView />
			) : isFiltering ? (
				<FilteredIssuesView isViewTypeGrid={isViewTypeGrid} />
			) : (
				<GroupIssues />
			)}
		</div>
	);
}

const SearchIssuesView = () => (
	<div className="mb-6 px-6">
		<SearchIssues />
	</div>
);

const FilteredIssuesView: FC<{
	isViewTypeGrid: boolean;
}> = ({ isViewTypeGrid = false }) => {
	const { filters } = useFilterStore();
	const { issues } = useIssuesStore();

	// Apply filters to get filtered issues
	const filteredIssues = useMemo(() => {
		let result = issues;

		// Filter by status
		if (filters.status && filters.status.length > 0) {
			result = result.filter((issuesdf) =>
				filters.status.includes(issue.status.id),
			);
		}

		// Filter by assignee
		if (filters.assignee && filters.assignee.length > 0) {
			result = result.filter((issue) => {
				if (filters.assignee.includes("unassigned")) {
					// If 'unassigned' is selected and the issue has no assignee
					if (issue.assignee === null) {
						return true;
					}
				}
				// Check if the issue's assignee is in the selected assignees
				return issue.assignee && filters.assignee.includes(issue.assignee.id);
			});
		}

		// Filter by priority
		if (filters.priority && filters.priority.length > 0) {
			result = result.filter((issue) =>
				filters.priority.includes(issue.priority.id),
			);
		}

		// Filter by labels
		if (filters.labels && filters.labels.length > 0) {
			result = result.filter((issue) =>
				issue.labels.some((label) => filters.labels.includes(label.id)),
			);
		}

		// Filter by project
		if (filters.project && filters.project.length > 0) {
			result = result.filter(
				(issue) => issue.project && filters.project.includes(issue.project.id),
			);
		}

		return result;
	}, [
		issues,
		filters.status,
		filters.assignee,
		filters.priority,
		filters.labels,
		filters.project,
	]);

	// Group filtered issues by status
	const filteredIssuesByStatus = useMemo(() => {
		const result: Record<string, any[]> = {};

		for (const statusItem of statuses) {
			result[statusItem.id] = filteredIssues.filter(
				(issue) => issue.status.id === statusItem.id,
			);
		}

		return result;
	}, [filteredIssues]);

	return (
		<DndProvider backend={HTML5Backend}>
			<CustomDragLayer />
			<div
				className={cn(
					isViewTypeGrid && "flex h-full min-w-max gap-3 px-2 py-2",
				)}
			>
				{status.map((statusItem) => (
					<GroupIssues
						key={statusItem.id}
						status={statusItem}
						issues={filteredIssuesByStatus[statusItem.id] || []}
						count={filteredIssuesByStatus[statusItem.id]?.length || 0}
					/>
				))}
			</div>
		</DndProvider>
	);
};
