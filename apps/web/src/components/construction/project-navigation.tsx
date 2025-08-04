"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import {
	Activity,
	BarChart3,
	Calendar,
	Folder,
	LayoutGrid,
	Paperclip,
	Settings,
	Users,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

export function ProjectNavigation() {
	const { orgId, projectId } = useParams({
		from: "/construction/$orgId/projects/$projectId",
	});
	const location = useLocation();

	const navItems: NavItem[] = [
		{
			label: "Обзор",
			href: `/construction/${orgId}/projects/${projectId}/overview`,
			icon: LayoutGrid,
		},
		{
			label: "Задачи",
			href: `/construction/${orgId}/projects/${projectId}/tasks`,
			icon: Folder,
		},
		{
			label: "Активность",
			href: `/construction/${orgId}/projects/${projectId}/activity`,
			icon: Activity,
		},
		{
			label: "Команда",
			href: `/construction/${orgId}/projects/${projectId}/team`,
			icon: Users,
		},
		{
			label: "Календарь",
			href: `/construction/${orgId}/projects/${projectId}/calendar`,
			icon: Calendar,
		},
		{
			label: "Аналитика",
			href: `/construction/${orgId}/projects/${projectId}/analytics`,
			icon: BarChart3,
		},
		{
			label: "Вложения",
			href: `/construction/${orgId}/projects/${projectId}/attachments`,
			icon: Paperclip,
		},
		{
			label: "Настройки",
			href: `/construction/${orgId}/projects/${projectId}/settings`,
			icon: Settings,
		},
	];

	return (
		<div className="flex items-center gap-1 border-b px-6 py-1">
			{navItems.map((item) => {
				const isActive = location.pathname === item.href;
				return (
					<Link key={item.href} to={item.href}>
						<Button
							variant={isActive ? "secondary" : "ghost"}
							size="sm"
							className={cn(
								"h-8 gap-2 px-3",
								isActive && "bg-accent font-medium",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Button>
					</Link>
				);
			})}
		</div>
	);
}
