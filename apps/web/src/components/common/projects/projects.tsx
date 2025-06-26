"use client";

import ProjectLine from "@/components/common/projects/project-line";

export default function Projects() {
	return (
		<div className="w-full">
			<div className="sticky top-0 z-10 flex items-center border-b bg-container px-6 py-1.5 text-muted-foreground text-sm">
				<div className="w-[60%] sm:w-[70%] xl:w-[46%]">Title</div>
				<div className="w-[20%] pl-2.5 sm:w-[10%] xl:w-[13%]">Health</div>
				<div className="hidden w-[10%] pl-2 sm:block">Priority</div>
				<div className="hidden pl-2 xl:block xl:w-[13%]">Lead</div>
				<div className="hidden pl-2.5 xl:block xl:w-[13%]">Target date</div>
				<div className="w-[20%] pl-2 sm:w-[10%]">Status</div>
			</div>

			<div className="w-full">

			</div>
		</div>
	);
}
