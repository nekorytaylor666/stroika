"use client";

import {
	Gantt,
	GanttControls,
	type GanttTaskType,
} from "@/components/ui/gantt";
import { addDays, startOfDay } from "date-fns";

// Example tasks data
const exampleTasks: GanttTaskType[] = [
	// Development Phase
	{
		id: "1",
		name: "Project Setup",
		start: startOfDay(new Date()),
		end: addDays(startOfDay(new Date()), 2),
		progress: 1,
		group: "Development",
		assignee: {
			name: "John Doe",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
		},
		color: "hsl(142, 76%, 36%)",
	},
	{
		id: "2",
		name: "Database Design",
		start: addDays(startOfDay(new Date()), 1),
		end: addDays(startOfDay(new Date()), 4),
		progress: 0.8,
		dependencies: ["1"],
		group: "Development",
		assignee: {
			name: "Jane Smith",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
		},
	},
	{
		id: "3",
		name: "API Development",
		start: addDays(startOfDay(new Date()), 3),
		end: addDays(startOfDay(new Date()), 10),
		progress: 0.6,
		dependencies: ["2"],
		group: "Development",
		assignee: {
			name: "Mike Johnson",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
		},
	},
	{
		id: "4",
		name: "Frontend Implementation",
		start: addDays(startOfDay(new Date()), 5),
		end: addDays(startOfDay(new Date()), 12),
		progress: 0.4,
		dependencies: ["2"],
		group: "Development",
		assignee: {
			name: "Sarah Williams",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
		},
	},

	// Design Phase
	{
		id: "5",
		name: "UI/UX Design",
		start: startOfDay(new Date()),
		end: addDays(startOfDay(new Date()), 5),
		progress: 0.9,
		group: "Design",
		assignee: {
			name: "Emily Chen",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
		},
		color: "hsl(259, 90%, 55%)",
	},
	{
		id: "6",
		name: "Design System",
		start: addDays(startOfDay(new Date()), 3),
		end: addDays(startOfDay(new Date()), 7),
		progress: 0.7,
		dependencies: ["5"],
		group: "Design",
		assignee: {
			name: "Alex Brown",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
		},
		color: "hsl(259, 90%, 55%)",
	},

	// Testing Phase
	{
		id: "7",
		name: "Unit Testing",
		start: addDays(startOfDay(new Date()), 8),
		end: addDays(startOfDay(new Date()), 11),
		progress: 0.2,
		dependencies: ["3", "4"],
		group: "Testing",
		assignee: {
			name: "Tom Wilson",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
		},
		color: "hsl(45, 93%, 47%)",
	},
	{
		id: "8",
		name: "Integration Testing",
		start: addDays(startOfDay(new Date()), 11),
		end: addDays(startOfDay(new Date()), 14),
		progress: 0,
		dependencies: ["7"],
		group: "Testing",
		assignee: {
			name: "Lisa Garcia",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
		},
		color: "hsl(45, 93%, 47%)",
	},
	{
		id: "9",
		name: "User Acceptance Testing",
		start: addDays(startOfDay(new Date()), 13),
		end: addDays(startOfDay(new Date()), 15),
		progress: 0,
		dependencies: ["8"],
		group: "Testing",
		assignee: {
			name: "David Lee",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
		},
		color: "hsl(45, 93%, 47%)",
	},

	// Deployment
	{
		id: "10",
		name: "Production Deployment",
		start: addDays(startOfDay(new Date()), 16),
		end: addDays(startOfDay(new Date()), 17),
		progress: 0,
		dependencies: ["9"],
		group: "Deployment",
		assignee: {
			name: "Chris Martin",
			avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chris",
		},
		color: "hsl(0, 90%, 55%)",
	},
];

export function GanttExample() {
	return (
		<div className="flex h-screen flex-col gap-4 p-4">
			{/* Controls */}
			<div className="flex items-center justify-between">
				<h1 className="font-semibold text-2xl">Project Timeline</h1>
				<GanttControls />
			</div>

			{/* Gantt Chart */}
			<div className="flex-1 overflow-hidden">
				<Gantt
					tasks={exampleTasks}
					viewMode="week"
					cellWidth={40}
					rowHeight={56}
					sidebarWidth={300}
					headerHeight={80}
				/>
			</div>
		</div>
	);
}
