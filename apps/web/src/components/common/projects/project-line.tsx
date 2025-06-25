import type { Project } from "@/mock-data/projects";
import { DatePicker } from "./date-picker";
import { HealthPopover } from "./health-popover";
import { LeadSelector } from "./lead-selector";
import { PrioritySelector } from "./priority-selector";
import { StatusWithPercent } from "./status-with-percent";

interface ProjectLineProps {
	project: Project;
}

export default function ProjectLine({ project }: ProjectLineProps) {
	return (
		<div className="flex w-full items-center border-muted-foreground/5 border-b px-6 py-3 text-sm hover:bg-sidebar/50">
			<div className="flex w-[60%] items-center gap-2 sm:w-[70%] xl:w-[46%]">
				<div className="relative">
					<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
						<project.icon className="size-4" />
					</div>
				</div>
				<div className="flex flex-col items-start overflow-hidden">
					<span className="w-full truncate font-medium">{project.name}</span>
				</div>
			</div>

			<div className="w-[20%] sm:w-[10%] xl:w-[13%]">
				<HealthPopover project={project} />
			</div>

			<div className="hidden w-[10%] sm:block">
				<PrioritySelector priority={project.priority} />
			</div>
			<div className="hidden xl:block xl:w-[13%]">
				<LeadSelector lead={project.lead} />
			</div>

			<div className="hidden xl:block xl:w-[13%]">
				<DatePicker
					date={project.startDate ? new Date(project.startDate) : undefined}
				/>
			</div>

			<div className="w-[20%] sm:w-[10%]">
				<StatusWithPercent
					status={project.status}
					percentComplete={project.percentComplete}
				/>
			</div>
		</div>
	);
}
