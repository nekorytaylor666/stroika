"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import type { UserWithRole } from "better-auth/plugins";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { useEffect, useState } from "react";

interface UserSelectorProps {
	users: UserWithRole[];
	value?: Id<"user">;
	onChange: (userId: Id<"user"> | undefined) => void;
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

	const selectedUser = users.find((user) => user.id === value);

	// Keyboard shortcut to open dialog
	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<>
			<Button
				variant="outline"
				role="combobox"
				aria-expanded={open}
				className="w-full justify-between"
				disabled={disabled}
				onClick={() => setOpen(true)}
			>
				{selectedUser ? (
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarImage src={selectedUser.image || undefined} />
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

			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Поиск пользователя..." />
				<CommandList>
					<CommandEmpty>Пользователь не найден.</CommandEmpty>
					<CommandGroup heading="Пользователи">
						{users.map((user) => (
							<CommandItem
								key={user.id}
								value={`${user.name} ${user.email}`}
								onSelect={() => {
									onChange(user.id === value ? undefined : user.id);
									setOpen(false);
								}}
								className="cursor-pointer"
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === user.id ? "opacity-100" : "opacity-0",
									)}
								/>
								<Avatar className="mr-2 h-6 w-6">
									<AvatarImage src={user.image || undefined} />
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
				</CommandList>
			</CommandDialog>
		</>
	);
}
