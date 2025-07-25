"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { CheckIcon, CircleUserRound, Send, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface AssigneeUserProps {
	user: User | null;
}

export function AssigneeUser({ user }: AssigneeUserProps) {
	const [open, setOpen] = useState(false);
	const [currentAssignee, setCurrentAssignee] = useState<User | null>(user);
	const users = useQuery(api.users.getAll);

	useEffect(() => {
		setCurrentAssignee(user);
	}, [user]);

	const renderAvatar = () => {
		if (currentAssignee) {
			return (
				<Avatar className="size-6 shrink-0">
					<AvatarImage
						src={currentAssignee.avatarUrl}
						alt={currentAssignee.name}
					/>
					<AvatarFallback>{currentAssignee.name[0]}</AvatarFallback>
				</Avatar>
			);
		} else {
			return (
				<div className="flex size-6 items-center justify-center">
					<CircleUserRound className="size-5 text-zinc-600" />
				</div>
			);
		}
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<button className="relative w-fit focus:outline-none">
					{renderAvatar()}
					{currentAssignee && (
						<span
							className="-end-0.5 -bottom-0.5 absolute size-2.5 rounded-full border-2 border-background"
							style={{
								backgroundColor: "#000",
							}}
						>
							<span className="sr-only">{currentAssignee.status}</span>
						</span>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[206px]">
				<DropdownMenuLabel>Assign to...</DropdownMenuLabel>
				<DropdownMenuItem
					onClick={(e) => {
						e.stopPropagation();
						setCurrentAssignee(null);
						setOpen(false);
					}}
				>
					<div className="flex items-center gap-2">
						<UserIcon className="h-5 w-5" />
						<span>No assignee</span>
					</div>
					{!currentAssignee && <CheckIcon className="ml-auto h-4 w-4" />}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{users
					.filter((user) => user.teamIds.includes("CORE"))
					.map((user) => (
						<DropdownMenuItem
							key={user.id}
							onClick={(e) => {
								e.stopPropagation();
								setCurrentAssignee(user);
								setOpen(false);
							}}
						>
							<div className="flex items-center gap-2">
								<Avatar className="h-5 w-5">
									<AvatarImage src={user.avatarUrl} alt={user.name} />
									<AvatarFallback>{user.name[0]}</AvatarFallback>
								</Avatar>
								<span>{user.name}</span>
							</div>
							{currentAssignee?.id === user.id && (
								<CheckIcon className="ml-auto h-4 w-4" />
							)}
						</DropdownMenuItem>
					))}
				<DropdownMenuSeparator />
				<DropdownMenuLabel>New user</DropdownMenuLabel>
				<DropdownMenuItem>
					<div className="flex items-center gap-2">
						<Send className="h-4 w-4" />
						<span>Invite and assign...</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
