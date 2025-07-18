"use client";

import { useConstructionData } from "@/hooks/use-construction-data";
import { useSearchStore } from "@/store/search-store";
import type { Id } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConstructionIssueLine } from "./construction-issue-line";
import type { ConstructionTask } from "./construction-tasks";

export function SearchConstructionTasks() {
	const [searchResults, setSearchResults] = useState<ConstructionTask[]>([]);
	const { tasks } = useConstructionData();
	const { searchQuery, isSearchOpen } = useSearchStore();

	// Get projectId from route params to filter tasks
	const params = useParams({ strict: false });
	const currentProjectId = (params as any)?.projectId as
		| Id<"constructionProjects">
		| undefined;

	useEffect(() => {
		if (!tasks || searchQuery.trim() === "") {
			setSearchResults([]);
			return;
		}

		// Filter by current project if we're in a project view
		const projectTasks = currentProjectId
			? tasks.filter((task) => task.projectId === currentProjectId)
			: tasks;

		const query = searchQuery.toLowerCase();
		const results = projectTasks.filter((task) => {
			return (
				task.title.toLowerCase().includes(query) ||
				task.identifier.toLowerCase().includes(query) ||
				task.description?.toLowerCase().includes(query)
			);
		});

		setSearchResults(results);
	}, [searchQuery, tasks, currentProjectId]);

	if (!isSearchOpen) {
		return null;
	}

	return (
		<div className="w-full">
			{searchQuery.trim() !== "" && (
				<div>
					{searchResults.length > 0 ? (
						<div className="mt-4 rounded-md border">
							<div className="border-b bg-muted/50 px-4 py-2">
								<h3 className="font-medium text-sm">
									Результаты ({searchResults.length})
								</h3>
							</div>
							<div className="divide-y">
								{searchResults.map((task) => (
									<ConstructionIssueLine
										key={task._id}
										issue={task}
										layoutId={false}
									/>
								))}
							</div>
						</div>
					) : (
						<div className="py-8 text-center text-muted-foreground">
							Ничего не найдено по запросу &quot;{searchQuery}&quot;
						</div>
					)}
				</div>
			)}
		</div>
	);
}
