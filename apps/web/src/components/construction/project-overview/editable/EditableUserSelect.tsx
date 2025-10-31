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
import { Check, ChevronDown, Loader2, User, X } from "lucide-react";
import { useState } from "react";

export interface UserOption {
	_id: Id<"user">;
	name: string;
	email: string;
	avatarUrl?: string | null;
	role?: string;
}

interface EditableUserSelectProps {
	value: Id<"user"> | null;
	users: UserOption[];
	onSave: (value: Id<"user"> | null) => Promise<void>;
	placeholder?: string;
	className?: string;
	multiple?: false;
}

interface EditableUserMultiSelectProps {
	value: Id<"user">[];
	users: UserOption[];
	onSave: (value: Id<"user">[]) => Promise<void>;
	placeholder?: string;
	className?: string;
	multiple: true;
}

type EditableUserSelectPropsUnion =
	| EditableUserSelectProps
	| EditableUserMultiSelectProps;

export function EditableUserSelect(props: EditableUserSelectPropsUnion) {
	const {
		users,
		onSave,
		placeholder = "Select user",
		className,
		multiple,
	} = props;
	const [open, setOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	if (multiple) {
		const { value } = props as EditableUserMultiSelectProps;
		const selectedUsers = users.filter((user) => value.includes(user.id));

		const handleToggleUser = async (userId: Id<"user">) => {
			const newValue = value.includes(userId)
				? value.filter((id) => id !== userId)
				: [...value, userId];

			setIsSaving(true);
			try {
				await onSave(newValue);
			} catch (error) {
				console.error("Failed to save:", error);
			} finally {
				setIsSaving(false);
			}
		};

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						role="combobox"
						aria-expanded={open}
						className={cn(
							"h-auto justify-between px-2 py-1 font-normal",
							"hover:bg-muted/50",
							className,
						)}
						disabled={isSaving}
					>
						<div className="flex items-center gap-2">
							{selectedUsers.length > 0 ? (
								<>
									<div className="-space-x-2 flex">
										{selectedUsers.slice(0, 3).map((user) => (
											<Avatar
												key={user.id}
												className="h-6 w-6 border-2 border-background"
											>
												<AvatarImage src={user.image || undefined} />
												<AvatarFallback>{user.name[0]}</AvatarFallback>
											</Avatar>
										))}
									</div>
									{selectedUsers.length > 3 && (
										<span className="text-muted-foreground text-sm">
											+{selectedUsers.length - 3} more
										</span>
									)}
								</>
							) : (
								<span className="text-muted-foreground">{placeholder}</span>
							)}
						</div>
						{isSaving ? (
							<Loader2 className="ml-2 h-4 w-4 animate-spin" />
						) : (
							<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search users..." />
						<CommandEmpty>No users found.</CommandEmpty>
						<CommandGroup className="max-h-64 overflow-auto">
							{users.map((user) => (
								<CommandItem
									key={user.id}
									value={user.name}
									onSelect={() => handleToggleUser(user.id)}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value.includes(user.id) ? "opacity-100" : "opacity-0",
										)}
									/>
									<Avatar className="mr-2 h-6 w-6">
										<AvatarImage src={user.image || undefined} />
										<AvatarFallback>{user.name[0]}</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="text-sm">{user.name}</div>
										<div className="text-muted-foreground text-xs">
											{user.role || user.email}
										</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		);
	}

	// Single select
	const { value } = props as EditableUserSelectProps;
	const selectedUser = users.find((user) => user.id === value);

	const handleSelect = async (userId: Id<"user"> | null) => {
		if (userId === value) {
			setOpen(false);
			return;
		}

		setIsSaving(true);
		try {
			await onSave(userId);
			setOpen(false);
		} catch (error) {
			console.error("Failed to save:", error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					className={cn(
						"h-auto justify-between px-2 py-1 font-normal",
						"hover:bg-muted/50",
						className,
					)}
					disabled={isSaving}
				>
					{selectedUser ? (
						<div className="flex items-center gap-2">
							<Avatar className="h-6 w-6">
								<AvatarImage src={selectedUser.image || undefined} />
								<AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
							</Avatar>
							<span className="text-sm">{selectedUser.name}</span>
						</div>
					) : (
						<div className="flex items-center gap-2 text-muted-foreground">
							<User className="h-4 w-4" />
							<span className="text-sm">{placeholder}</span>
						</div>
					)}
					{isSaving ? (
						<Loader2 className="ml-2 h-4 w-4 animate-spin" />
					) : (
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Поиск пользователей..." />
					<CommandEmpty>Пользователи не найдены.</CommandEmpty>
					<CommandGroup className="max-h-64 overflow-auto">
						{value && (
							<CommandItem value="clear" onSelect={() => handleSelect(null)}>
								<X className="mr-2 h-4 w-4" />
								<span>Очистить выбор</span>
							</CommandItem>
						)}
						{users.map((user) => (
							<CommandItem
								key={user.id}
								value={user.name}
								onSelect={() => handleSelect(user.id)}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === user.id ? "opacity-100" : "opacity-0",
									)}
								/>
								<Avatar className="mr-2 h-6 w-6">
									<AvatarImage src={user.image || undefined} />
									<AvatarFallback>{user.name[0]}</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<div className="text-sm">{user.name}</div>
									<div className="text-muted-foreground text-xs">
										{user.role || user.email}
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
