"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableNumberProps {
	value: number;
	onSave: (value: number) => Promise<void>;
	placeholder?: string;
	className?: string;
	prefix?: string;
	suffix?: string;
	formatValue?: (value: number) => string;
	min?: number;
	max?: number;
	step?: number;
}

export function EditableNumber({
	value,
	onSave,
	placeholder = "0",
	className,
	prefix,
	suffix,
	formatValue,
	min,
	max,
	step = 1,
}: EditableNumberProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value.toString());
	const [isSaving, setIsSaving] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

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
		const numValue = Number.parseFloat(editValue);

		if (Number.isNaN(numValue) || numValue === value) {
			setIsEditing(false);
			setEditValue(value.toString());
			return;
		}

		let finalValue = numValue;
		if (min !== undefined && numValue < min) finalValue = min;
		if (max !== undefined && numValue > max) finalValue = max;

		setIsSaving(true);
		try {
			await onSave(finalValue);
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save:", error);
			setEditValue(value.toString());
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setEditValue(value.toString());
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		} else if (e.key === "Escape") {
			handleCancel();
		}
	};

	const displayValue = formatValue ? formatValue(value) : value.toString();

	if (isEditing) {
		return (
			<div className="relative inline-flex items-center gap-1">
				{prefix && <span className="text-muted-foreground">{prefix}</span>}
				<input
					ref={inputRef}
					type="number"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					min={min}
					max={max}
					step={step}
					className={cn(
						"inline-block w-24 rounded-md border border-input bg-background px-2 py-1 text-sm",
						"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
						"[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
						className,
					)}
				/>
				{suffix && <span className="text-muted-foreground">{suffix}</span>}
				{isSaving && (
					<Loader2 className="absolute right-2 h-4 w-4 animate-spin text-muted-foreground" />
				)}
			</div>
		);
	}

	return (
		<button
			onClick={() => setIsEditing(true)}
			className={cn(
				"inline-flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors",
				"hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				className,
			)}
		>
			{prefix && <span className="text-muted-foreground">{prefix}</span>}
			{displayValue || (
				<span className="text-muted-foreground">{placeholder}</span>
			)}
			{suffix && <span className="text-muted-foreground">{suffix}</span>}
		</button>
	);
}
