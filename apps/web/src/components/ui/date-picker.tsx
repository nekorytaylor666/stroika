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
				/>
			</PopoverContent>
		</Popover>
	);
}
