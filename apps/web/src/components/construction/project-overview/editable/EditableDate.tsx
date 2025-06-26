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
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";

interface EditableDateProps {
	value: string | null | undefined;
	onSave: (value: string | null) => Promise<void>;
	placeholder?: string;
	className?: string;
	minDate?: Date;
	maxDate?: Date;
	allowClear?: boolean;
}

export function EditableDate({
	value,
	onSave,
	placeholder = "Select date",
	className,
	minDate,
	maxDate,
	allowClear = true,
}: EditableDateProps) {
	const [open, setOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const dateValue = value ? new Date(value) : undefined;

	const handleSelect = async (date: Date | undefined) => {
		const newValue = date ? date.toISOString() : null;

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

	const handleClear = async () => {
		if (!value) {
			setOpen(false);
			return;
		}

		setIsSaving(true);
		try {
			await onSave(null);
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
					className={cn(
						"h-auto justify-start px-2 py-1 font-normal text-sm",
						"hover:bg-muted/50",
						!value && "text-muted-foreground",
						className,
					)}
					disabled={isSaving}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{dateValue ? (
						format(dateValue, "d MMM yyyy", { locale: ru })
					) : (
						<span>{placeholder}</span>
					)}
					{isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={dateValue}
					onSelect={handleSelect}
					disabled={(date) =>
						(minDate && date < minDate) || (maxDate && date > maxDate) || false
					}
					initialFocus
					locale={ru}
				/>
				{allowClear && value && (
					<div className="border-t p-3">
						<Button
							variant="ghost"
							className="w-full"
							onClick={handleClear}
							disabled={isSaving}
						>
							Clear date
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
