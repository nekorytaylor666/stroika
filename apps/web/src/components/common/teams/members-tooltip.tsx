"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "@/mock-data/users";

interface MembersTooltipProps {
	members: User[];
}

export function MembersTooltip({ members }: MembersTooltipProps) {
	const displayedMembers = members.slice(0, 3);
	const remainingCount = members.length - displayedMembers.length;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="-space-x-2 flex">
						{displayedMembers.map((member, index) => (
							<Avatar key={index} className="size-6 border-2 border-container">
								<AvatarImage src={member.avatarUrl} alt={member.name} />
								<AvatarFallback className="text-xs">
									{member.name[0]}
								</AvatarFallback>
							</Avatar>
						))}
						{remainingCount > 0 && (
							<div className="z-[5] flex size-6 items-center justify-center rounded-full border-2 border-container bg-sidebar text-xs">
								+{remainingCount}
							</div>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent className="p-2">
					<div className="flex flex-col gap-1">
						{members.map((member, index) => (
							<div key={index} className="flex items-center gap-1.5">
								<Avatar className="size-5">
									<AvatarImage src={member.avatarUrl} alt={member.name} />
									<AvatarFallback className="text-[10px]">
										{member.name[0]}
									</AvatarFallback>
								</Avatar>
								<span className="text-sm">{member.name}</span>
								<span className="mt-[1px] text-muted-foreground text-xs">
									{" "}
									- {member.email}
								</span>
								<span className="mt-[1px] text-muted-foreground text-xs">
									( {member.role} )
								</span>
							</div>
						))}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
