"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface EditableTextareaProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	textareaClassName?: string;
	rows?: number;
	maxRows?: number;
	disabled?: boolean;
}

export function EditableTextarea({
	value,
	onSave,
	placeholder = "Нажмите для редактирования",
	className,
	textareaClassName,
	rows = 3,
	maxRows = 10,
	disabled = false,
}: EditableTextareaProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setEditValue(value);
	}, [value]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus();
			textareaRef.current.select();
			adjustHeight();
		}
	}, [isEditing]);

	const adjustHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			const newHeight = Math.min(
				textareaRef.current.scrollHeight,
				maxRows * 24, // Approximate line height
			);
			textareaRef.current.style.height = `${newHeight}px`;
		}
	};

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
		if (e.key === "Escape") {
			handleCancel();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSave();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setEditValue(e.target.value);
		adjustHeight();
	};

	if (isEditing) {
		return (
			<motion.div
				initial={{ opacity: 0.8 }}
				animate={{ opacity: 1 }}
				className={cn("relative", className)}
			>
				<Textarea
					ref={textareaRef}
					value={editValue}
					onChange={handleChange}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					disabled={isLoading}
					rows={rows}
					className={cn(
						"min-h-[60px] resize-none px-2 py-1.5 text-sm",
						error && "border-red-500 focus-visible:ring-red-500",
						textareaClassName,
					)}
					aria-invalid={!!error}
				/>
				{isLoading && (
					<div className="absolute top-2 right-2">
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
				<div className="mt-1 text-muted-foreground text-xs">
					Нажмите Cmd+Enter для сохранения, Esc для отмены
				</div>
			</motion.div>
		);
	}

	return (
		<button
			onClick={() => !disabled && setIsEditing(true)}
			disabled={disabled}
			className={cn(
				"block w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
				"hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				disabled && "cursor-not-allowed opacity-50",
				!value && "text-muted-foreground",
				className,
			)}
		>
			<span className="whitespace-pre-wrap">{value || placeholder}</span>
		</button>
	);
}
