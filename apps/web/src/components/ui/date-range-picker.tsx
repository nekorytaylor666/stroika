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
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
	dateRange?: DateRange;
	onDateRangeChange?: (dateRange: DateRange | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

export function DateRangePicker({
	dateRange,
	onDateRangeChange,
	placeholder = "Выберите период",
	className,
	disabled = false,
}: DateRangePickerProps) {
	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-full justify-start text-left font-normal",
							!dateRange && "text-muted-foreground",
						)}
						disabled={disabled}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{dateRange?.from ? (
							dateRange.to ? (
								<>
									{format(dateRange.from, "LLL dd, y", { locale: ru })} -{" "}
									{format(dateRange.to, "LLL dd, y", { locale: ru })}
								</>
							) : (
								format(dateRange.from, "LLL dd, y", { locale: ru })
							)
						) : (
							<span>{placeholder}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={dateRange?.from}
						selected={dateRange}
						onSelect={onDateRangeChange}
						numberOfMonths={2}
						locale={ru}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
