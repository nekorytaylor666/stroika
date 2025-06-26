"use client";

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
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export interface SelectOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	color?: string;
}

interface EditableSelectProps {
	value: string;
	options: SelectOption[];
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	className?: string;
	disabled?: boolean;
	showSearch?: boolean;
}

export function EditableSelect({
	value,
	options,
	onSave,
	placeholder = "Выберите значение",
	searchPlaceholder = "Поиск...",
	emptyMessage = "Ничего не найдено",
	className,
	disabled = false,
	showSearch = true,
}: EditableSelectProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedOption = options.find((opt) => opt.value === value);

	const handleSelect = async (newValue: string) => {
		if (newValue === value) {
			setOpen(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await onSave(newValue);
			setOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ошибка сохранения");
		} finally {
			setIsLoading(false);
		}
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
							"h-auto justify-between px-2 py-1 font-normal text-sm",
							!selectedOption && "text-muted-foreground",
							error && "border-red-500",
						)}
					>
						<span className="flex items-center gap-2">
							{selectedOption?.icon}
							<span style={{ color: selectedOption?.color }}>
								{selectedOption?.label || placeholder}
							</span>
						</span>
						{isLoading ? (
							<Loader2 className="ml-2 h-3 w-3 animate-spin" />
						) : (
							<ChevronDown className="ml-2 h-3 w-3 opacity-50" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0" align="start">
					<Command>
						{showSearch && (
							<>
								<CommandInput placeholder={searchPlaceholder} />
								<CommandEmpty>{emptyMessage}</CommandEmpty>
							</>
						)}
						<CommandList>
							<CommandGroup>
								{options.map((option) => (
									<CommandItem
										key={option.value}
										value={option.value}
										onSelect={() => handleSelect(option.value)}
										className="flex items-center gap-2"
									>
										{option.icon}
										<span style={{ color: option.color }}>{option.label}</span>
										<Check
											className={cn(
												"ml-auto h-3.5 w-3.5",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
									</CommandItem>
								))}
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
