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
import { CheckIcon, UserCircle } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface AssigneeSelectorProps {
	assignee: any | null;
	onChange: (assignee: any | null) => void;
}

export function AssigneeSelector({
	assignee,
	onChange,
}: AssigneeSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string | null>(assignee?._id || null);

	const { users, tasks } = useConstructionData();

	useEffect(() => {
		setValue(assignee?._id || null);
	}, [assignee]);

	const handleAssigneeChange = (userId: string) => {
		if (userId === "unassigned") {
			setValue(null);
			onChange(null);
		} else {
			setValue(userId);
			const newAssignee = users?.find((u) => u._id === userId);
			if (newAssignee) {
				onChange(newAssignee);
			}
		}
		setOpen(false);
	};

	const getTaskCountForUser = (userId: string | null) => {
		if (!tasks) return 0;
		return tasks.filter((task) => task.assigneeId === userId).length;
	};

	return (
		<div className="*:not-first:mt-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className="flex items-center justify-center"
						size="xs"
						variant="secondary"
						role="combobox"
						aria-expanded={open}
					>
						{value ? (
							(() => {
								const selectedUser = users?.find((user) => user._id === value);
								if (selectedUser) {
									return (
										<Avatar className="size-5">
											<AvatarImage
												src={selectedUser.avatarUrl}
												alt={selectedUser.name}
											/>
											<AvatarFallback>
												{selectedUser.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
									);
								}
								return <UserCircle className="size-5" />;
							})()
						) : (
							<UserCircle className="size-5" />
						)}
						<span>
							{value
								? users?.find((u) => u._id === value)?.name
								: "Не назначено"}
						</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
					align="start"
				>
					<Command>
						<CommandInput autoFocus={false} placeholder="Назначить..." />
						<CommandList>
							<CommandEmpty>Пользователь не найден.</CommandEmpty>
							<CommandGroup>
								<CommandItem
									value="unassigned"
									onSelect={() => handleAssigneeChange("unassigned")}
									className="flex items-center justify-between"
								>
									<div className="flex items-center gap-2">
										<UserCircle className="size-5" />
										Unassigned
									</div>
									{value === null && (
										<CheckIcon size={16} className="ml-auto" />
									)}
									<span className="text-muted-foreground text-xs">
										{getTaskCountForUser(null)}
									</span>
								</CommandItem>
								{users?.map((user) => (
									<CommandItem
										key={user._id}
										value={user._id}
										onSelect={() => handleAssigneeChange(user._id)}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage src={user.avatarUrl} alt={user.name} />
												<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
											</Avatar>
											{user.name}
										</div>
										{value === user._id && (
											<CheckIcon size={16} className="ml-auto" />
										)}
										<span className="text-muted-foreground text-xs">
											{getTaskCountForUser(user._id)}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
