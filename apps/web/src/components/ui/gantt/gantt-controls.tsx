"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CalendarDays, Minus, Plus, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { type ViewMode, useGantt } from "./gantt-context";

export function GanttControls() {
	const { viewMode, cellWidth, dispatch } = useGantt();

	const zoomLevels = [
		{ value: 20, label: "50%" },
		{ value: 30, label: "75%" },
		{ value: 40, label: "100%" },
		{ value: 60, label: "150%" },
		{ value: 80, label: "200%" },
	];

	const currentZoomIndex = zoomLevels.findIndex((z) => z.value === cellWidth);
	const canZoomIn = currentZoomIndex < zoomLevels.length - 1;
	const canZoomOut = currentZoomIndex > 0;

	const handleZoomIn = () => {
		if (canZoomIn) {
			dispatch({
				type: "SET_CELL_WIDTH",
				width: zoomLevels[currentZoomIndex + 1].value,
			});
		}
	};

	const handleZoomOut = () => {
		if (canZoomOut) {
			dispatch({
				type: "SET_CELL_WIDTH",
				width: zoomLevels[currentZoomIndex - 1].value,
			});
		}
	};

	const handleZoomReset = () => {
		dispatch({ type: "SET_CELL_WIDTH", width: 40 });
	};

	return (
		<motion.div
			className="flex items-center gap-4 rounded-lg border bg-background p-2 shadow-sm"
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
		>
			{/* View mode selector */}
			<div className="flex items-center gap-2">
				<CalendarDays className="h-4 w-4 text-muted-foreground" />
				<Select
					value={viewMode}
					onValueChange={(value) =>
						dispatch({ type: "SET_VIEW_MODE", viewMode: value as ViewMode })
					}
				>
					<SelectTrigger className="h-8 w-[120px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="day">Day</SelectItem>
						<SelectItem value="week">Week</SelectItem>
						<SelectItem value="month">Month</SelectItem>
						<SelectItem value="quarter">Quarter</SelectItem>
						<SelectItem value="year">Year</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="h-4 w-px bg-border" />

			{/* Zoom controls */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={handleZoomOut}
					disabled={!canZoomOut}
				>
					<Minus className="h-3 w-3" />
				</Button>

				<div className="w-24">
					<Slider
						value={[cellWidth]}
						onValueChange={([value]) =>
							dispatch({ type: "SET_CELL_WIDTH", width: value })
						}
						min={20}
						max={80}
						step={10}
						className="w-full"
					/>
				</div>

				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={handleZoomIn}
					disabled={!canZoomIn}
				>
					<Plus className="h-3 w-3" />
				</Button>

				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={handleZoomReset}
				>
					<RotateCcw className="h-3 w-3" />
				</Button>

				<span className="min-w-[40px] text-center text-muted-foreground text-xs">
					{zoomLevels[currentZoomIndex]?.label || "100%"}
				</span>
			</div>

			<div className="h-4 w-px bg-border" />

			{/* Toggle controls */}
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-xs"
					onClick={() => dispatch({ type: "TOGGLE_WEEKENDS" })}
				>
					Weekends
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-xs"
					onClick={() => dispatch({ type: "TOGGLE_DEPENDENCIES" })}
				>
					Dependencies
				</Button>
			</div>
		</motion.div>
	);
}
