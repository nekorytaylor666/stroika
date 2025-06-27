"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface User {
	_id: Id<"users">;
	name: string;
	email: string;
	avatarUrl?: string | null;
}

interface UserSelectorProps {
	users: User[];
	value?: Id<"users">;
	onChange: (userId: Id<"users"> | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
}

export function UserSelector({
	users,
	value,
	onChange,
	placeholder = "Выберите пользователя...",
	disabled = false,
}: UserSelectorProps) {
	const [open, setOpen] = useState(false);

	const selectedUser = users.find((user) => user._id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={disabled}
				>
					{selectedUser ? (
						<div className="flex items-center gap-2">
							<Avatar className="h-6 w-6">
								<AvatarImage src={selectedUser.avatarUrl || undefined} />
								<AvatarFallback className="text-xs">
									{selectedUser.name
										.split(" ")
										.map((n) => n[0])
										.join("")
										.toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span>{selectedUser.name}</span>
						</div>
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput placeholder="Поиск пользователя..." />
					<CommandEmpty>Пользователь не найден.</CommandEmpty>
					<CommandGroup>
						{users.map((user) => (
							<CommandItem
								key={user._id}
								value={user.name + user.email}
								onSelect={() => {
									onChange(user._id === value ? undefined : user._id);
									setOpen(false);
								}}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === user._id ? "opacity-100" : "opacity-0",
									)}
								/>
								<Avatar className="mr-2 h-6 w-6">
									<AvatarImage src={user.avatarUrl || undefined} />
									<AvatarFallback className="text-xs">
										{user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col">
									<span className="text-sm">{user.name}</span>
									<span className="text-muted-foreground text-xs">
										{user.email}
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
