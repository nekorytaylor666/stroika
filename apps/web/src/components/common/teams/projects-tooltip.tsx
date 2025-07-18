"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Project } from "@/mock-data/projects";
import { Box } from "lucide-react";

interface ProjectsTooltipProps {
	projects: Project[];
}

export function ProjectsTooltip({ projects }: ProjectsTooltipProps) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex cursor-pointer items-center gap-2">
						<Box className="size-4" />
						<span>{projects.length}</span>
					</div>
				</TooltipTrigger>
				<TooltipContent className="p-2">
					<div className="flex flex-col gap-1">
						{projects.map((project, index) => (
							<div key={index} className="flex items-center gap-1.5">
								<project.icon className="size-4 shrink-0" />
								<span className="w-full text-left text-sm">
									{project?.name}
								</span>
								<div className="shrink-0">
									<project.status.icon />
								</div>
							</div>
						))}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
