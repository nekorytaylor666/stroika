import { Button } from "@/components/ui/button";
import type { Team } from "@/mock-data/teams";
import { Check } from "lucide-react";
import { MembersTooltip } from "./members-tooltip";
import { ProjectsTooltip } from "./projects-tooltip";

interface TeamLineProps {
	team: Team;
}

export default function TeamLine({ team }: TeamLineProps) {
	return (
		<div className="flex w-full items-center border-muted-foreground/5 border-b px-6 py-3 text-sm hover:bg-sidebar/50">
			<div className="flex w-[70%] items-center gap-2 sm:w-[50%] md:w-[45%] lg:w-[40%]">
				<div className="relative">
					<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
						<div className="text-sm">{team.icon}</div>
					</div>
				</div>
				<div className="flex flex-col items-start overflow-hidden">
					<span className="w-full truncate font-medium">{team.name}</span>
				</div>
			</div>
			<div className="hidden text-muted-foreground text-xs sm:block sm:w-[20%] md:w-[15%]">
				{team.joined && (
					<Button variant="secondary" size="xxs" className="text-xs">
						<Check className="size-4" />
						Joined
					</Button>
				)}
			</div>
			<div className="hidden text-muted-foreground text-xs sm:block sm:w-[20%] md:w-[15%]">
				{team.id}
			</div>
			<div className="flex w-[30%] sm:w-[20%] md:w-[15%]">
				{team.members.length > 0 && <MembersTooltip members={team.members} />}
			</div>
			<div className="hidden text-muted-foreground text-xs sm:flex sm:w-[20%] md:w-[15%]">
				{team.projects.length > 0 && (
					<ProjectsTooltip projects={team.projects} />
				)}
			</div>
		</div>
	);
}
