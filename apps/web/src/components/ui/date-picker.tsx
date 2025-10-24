"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

interface DatePickerProps {
	date?: Date;
	onDateChange?: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function DatePicker({
	date,
	onDateChange,
	placeholder = "Выберите дату",
	className,
	disabled = false,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

	// Set a wide range for years to allow future dates well beyond 2025
	const currentYear = new Date().getFullYear();
	const startYear = currentYear - 50; // Allow 50 years in the past
	const endYear = currentYear + 50; // Allow 50 years in the future

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant={"outline"}
					className={cn(
						"w-full justify-between font-normal",
						!date && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					{date ? (
						format(date, "PPP", { locale: ru })
					) : (
						<span>{placeholder}</span>
					)}
					<ChevronDownIcon className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-hidden p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					captionLayout="dropdown"
					onSelect={(date) => {
						onDateChange?.(date);
						setOpen(false);
					}}
					initialFocus
					locale={ru}
					startMonth={new Date(startYear, 0)}
					endMonth={new Date(endYear, 11)}
					defaultMonth={date || new Date()}
				/>
			</PopoverContent>
		</Popover>
	);
}
