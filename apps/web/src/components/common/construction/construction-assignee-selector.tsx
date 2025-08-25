"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useConstructionData } from "@/hooks/use-construction-data";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation } from "convex/react";
import { Check, ChevronDown, User } from "lucide-react";
import { useState } from "react";

interface ConstructionAssigneeSelectorProps {
	issueId: Id<"issues">;
	currentAssigneeId: Id<"users"> | null;
	showLabel?: boolean;
}

export function ConstructionAssigneeSelector({
	issueId,
	currentAssigneeId,
	showLabel = false,
}: ConstructionAssigneeSelectorProps) {
	const [open, setOpen] = useState(false);
	const { users, tasks } = useConstructionData();
	const currentUser = useCurrentUser();
	const updateAssignee = useMutation(api.constructionTasks.updateAssignee);

	const currentAssignee = currentAssigneeId
		? users?.find((u) => u._id === currentAssigneeId)
		: null;

	const getTaskCountForUser = (userId: Id<"users"> | null) => {
		if (!tasks) return 0;
		return tasks.filter((task) => task.assigneeId === userId).length;
	};

	const handleAssigneeChange = async (userId: Id<"users"> | null) => {
		if (!currentUser) {
			console.error("No current user found");
			return;
		}

		try {
			await updateAssignee({
				id: issueId,
				assigneeId: userId,
				userId: currentUser._id,
			});
			setOpen(false);
		} catch (error) {
			console.error("Failed to update assignee:", error);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 justify-start gap-1.5 px-3"
				>
					{currentAssignee ? (
						<>
							<Avatar className="h-5 w-5">
								<AvatarImage
									src={currentAssignee.avatarUrl}
									alt={currentAssignee.name}
								/>
								<AvatarFallback>
									{currentAssignee.name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							{showLabel && (
								<span className="text-sm">{currentAssignee.name}</span>
							)}
						</>
					) : (
						<>
							<User className="h-3.5 w-3.5" />
							{showLabel && (
								<span className="text-muted-foreground text-sm">
									Не назначен
								</span>
							)}
						</>
					)}
					<ChevronDown className="ml-auto h-3.5 w-3.5" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Поиск пользователя..." />
					<CommandList>
						<CommandEmpty>Пользователь не найден.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								onSelect={() => handleAssigneeChange(null)}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4" />
									<span>Не назначен</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-xs">
										{getTaskCountForUser(null)}
									</span>
									{!currentAssigneeId && <Check className="h-3.5 w-3.5" />}
								</div>
							</CommandItem>
							{users?.map((user) => (
								<CommandItem
									key={user._id}
									onSelect={() => handleAssigneeChange(user._id as Id<"users">)}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<Avatar className="h-5 w-5">
											<AvatarImage src={user.avatarUrl} alt={user.name} />
											<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
										</Avatar>
										<span>{user.name}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-xs">
											{getTaskCountForUser(user._id as Id<"users">)}
										</span>
										{currentAssigneeId === user._id && (
											<Check className="h-3.5 w-3.5" />
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
