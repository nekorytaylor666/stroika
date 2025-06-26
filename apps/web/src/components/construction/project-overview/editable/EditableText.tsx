"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	variant?: "default" | "h1" | "h2" | "h3";
}

export function EditableText({
	value,
	onSave,
	placeholder = "Click to edit",
	className,
	variant = "default",
}: EditableTextProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isSaving, setIsSaving] = useState(false);
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
		if (editValue.trim() === value.trim()) {
			setIsEditing(false);
			return;
		}

		setIsSaving(true);
		try {
			await onSave(editValue.trim());
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to save:", error);
			setEditValue(value);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		setEditValue(value);
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

	const variantClasses = {
		default: "text-sm",
		h1: "text-2xl font-semibold",
		h2: "text-xl font-medium",
		h3: "text-base font-medium",
	};

	if (isEditing) {
		return (
			<div className="relative inline-flex items-center gap-1">
				<input
					ref={inputRef}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					className={cn(
						"inline-block w-full rounded-md border border-input bg-background px-2 py-1",
						"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
						variantClasses[variant],
						className,
					)}
				/>
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
				"inline-block rounded px-2 py-1 text-left transition-colors",
				"hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				variantClasses[variant],
				className,
			)}
		>
			{value || <span className="text-muted-foreground">{placeholder}</span>}
		</button>
	);
}
