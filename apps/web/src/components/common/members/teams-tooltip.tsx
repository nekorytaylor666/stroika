import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContactRound } from "lucide-react";

interface TeamsTooltipProps {
	teamIds: string[];
}

export function TeamsTooltip({ teamIds }: TeamsTooltipProps) {
	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger className="flex items-center gap-0.5 truncate">
				<ContactRound className="mr-1 size-4 shrink-0 text-muted-foreground" />
				{teamIds.slice(0, 2).map((teamId, index) => (
					<span key={teamId} className="mt-0.5">
						{teamId}
						{index < Math.min(teamIds.length, 2) - 1 && ", "}
					</span>
				))}
				{teamIds.length > 2 && (
					<span className="mt-0.5">+ {teamIds.length - 2}</span>
				)}
			</TooltipTrigger>
			<TooltipContent className="p-2">
				<div className="flex flex-col gap-1">
					{teams
						.filter((team) => teamIds.includes(team.id))
						.map((team) => (
							<div key={team.id} className="flex items-center gap-2 text-xs">
								<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
									<div className="text-sm">{team.icon}</div>
								</div>
								<span className="font-medium">{team.name}</span>
							</div>
						))}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
