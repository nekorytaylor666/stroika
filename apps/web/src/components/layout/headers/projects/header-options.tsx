"use client";

import { Button } from "@/components/ui/button";
import { ListFilter, SlidersHorizontal } from "lucide-react";

export default function HeaderOptions() {
	return (
		<div className="flex h-10 w-full items-center justify-between border-b px-6 py-1.5">
			<Button size="xs" variant="ghost">
				<ListFilter className="size-4" />
				<span className="ml-1 hidden sm:inline">Filter</span>
			</Button>
			<Button className="relative" size="xs" variant="secondary">
				<SlidersHorizontal className="size-4" />
				<span className="ml-1 hidden sm:inline">Display</span>
			</Button>
		</div>
	);
}
