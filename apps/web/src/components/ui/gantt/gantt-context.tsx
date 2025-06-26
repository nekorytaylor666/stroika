"use client";

import { addDays, differenceInDays, format, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import React, { createContext, useContext, useReducer } from "react";

export interface GanttTask {
	id: string;
	name: string;
	start: Date;
	end: Date;
	progress?: number;
	dependencies?: string[];
	color?: string;
	group?: string;
	assignee?: {
		name: string;
		avatar?: string;
	};
}

export type ViewMode = "day" | "week" | "month" | "quarter" | "year";

interface GanttState {
	tasks: GanttTask[];
	viewMode: ViewMode;
	startDate: Date;
	endDate: Date;
	selectedTaskId: string | null;
	hoveredTaskId: string | null;
	isDragging: boolean;
	draggedTaskId: string | null;
	cellWidth: number;
	rowHeight: number;
	showWeekends: boolean;
	showDependencies: boolean;
	locale: Locale;
}

type GanttAction =
	| { type: "SET_TASKS"; tasks: GanttTask[] }
	| { type: "UPDATE_TASK"; taskId: string; updates: Partial<GanttTask> }
	| { type: "SET_VIEW_MODE"; viewMode: ViewMode }
	| { type: "SET_DATE_RANGE"; startDate: Date; endDate: Date }
	| { type: "SELECT_TASK"; taskId: string | null }
	| { type: "HOVER_TASK"; taskId: string | null }
	| { type: "START_DRAG"; taskId: string }
	| { type: "END_DRAG" }
	| { type: "SET_CELL_WIDTH"; width: number }
	| { type: "SET_ROW_HEIGHT"; height: number }
	| { type: "TOGGLE_WEEKENDS" }
	| { type: "TOGGLE_DEPENDENCIES" };

const ganttReducer = (state: GanttState, action: GanttAction): GanttState => {
	switch (action.type) {
		case "SET_TASKS":
			return { ...state, tasks: action.tasks };
		case "UPDATE_TASK":
			return {
				...state,
				tasks: state.tasks.map((task) =>
					task.id === action.taskId ? { ...task, ...action.updates } : task,
				),
			};
		case "SET_VIEW_MODE":
			return { ...state, viewMode: action.viewMode };
		case "SET_DATE_RANGE":
			return { ...state, startDate: action.startDate, endDate: action.endDate };
		case "SELECT_TASK":
			return { ...state, selectedTaskId: action.taskId };
		case "HOVER_TASK":
			return { ...state, hoveredTaskId: action.taskId };
		case "START_DRAG":
			return { ...state, isDragging: true, draggedTaskId: action.taskId };
		case "END_DRAG":
			return { ...state, isDragging: false, draggedTaskId: null };
		case "SET_CELL_WIDTH":
			return { ...state, cellWidth: action.width };
		case "SET_ROW_HEIGHT":
			return { ...state, rowHeight: action.height };
		case "TOGGLE_WEEKENDS":
			return { ...state, showWeekends: !state.showWeekends };
		case "TOGGLE_DEPENDENCIES":
			return { ...state, showDependencies: !state.showDependencies };
		default:
			return state;
	}
};

interface GanttContextValue extends GanttState {
	dispatch: React.Dispatch<GanttAction>;
	getTaskPosition: (task: GanttTask) => { x: number; width: number };
	getDatePosition: (date: Date) => number;
	getPositionDate: (x: number) => Date;
	getDatesInRange: () => Date[];
}

const GanttContext = createContext<GanttContextValue | undefined>(undefined);

interface GanttProviderProps {
	children: React.ReactNode;
	tasks?: GanttTask[];
	viewMode?: ViewMode;
	startDate?: Date;
	endDate?: Date;
	cellWidth?: number;
	rowHeight?: number;
	showWeekends?: boolean;
	showDependencies?: boolean;
	locale?: Locale;
}

export function GanttProvider({
	children,
	tasks = [],
	viewMode = "week",
	startDate,
	endDate,
	cellWidth = 40,
	rowHeight = 56,
	showWeekends = true,
	showDependencies = true,
	locale = ru,
}: GanttProviderProps) {
	// Calculate default date range from tasks
	const defaultStartDate = tasks.length
		? new Date(Math.min(...tasks.map((t) => t.start.getTime())))
		: startOfDay(new Date());
	const defaultEndDate = tasks.length
		? new Date(Math.max(...tasks.map((t) => t.end.getTime())))
		: addDays(defaultStartDate, 30);

	const [state, dispatch] = useReducer(ganttReducer, {
		tasks,
		viewMode,
		startDate: startDate || defaultStartDate,
		endDate: endDate || defaultEndDate,
		selectedTaskId: null,
		hoveredTaskId: null,
		isDragging: false,
		draggedTaskId: null,
		cellWidth,
		rowHeight,
		showWeekends,
		showDependencies,
		locale,
	});

	const getDatePosition = (date: Date): number => {
		const totalDays = differenceInDays(state.endDate, state.startDate);
		const daysSinceStart = differenceInDays(date, state.startDate);
		return (daysSinceStart / totalDays) * (totalDays * state.cellWidth);
	};

	const getPositionDate = (x: number): Date => {
		const totalDays = differenceInDays(state.endDate, state.startDate);
		const totalWidth = totalDays * state.cellWidth;
		const daysFromStart = Math.round((x / totalWidth) * totalDays);
		return addDays(state.startDate, daysFromStart);
	};

	const getTaskPosition = (task: GanttTask) => {
		const x = getDatePosition(task.start);
		const endX = getDatePosition(task.end);
		return { x, width: endX - x };
	};

	const getDatesInRange = (): Date[] => {
		const dates: Date[] = [];
		const days = differenceInDays(state.endDate, state.startDate);
		for (let i = 0; i <= days; i++) {
			dates.push(addDays(state.startDate, i));
		}
		return dates;
	};

	const value: GanttContextValue = {
		...state,
		dispatch,
		getTaskPosition,
		getDatePosition,
		getPositionDate,
		getDatesInRange,
	};

	return <GanttContext.Provider value={value}>{children}</GanttContext.Provider>;
}

export function useGantt() {
	const context = useContext(GanttContext);
	if (!context) {
		throw new Error("useGantt must be used within a GanttProvider");
	}
	return context;
}