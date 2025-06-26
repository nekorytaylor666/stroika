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
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, User, Users, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export interface User {
	_id: string;
	name: string;
	email?: string;
	avatarUrl?: string;
}

interface EditableUserSelectProps {
	value: string | string[] | null; // User ID(s)
	users: User[];
	onSave: (value: string | string[] | null) => Promise<void>;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
	multiple?: boolean;
	showEmail?: boolean;
	maxDisplay?: number; // For multiple selection
}

export function EditableUserSelect({
	value,
	users,
	onSave,
	placeholder = "Выберите пользователя",
	searchPlaceholder = "Поиск пользователей...",
	emptyMessage = "Пользователи не найдены",
	className,
	disabled = false,
	multiple = false,
	showEmail = true,
	maxDisplay = 3,
}: EditableUserSelectProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const normalizedValue = Array.isArray(value) ? value : value ? [value] : [];
	const selectedUsers = users.filter((user) =>
		normalizedValue.includes(user._id),
	);

	const handleSelect = async (userId: string) => {
		let newValue: string | string[] | null;

		if (multiple) {
			if (normalizedValue.includes(userId)) {
				// Remove from selection
				const filtered = normalizedValue.filter((id) => id !== userId);
				newValue = filtered.length > 0 ? filtered : null;
			} else {
				// Add to selection
				newValue = [...normalizedValue, userId];
			}
		} else {
			newValue = userId === value ? null : userId;
			setOpen(false);
		}

		setIsLoading(true);
		setError(null);

		try {
			await onSave(newValue);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ошибка сохранения");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClear = async (e: React.MouseEvent) => {
		e.stopPropagation();

		if (!value) return;

		setIsLoading(true);
		setError(null);

		try {
			await onSave(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ошибка сохранения");
		} finally {
			setIsLoading(false);
		}
	};

	const renderSelectedUsers = () => {
		if (selectedUsers.length === 0) {
			return (
				<span className="flex items-center gap-2 text-muted-foreground">
					<User className="h-3.5 w-3.5" />
					{placeholder}
				</span>
			);
		}

		if (multiple && selectedUsers.length > maxDisplay) {
			return (
				<span className="flex items-center gap-2">
					<div className="-space-x-2 flex">
						{selectedUsers.slice(0, maxDisplay).map((user) => (
							<Avatar
								key={user._id}
								className="h-5 w-5 border-2 border-background"
							>
								<AvatarImage src={user.avatarUrl} />
								<AvatarFallback className="text-xs">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>
						))}
					</div>
					<span className="text-sm">+{selectedUsers.length - maxDisplay}</span>
				</span>
			);
		}

		if (multiple) {
			return (
				<div className="flex flex-wrap items-center gap-1">
					{selectedUsers.map((user) => (
						<span
							key={user._id}
							className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
						>
							<Avatar className="h-4 w-4">
								<AvatarImage src={user.avatarUrl} />
								<AvatarFallback className="text-[10px]">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>
							{user.name}
						</span>
					))}
				</div>
			);
		}

		const user = selectedUsers[0];
		return (
			<span className="flex items-center gap-2">
				<Avatar className="h-5 w-5">
					<AvatarImage src={user.avatarUrl} />
					<AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
				</Avatar>
				{user.name}
			</span>
		);
	};

	return (
		<div className={cn("relative", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						role="combobox"
						aria-expanded={open}
						disabled={disabled || isLoading}
						className={cn(
							"h-auto min-h-[32px] w-full justify-between px-2 py-1 font-normal text-sm",
							error && "border-red-500",
						)}
					>
						{renderSelectedUsers()}
						<div className="ml-2 flex items-center gap-1">
							{selectedUsers.length > 0 && !isLoading && (
								<button
									onClick={handleClear}
									className="rounded p-0.5 hover:bg-muted"
								>
									<X className="h-3 w-3" />
								</button>
							)}
							{isLoading ? (
								<Loader2 className="h-3 w-3 animate-spin" />
							) : (
								<ChevronDown className="h-3 w-3 opacity-50" />
							)}
						</div>
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0" align="start">
					<Command>
						<CommandInput placeholder={searchPlaceholder} />
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandList>
							<CommandGroup>
								{users.map((user) => {
									const isSelected = normalizedValue.includes(user._id);
									return (
										<CommandItem
											key={user._id}
											value={user.name}
											onSelect={() => handleSelect(user._id)}
											className="flex items-center gap-2"
										>
											<Avatar className="h-6 w-6">
												<AvatarImage src={user.avatarUrl} />
												<AvatarFallback className="text-xs">
													{user.name[0]}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="font-medium text-sm">{user.name}</div>
												{showEmail && user.email && (
													<div className="text-muted-foreground text-xs">
														{user.email}
													</div>
												)}
											</div>
											{multiple && (
												<div
													className={cn(
														"flex h-4 w-4 items-center justify-center rounded-sm border",
														isSelected
															? "border-primary bg-primary"
															: "border-muted-foreground",
													)}
												>
													<Check
														className={cn(
															"h-3 w-3 text-primary-foreground",
															isSelected ? "opacity-100" : "opacity-0",
														)}
													/>
												</div>
											)}
											{!multiple && (
												<Check
													className={cn(
														"ml-auto h-3.5 w-3.5",
														isSelected ? "opacity-100" : "opacity-0",
													)}
												/>
											)}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{error && (
				<motion.div
					initial={{ opacity: 0, y: -2 }}
					animate={{ opacity: 1, y: 0 }}
					className="-bottom-6 absolute left-0 text-red-500 text-xs"
				>
					{error}
				</motion.div>
			)}
		</div>
	);
}
