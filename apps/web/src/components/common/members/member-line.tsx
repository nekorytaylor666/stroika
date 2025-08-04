import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { TeamsTooltip } from "./teams-tooltip";

interface MemberLineProps {
	user: {
		id: string;
		name: string;
		email: string;
		avatarUrl?: string;
		status: string;
		role: string;
		joinedDate: string;
		teamIds: string[];
	};
	memberId: string;
}

export default function MemberLine({ user, memberId }: MemberLineProps) {
	const params = useParams({ from: "/construction/$orgId/members" });

	return (
		<Link
			to="/construction/$orgId/member/$memberId"
			params={{ orgId: params.orgId, memberId }}
			className="flex w-full cursor-pointer items-center border-muted-foreground/5 border-b px-6 py-3 text-sm transition-colors last:border-b-0 hover:bg-sidebar/50"
		>
			<div className="flex w-[70%] items-center gap-2 md:w-[60%] lg:w-[55%]">
				<div className="relative">
					<Avatar className="size-8 shrink-0">
						<AvatarImage src={user.avatarUrl} alt={user.name} />
						<AvatarFallback>{user.name[0]}</AvatarFallback>
					</Avatar>
					<span
						className="-end-0.5 -bottom-0.5 absolute size-2.5 rounded-full border-2 border-background"
						// style={{ backgroundColor: statusUserColors[user.status] }}
					>
						<span className="sr-only">{user.status}</span>
					</span>
				</div>
				<div className="flex flex-col items-start overflow-hidden">
					<span className="w-full truncate font-medium">{user.name}</span>
					<span className="w-full truncate text-muted-foreground text-xs">
						{user.email}
					</span>
				</div>
			</div>
			<div className="w-[30%] text-muted-foreground text-xs md:w-[20%] lg:w-[15%]">
				{user.role}
			</div>
			<div className="hidden w-[15%] text-muted-foreground text-xs lg:block">
				{format(new Date(user.joinedDate), "MMM yyyy")}
			</div>
			<div className="hidden w-[30%] text-muted-foreground text-xs md:flex md:w-[20%] lg:w-[15%]">
				<TeamsTooltip teamIds={user.teamIds} />
			</div>
		</Link>
	);
}
