"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Plus } from "lucide-react";

export default function HeaderNav() {
	return (
		<div className="flex h-10 w-full items-center justify-between border-b px-6 py-1.5">
			<div className="flex items-center gap-2">
				<SidebarTrigger className="" />
				<div className="flex items-center gap-1">
					<span className="font-medium text-sm">Members</span>
					<span className="rounded-md bg-accent px-1.5 py-1 text-xs"></span>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button className="relative" size="xs" variant="secondary">
					<Plus className="size-4" />
					Invite
				</Button>
			</div>
		</div>
	);
}
