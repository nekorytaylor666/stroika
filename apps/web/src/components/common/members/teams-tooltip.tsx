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
	if (teamIds.length === 0) {
		return <span className="text-muted-foreground text-xs">No teams</span>;
	}

	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger className="flex items-center gap-0.5 truncate">
				<ContactRound className="mr-1 size-4 shrink-0 text-muted-foreground" />
				<span className="mt-0.5">
					{teamIds.length} team{teamIds.length !== 1 ? "s" : ""}
				</span>
			</TooltipTrigger>
			<TooltipContent className="p-2">
				<div className="text-xs">
					{teamIds.length} team{teamIds.length !== 1 ? "s" : ""}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
