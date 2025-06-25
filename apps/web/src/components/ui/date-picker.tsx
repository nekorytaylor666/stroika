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
import { Calendar as CalendarIcon } from "lucide-react";
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
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={"outline"}
					className={cn(
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
					disabled={disabled}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? (
						format(date, "PPP", { locale: ru })
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={onDateChange}
					initialFocus
					locale={ru}
				/>
			</PopoverContent>
		</Popover>
	);
}
