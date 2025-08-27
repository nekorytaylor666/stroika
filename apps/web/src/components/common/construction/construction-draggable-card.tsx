"use client";

import { type ReactNode, useRef, useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DraggableCardProps {
	id: string;
	onClick: () => void;
	children: ReactNode;
	className?: string;
	dragDelay?: number; // Delay in ms before drag starts
}

export function ConstructionDraggableCard({
	id,
	onClick,
	children,
	className,
	dragDelay = 200, // Default 200ms delay
}: DraggableCardProps) {
	const [dragEnabled, setDragEnabled] = useState(false);
	const longPressTimer = useRef<NodeJS.Timeout | null>(null);
	const isDraggingRef = useRef(false);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		disabled: !dragEnabled,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	// Handle pointer/mouse down - start timer for drag
	const handlePointerDown = useCallback((e: React.PointerEvent | React.MouseEvent) => {
		isDraggingRef.current = false;
		
		// Start timer to enable drag after delay
		longPressTimer.current = setTimeout(() => {
			setDragEnabled(true);
			isDraggingRef.current = true;
		}, dragDelay);
		
		// Pass event to drag listeners if enabled
		if (dragEnabled && listeners?.onPointerDown) {
			(listeners.onPointerDown as any)(e);
		}
	}, [dragDelay, dragEnabled, listeners]);

	// Handle pointer/mouse up - clear timer and handle click
	const handlePointerUp = useCallback((e: React.PointerEvent | React.MouseEvent) => {
		// Clear the timer if still running
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}

		// If drag was never enabled, treat as click
		if (!isDraggingRef.current && !isDragging) {
			onClick();
		}

		// Reset drag enabled state
		setDragEnabled(false);
		isDraggingRef.current = false;
	}, [isDragging, onClick]);

	// Handle pointer leave - cleanup
	const handlePointerLeave = useCallback(() => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
		setDragEnabled(false);
		isDraggingRef.current = false;
	}, []);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={className}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerLeave}
			onMouseDown={handlePointerDown}
			onMouseUp={handlePointerUp}
			onMouseLeave={handlePointerLeave}
			{...attributes}
			{...(dragEnabled ? listeners : {})}
		>
			{children}
		</div>
	);
}