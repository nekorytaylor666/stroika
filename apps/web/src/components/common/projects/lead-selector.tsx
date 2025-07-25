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
import { CheckIcon } from "lucide-react";
import { useId, useState } from "react";

interface LeadSelectorProps {
	lead: User;
	onLeadChange?: (userId: string) => void;
}

export function LeadSelector({ lead, onLeadChange }: LeadSelectorProps) {
	const id = useId();
	const [open, setOpen] = useState<boolean>(false);
	const [value, setValue] = useState<string>(lead.id);

	const handleLeadChange = (userId: string) => {
		setValue(userId);
		setOpen(false);

		if (onLeadChange) {
			onLeadChange(userId);
		}
	};

	return (
		<div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						className="flex h-7 items-center justify-center gap-1 px-2"
						size="sm"
						variant="ghost"
						role="combobox"
						aria-expanded={open}
					>
						{(() => {
							const selectedUser = users.find((user) => user.id === value);
							if (selectedUser) {
								return (
									<>
										<Avatar className="mr-1 size-5">
											<AvatarImage
												src={selectedUser.avatarUrl}
												alt={selectedUser.name}
											/>
											<AvatarFallback>
												{selectedUser.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<span className="hidden text-xs md:inline">
											{selectedUser.name}
										</span>
									</>
								);
							}
							return null;
						})()}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-48 border-input p-0" align="start">
					<Command>
						<CommandInput placeholder="Set lead..." />
						<CommandList>
							<CommandEmpty>No user found.</CommandEmpty>
							<CommandGroup>
								{users.map((user) => (
									<CommandItem
										key={user.id}
										value={user.id}
										onSelect={handleLeadChange}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-5">
												<AvatarImage src={user.avatarUrl} alt={user.name} />
												<AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
											</Avatar>
											<span className="text-xs">{user.name}</span>
										</div>
										{value === user.id && (
											<CheckIcon size={14} className="ml-auto" />
										)}
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
