"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

interface DatePickerProps {
	date: Date | undefined;
	onDateChange?: (date: Date | undefined) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
	const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
		date,
	);
	const [open, setOpen] = React.useState<boolean>(false);

	const handleDateSelect = (date: Date | undefined) => {
		setSelectedDate(date);
		if (onDateChange) {
			onDateChange(date);
		}
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className="h-7 justify-start px-2 text-left font-normal"
					size="sm"
				>
					<CalendarIcon className="h-4 w-4 md:mr-0.5" />
					{selectedDate ? (
						<span className="mt-[1px] hidden text-xs xl:inline">
							{format(selectedDate, "MMM dd, yyyy")}
						</span>
					) : (
						<span className="mt-[1px] hidden text-muted-foreground text-xs xl:inline">
							No date
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={handleDateSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
