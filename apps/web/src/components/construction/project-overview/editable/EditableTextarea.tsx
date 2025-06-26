"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EditableTextareaProps {
	value: string;
	onSave: (value: string) => Promise<void>;
	placeholder?: string;
	className?: string;
	rows?: number;
	maxLength?: number;
}

export function EditableTextarea({
	value,
	onSave,
	placeholder = "Click to edit",
	className,
	rows = 3,
	maxLength,
}: EditableTextareaProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(value);
	const [isSaving, setIsSaving] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		setEditValue(value);
	}, [value]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.focus();
			textareaRef.current.select();
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
		if (e.key === "Escape") {
			handleCancel();
		} else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSave();
		}
	};

	if (isEditing) {
		return (
			<div className="relative">
				<textarea
					ref={textareaRef}
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					rows={rows}
					maxLength={maxLength}
					className={cn(
						"w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
						"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
						"resize-none",
						className,
					)}
				/>
				{isSaving && (
					<Loader2 className="absolute top-2 right-2 h-4 w-4 animate-spin text-muted-foreground" />
				)}
				{maxLength && (
					<div className="mt-1 text-right text-muted-foreground text-xs">
						{editValue.length} / {maxLength}
					</div>
				)}
			</div>
		);
	}

	return (
		<button
			onClick={() => setIsEditing(true)}
			className={cn(
				"block w-full rounded px-3 py-2 text-left text-sm transition-colors",
				"hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
				"whitespace-pre-wrap",
				!value && "text-muted-foreground",
				className,
			)}
		>
			{value || placeholder}
		</button>
	);
}
