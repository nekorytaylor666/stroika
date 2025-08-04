"use client";

import {
	AlertTriangle,
	BarChart3,
	Building,
	CalendarDays,
	CalendarRange,
	CheckSquare,
	DollarSign,
	FileText,
	MoreHorizontal,
	TrendingUp,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConstructionData } from "@/hooks/use-construction-data";
import { Link, useParams } from "@tanstack/react-router";

const constructionMainItems = [
	{
		name: "Проекты",
		url: "/construction/$orgId/construction-projects",
		icon: Building,
		description: "Управление строительными проектами",
	},
	{
		name: "Команды",
		url: "/construction/$orgId/construction-teams",
		icon: Users,
		description: "Отделы и специалисты",
	},
	{
		name: "Задачи",
		url: "/construction/$orgId/tasks",
		icon: CheckSquare,
		description: "Управление задачами и поручениями",
	},
	{
		name: "Документы",
		url: "/construction/$orgId/attachments",
		icon: FileText,
		description: "Проектная документация и чертежи",
	},
	{
		name: "Календарь",
		url: "/construction/$orgId/calendar",
		icon: CalendarDays,
		description: "Календарь всех проектов и задач",
	},
	{
		name: "Диаграмма Ганта",
		url: "/construction/$orgId/gantt",
		icon: CalendarRange,
		description: "Визуализация сроков проектов и задач",
	},
];

export function NavConstructionMain() {
	const { seedData } = useConstructionData();
	const params = useParams({ from: "/construction/$orgId" });

	const handleSeedData = async () => {
		await seedData();
	};

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Организация</SidebarGroupLabel>
			<SidebarMenu>
				{constructionMainItems.map((item) => (
					<SidebarMenuItem key={item.name}>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<SidebarMenuButton asChild>
										<Link to={item.url.replace("$orgId", params.orgId)}>
											<item.icon />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</TooltipTrigger>
								<TooltipContent side="right">
									<p>{item.description}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
