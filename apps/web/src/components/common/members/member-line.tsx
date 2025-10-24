import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import MemberActionsDropdown from "./member-actions-dropdown";
import { TeamsTooltip } from "./teams-tooltip";

interface MemberLineProps {
	user: {
		id: string;
		name: string;
		email: string;
		avatarUrl?: string;
		status: string;
		role: string;
		roleId: string;
		joinedDate: string;
		teamIds: string[];
	};
	memberId: string;
}

export default function MemberLine({ user, memberId }: MemberLineProps) {
	const params = useParams({ from: "/construction/$orgId/members" });

	// Get current user to check if this is the current user
	const currentUser = useQuery(api.users.getCurrentUser);
	const isCurrentUser = currentUser?._id === user.id;

	return (
		<div className="flex w-full items-center border-muted-foreground/5 border-b px-6 py-3 text-sm transition-colors last:border-b-0 hover:bg-sidebar/50">
			<Link
				to="/construction/$orgId/member/$memberId"
				params={{ orgId: params.orgId, memberId }}
				className="flex flex-1 cursor-pointer items-center"
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
			<div className="ml-2">
				<MemberActionsDropdown
					memberId={memberId as Id<"organizationMembers">}
					userId={user.id as Id<"users">}
					userName={user.name}
					userEmail={user.email}
					currentRoleId={user.roleId as Id<"roles">}
					organizationId={params.orgId as Id<"organizations">}
					isCurrentUser={isCurrentUser}
				/>
			</div>
		</div>
	);
}
