"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type ViewType, useViewStore } from "@/store/view-store";
import { LayoutGrid, LayoutList, SlidersHorizontal } from "lucide-react";
import { Filter } from "./filter";

export default function HeaderOptions() {
	const { viewType, setViewType } = useViewStore();

	const handleViewChange = (type: ViewType) => {
		setViewType(type);
	};

	return (
		<div className="flex h-10 w-full items-center justify-between border-b px-6 py-1.5">
			<Filter />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="relative" size="xs" variant="secondary">
						<SlidersHorizontal className="mr-1 size-4" />
						Отображение
						{viewType === "grid" && (
							<span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="flex w-72 gap-2 p-3" align="end">
					<DropdownMenuItem
						onClick={() => handleViewChange("list")}
						className={cn(
							"flex w-full flex-col gap-1 border border-accent text-xs",
							viewType === "list" ? "bg-accent" : "",
						)}
					>
						<LayoutList className="size-4" />
						Список
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => handleViewChange("grid")}
						className={cn(
							"flex w-full flex-col gap-1 border border-accent text-xs",
							viewType === "grid" ? "bg-accent" : "",
						)}
					>
						<LayoutGrid className="size-4" />
						Доска
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
