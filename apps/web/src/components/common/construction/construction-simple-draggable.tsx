"use client";

import { type ReactNode, useRef, useState } from "react";

interface SimpleDraggableProps {
	onClick: () => void;
	children: ReactNode;
	className?: string;
}

export function ConstructionSimpleDraggable({
	onClick,
	children,
	className,
}: SimpleDraggableProps) {
	const [startTime, setStartTime] = useState<number | null>(null);
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
	const dragThreshold = 5; // pixels
	const timeThreshold = 200; // milliseconds

	const handleMouseDown = (e: React.MouseEvent) => {
		setStartTime(Date.now());
		setStartPos({ x: e.clientX, y: e.clientY });
	};

	const handleClick = (e: React.MouseEvent) => {
		if (!startTime || !startPos) {
			return;
		}

		const endTime = Date.now();
		const timeDiff = endTime - startTime;
		const distance = Math.sqrt(
			Math.pow(e.clientX - startPos.x, 2) + 
			Math.pow(e.clientY - startPos.y, 2)
		);

		// Only trigger click if:
		// 1. Time held is less than threshold (quick click)
		// 2. Mouse hasn't moved much
		if (timeDiff < timeThreshold && distance < dragThreshold) {
			e.preventDefault();
			e.stopPropagation();
			onClick();
		}

		// Reset
		setStartTime(null);
		setStartPos(null);
	};

	return (
		<div
			onMouseDown={handleMouseDown}
			onClick={handleClick}
			className={className}
			style={{ userSelect: "none" }}
		>
			{children}
		</div>
	);
}