"use client";

import { type ReactNode, useRef, useState, useCallback, useContext } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "../../ui/card";
import { cn } from "@/lib/utils";
import tunnel from 'tunnel-rat';

const t = tunnel();

interface KanbanCardWrapperProps {
	id: string;
	column: string;
	onClick: () => void;
	children: ReactNode;
	className?: string;
	dragDelay?: number;
}

export function ConstructionKanbanCardWrapper({
	id,
	column,
	onClick,
	children,
	className,
	dragDelay = 200,
}: KanbanCardWrapperProps) {
	const [isDragAllowed, setIsDragAllowed] = useState(false);
	const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
	const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
	const startPosRef = useRef<{ x: number; y: number } | null>(null);
	const wasClickRef = useRef(true);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
		setActivatorNodeRef,
	} = useSortable({
		id,
		disabled: !isDragAllowed,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		// Store initial position
		startPosRef.current = { x: e.clientX, y: e.clientY };
		wasClickRef.current = true;

		// Clear any existing timers
		if (dragTimerRef.current) {
			clearTimeout(dragTimerRef.current);
		}
		if (clickTimerRef.current) {
			clearTimeout(clickTimerRef.current);
		}

		// Start timer to enable drag after delay
		dragTimerRef.current = setTimeout(() => {
			setIsDragAllowed(true);
			wasClickRef.current = false;
			// Programmatically trigger drag
			const event = new PointerEvent('pointerdown', {
				clientX: e.clientX,
				clientY: e.clientY,
				bubbles: true,
			});
			e.currentTarget.dispatchEvent(event);
		}, dragDelay);
	}, [dragDelay]);

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		if (!startPosRef.current) return;
		
		// Calculate distance moved
		const deltaX = Math.abs(e.clientX - startPosRef.current.x);
		const deltaY = Math.abs(e.clientY - startPosRef.current.y);
		
		// If moved more than 5px, consider it a drag attempt
		if (deltaX > 5 || deltaY > 5) {
			wasClickRef.current = false;
			// Don't cancel timer - let it enable drag after delay
		}
	}, []);

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		// Clear drag timer
		if (dragTimerRef.current) {
			clearTimeout(dragTimerRef.current);
			dragTimerRef.current = null;
		}

		// If it was a click (not enough time for drag)
		if (wasClickRef.current && !isDragging && !isDragAllowed) {
			// Small delay to ensure it's not interfering with drag
			clickTimerRef.current = setTimeout(() => {
				onClick();
			}, 50);
		}

		// Reset states
		setIsDragAllowed(false);
		startPosRef.current = null;
		wasClickRef.current = true;
	}, [isDragging, isDragAllowed, onClick]);

	const handlePointerCancel = useCallback(() => {
		// Clear timers
		if (dragTimerRef.current) {
			clearTimeout(dragTimerRef.current);
			dragTimerRef.current = null;
		}
		if (clickTimerRef.current) {
			clearTimeout(clickTimerRef.current);
			clickTimerRef.current = null;
		}

		// Reset states
		setIsDragAllowed(false);
		startPosRef.current = null;
		wasClickRef.current = true;
	}, []);

	return (
		<>
			<div 
				ref={setNodeRef} 
				style={style}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onPointerLeave={handlePointerCancel}
				{...attributes}
				{...(isDragAllowed ? listeners : {})}
			>
				<Card
					className={cn(
						"cursor-pointer gap-4 rounded-md shadow-sm transition-shadow hover:shadow-md",
						isDragging && "pointer-events-none cursor-grabbing opacity-30",
						className
					)}
				>
					{children}
				</Card>
			</div>
			{isDragging && (
				<t.In>
					<Card
						className={cn(
							"cursor-grab gap-4 rounded-md shadow-sm ring-2 ring-primary",
							"cursor-grabbing",
							className
						)}
					>
						{children}
					</Card>
				</t.In>
			)}
		</>
	);
}