"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export default function HeaderNav() {
	return (
		<div className="flex h-10 w-full items-center justify-between border-b px-6 py-1.5">
			<div className="flex items-center gap-2">
				<SidebarTrigger className="" />
				<div className="flex items-center gap-1">
					<span className="font-medium text-sm">Settings</span>
				</div>
			</div>
		</div>
	);
}
