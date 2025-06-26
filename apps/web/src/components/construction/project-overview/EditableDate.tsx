"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface EditableDateProps {
	value: string | null; // ISO date string
	onSave: (value: string | null) => Promise<void>;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	minDate?: Date;
	maxDate?: Date;
	formatString?: string;
}

export function EditableDate({
	value,
	onSave,
	placeholder = "Выберите дату",
	className,
	disabled = false,
	minDate,
	maxDate,
	formatString = "d MMM yyyy",
}: EditableDateProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const dateValue = value && isValid(parseISO(value)) ? parseISO(value) : null;

	const handleSelect = async (newDate: Date | undefined) => {
		const newValue = newDate ? newDate.toISOString() : null;

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

	const handleClear = async (e: React.MouseEvent) => {
		e.stopPropagation();

		if (!value) return;

		setIsLoading(true);
		setError(null);

		try {
			await onSave(null);
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
						disabled={disabled || isLoading}
						className={cn(
							"h-auto justify-start px-2 py-1 text-left font-normal text-sm",
							!dateValue && "text-muted-foreground",
							error && "border-red-500",
						)}
					>
						<CalendarIcon className="mr-2 h-3.5 w-3.5" />
						{isLoading ? (
							<Loader2 className="h-3 w-3 animate-spin" />
						) : dateValue ? (
							format(dateValue, formatString, { locale: ru })
						) : (
							placeholder
						)}
						{dateValue && !isLoading && (
							<button
								onClick={handleClear}
								className="ml-2 rounded px-1 hover:bg-muted"
							>
								×
							</button>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={dateValue || undefined}
						onSelect={handleSelect}
						locale={ru}
						disabled={(date) => {
							if (minDate && date < minDate) return true;
							if (maxDate && date > maxDate) return true;
							return false;
						}}
						initialFocus
					/>
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
