"use client";

import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

export interface SelectOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
	color?: string;
	className?: string;
}

interface EditableSelectProps {
	value: string;
	options: SelectOption[];
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	renderValue?: (option: SelectOption) => React.ReactNode;
	searchable?: boolean;
}

export function EditableSelect({
	value,
	options,
	onSave,
	placeholder = "Select...",
	className,
	renderValue,
	searchable = true,
}: EditableSelectProps) {
	const [open, setOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const selectedOption = options.find((opt) => opt.value === value);

	const handleSelect = async (newValue: string) => {
		if (newValue === value) {
			setOpen(false);
			return;
		}

		setIsSaving(true);
		try {
			await onSave(newValue);
			setOpen(false);
		} catch (error) {
			console.error("Failed to save:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const defaultRenderValue = (option: SelectOption) => {
		if (option.className) {
			return (
				<Badge className={cn("border-0", option.className)}>
					{option.icon && <span className="mr-1">{option.icon}</span>}
					{option.label}
				</Badge>
			);
		}

		return (
			<span className="flex items-center gap-1.5">
				{option.icon}
				{option.label}
			</span>
		);
	};

	const renderFunction = renderValue || defaultRenderValue;

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
					{selectedOption ? (
						renderFunction(selectedOption)
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
					{isSaving ? (
						<Loader2 className="ml-2 h-4 w-4 animate-spin" />
					) : (
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					{searchable && <CommandInput placeholder="Search..." />}
					<CommandEmpty>No option found.</CommandEmpty>
					<CommandGroup>
						{options.map((option) => (
							<CommandItem
								key={option.value}
								value={option.value}
								onSelect={() => handleSelect(option.value)}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === option.value ? "opacity-100" : "opacity-0",
									)}
								/>
								{renderFunction(option)}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
