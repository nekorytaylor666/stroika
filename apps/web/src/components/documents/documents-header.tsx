"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDocumentsStore } from "@/store/documents-store";
import {
	Filter,
	LayoutGrid,
	LayoutList,
	Plus,
	Search,
	Square,
} from "lucide-react";
import { motion } from "motion/react";

export function DocumentsHeader() {
	const {
		viewMode,
		setViewMode,
		searchQuery,
		setSearchQuery,
		setIsCreateModalOpen,
		filters,
	} = useDocumentsStore();

	const activeFiltersCount =
		filters.status.length + filters.assignee.length + filters.tags.length;

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="border-gray-200 border-b px-6 py-4 dark:border-gray-800"
		>
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl text-gray-900 dark:text-gray-100">
						Documents
					</h1>
					<p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
						Manage and collaborate on project documents
					</p>
				</div>
				<Button
					onClick={() => setIsCreateModalOpen(true)}
					className="bg-blue-600 text-white hover:bg-blue-700"
				>
					<Plus className="mr-2 h-4 w-4" />
					New Document
				</Button>
			</div>

			<div className="flex items-center gap-4">
				<div className="relative max-w-md flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search documents..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10"
					/>
				</div>

				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Filter className="mr-2 h-4 w-4" />
								Filter
								{activeFiltersCount > 0 && (
									<Badge
										variant="secondary"
										className="ml-2 h-5 px-1.5 text-xs"
									>
										{activeFiltersCount}
									</Badge>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuItem>
								<span className="font-medium text-sm">Status</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<span className="font-medium text-sm">Assignee</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<span className="font-medium text-sm">Tags</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<div className="flex items-center rounded-md bg-gray-100 p-1 dark:bg-gray-800">
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="h-7 px-2"
						>
							<LayoutList className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="h-7 px-2"
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "board" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("board")}
							className="h-7 px-2"
						>
							<Square className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
