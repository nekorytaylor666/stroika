"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface EditableNumberProps {
	value: number;
	onSave: (value: number) => Promise<void>;
	placeholder?: string;
	className?: string;
	inputClassName?: string;
	disabled?: boolean;
	min?: number;
	max?: number;
	step?: number;
	format?: (value: number) => string;
	parse?: (value: string) => number;
	prefix?: string;
	suffix?: string;
}

export function EditableNumber({
	value,
	onSave,
	placeholder = "0",
	className,
	inputClassName,
	disabled = false,
	min,
	max,
	step = 1,
	format,
	parse,
	prefix,
	suffix,
}: EditableNumberProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value.toString());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const defaultFormat = (val: number) => {
		if (format) return format(val);

		// Default formatting for large numbers
		if (Math.abs(val) >= 1000000) {
			return new Intl.NumberFormat("ru-RU", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(val);
		}

		return val.toLocaleString("ru-RU");
	};

	const defaultParse = (val: string) => {
		if (parse) return parse(val);

		// Remove formatting and parse
		const cleaned = val.replace(/[^\d,.-]/g, "").replace(",", ".");
		return Number.parseFloat(cleaned) || 0;
	};

	useEffect(() => {
		setEditValue(value.toString());
	}, [value]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = async () => {
		const numValue = defaultParse(editValue);

		if (isNaN(numValue)) {
			setError("Введите корректное число");
			return;
		}

		if (min !== undefined && numValue < min) {
			setError(`Минимальное значение: ${min}`);
			return;
		}

		if (max !== undefined && numValue > max) {
			setError(`Максимальное значение: ${max}`);
			return;
		}

		if (numValue === value) {
			setIsEditing(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await onSave(numValue);
			setIsEditing(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ошибка сохранения");
			setEditValue(value.toString()); // Revert to original value
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setEditValue(value.toString());
		setIsEditing(false);
		setError(null);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	const handleWheel = (e: React.WheelEvent) => {
		if (!isEditing) return;

		e.preventDefault();
		const delta = e.deltaY < 0 ? step : -step;
		const newValue = defaultParse(editValue) + delta;

		if (min !== undefined && newValue < min) return;
		if (max !== undefined && newValue > max) return;

		setEditValue(newValue.toString());
	};

	if (isEditing) {
		return (
			<motion.div
				initial={{ opacity: 0.8 }}
				animate={{ opacity: 1 }}
				className={cn("relative inline-flex items-center", className)}
			>
				<Input
					ref={inputRef}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					onWheel={handleWheel}
					disabled={isLoading}
					className={cn(
						"h-auto px-2 py-1 text-sm",
						error && "border-red-500 focus-visible:ring-red-500",
						inputClassName,
					)}
					aria-invalid={!!error}
				/>
				{isLoading && (
					<div className="-translate-y-1/2 absolute top-1/2 right-2">
						<Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
					</div>
				)}
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -2 }}
						animate={{ opacity: 1, y: 0 }}
						className="-bottom-6 absolute left-0 text-red-500 text-xs"
					>
						{error}
					</motion.div>
				)}
			</motion.div>
		);
	}

	const displayValue = value ? defaultFormat(value) : placeholder;

	return (
		<button
			onClick={() => !disabled && setIsEditing(true)}
			disabled={disabled}
			className={cn(
				"inline-flex items-center rounded px-2 py-1 text-left text-sm transition-colors",
				"hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				disabled && "cursor-not-allowed opacity-50",
				!value && "text-muted-foreground",
				className,
			)}
		>
			{prefix && <span className="mr-1">{prefix}</span>}
			{displayValue}
			{suffix && <span className="ml-1">{suffix}</span>}
		</button>
	);
}
