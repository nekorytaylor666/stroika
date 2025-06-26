"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	inputClassName?: string;
	disabled?: boolean;
}

export function EditableText({
	value,
	onSave,
	placeholder = "Нажмите для редактирования",
	className,
	inputClassName,
	disabled = false,
}: EditableTextProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setEditValue(value);
	}, [value]);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleSave = async () => {
		if (editValue === value) {
			setIsEditing(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await onSave(editValue);
			setIsEditing(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Ошибка сохранения");
			setEditValue(value); // Revert to original value
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		setEditValue(value);
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

	if (isEditing) {
		return (
			<motion.div
				initial={{ opacity: 0.8 }}
				animate={{ opacity: 1 }}
				className={cn("relative inline-flex items-center", className)}
			>
				<Input
					ref={inputRef}
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
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
			{value || placeholder}
		</button>
	);
}
