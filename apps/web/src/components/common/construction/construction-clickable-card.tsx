"use client";

import { type ReactNode, useRef, useEffect, useState } from "react";

interface ClickableCardProps {
	onClick: () => void;
	children: ReactNode;
	className?: string;
	isDragging?: boolean;
}

// Global drag state tracker
let globalIsDragging = false;
let dragEndTimeout: NodeJS.Timeout | null = null;

export function ConstructionClickableCard({
	onClick,
	children,
	className,
	isDragging: parentIsDragging = false,
}: ClickableCardProps) {
	const [localIsDragging, setLocalIsDragging] = useState(false);
	const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const handleDragStart = () => {
			globalIsDragging = true;
			setLocalIsDragging(true);
			
			// Clear any existing timeout
			if (dragEndTimeout) {
				clearTimeout(dragEndTimeout);
				dragEndTimeout = null;
			}
		};

		const handleDragEnd = () => {
			// Keep drag state true for a short time after drag ends
			// to prevent click from firing immediately after drop
			dragEndTimeout = setTimeout(() => {
				globalIsDragging = false;
				setLocalIsDragging(false);
			}, 200); // 200ms delay to ensure drop completes
		};

		// Listen to drag events on the document
		document.addEventListener('dragstart', handleDragStart, true);
		document.addEventListener('dragend', handleDragEnd, true);
		
		// Also listen for dnd-kit specific events
		const handlePointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement;
			// Check if this is part of a draggable element
			if (target.closest('[data-dnd-draggable="true"]') || 
			    target.closest('[role="button"][tabindex="0"]')) {
				setLocalIsDragging(true);
			}
		};
		
		const handlePointerUp = () => {
			// Reset drag state after pointer up with delay
			clickTimeoutRef.current = setTimeout(() => {
				setLocalIsDragging(false);
			}, 200);
		};

		document.addEventListener('pointerdown', handlePointerDown, true);
		document.addEventListener('pointerup', handlePointerUp, true);

		return () => {
			document.removeEventListener('dragstart', handleDragStart, true);
			document.removeEventListener('dragend', handleDragEnd, true);
			document.removeEventListener('pointerdown', handlePointerDown, true);
			document.removeEventListener('pointerup', handlePointerUp, true);
			
			if (dragEndTimeout) {
				clearTimeout(dragEndTimeout);
			}
			if (clickTimeoutRef.current) {
				clearTimeout(clickTimeoutRef.current);
			}
		};
	}, []);

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click if dragging
		if (globalIsDragging || localIsDragging || parentIsDragging) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		
		// Check if the clicked element is the drag handle
		const target = e.target as HTMLElement;
		if (target.closest('[data-dnd-drag-handle="true"]')) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		
		// Small delay to ensure this isn't part of a drag operation
		setTimeout(() => {
			if (!globalIsDragging && !localIsDragging) {
				onClick();
			}
		}, 50);
	};

	return (
		<div
			onClick={handleClick}
			className={className}
			style={{ userSelect: "none" }}
			data-clickable-card="true"
		>
			{children}
		</div>
	);
}