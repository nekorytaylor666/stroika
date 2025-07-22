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
		name: "Панель управления",
		url: "/construction/$orgId/construction-dashboard",
		icon: BarChart3,
		description: "Общий обзор показателей компании",
	},
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
		url: "/construction/$orgId/construction-tasks",
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

const constructionAnalyticsItems = [
	{
		name: "Финансовая отчетность",
		url: "/construction/$orgId/analytics/financial",
		icon: DollarSign,
		description: "Выручка и контрактная стоимость",
	},
	{
		name: "Загруженность ресурсов",
		url: "/construction/$orgId/analytics/workload",
		icon: TrendingUp,
		description: "Анализ загруженности команд",
	},
	{
		name: "Риски проектов",
		url: "/construction/$orgId/analytics/risks",
		icon: AlertTriangle,
		description: "Мониторинг проектных рисков",
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
			<SidebarGroupLabel>
				Система сбалансированных показателей
			</SidebarGroupLabel>
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
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton asChild>
								<span>
									<MoreHorizontal />
									<span>Аналитика</span>
								</span>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-64 rounded-lg"
							side="bottom"
							align="start"
						>
							{constructionAnalyticsItems.map((item, index) => (
								<DropdownMenuItem key={item.name} asChild>
									<Link to={item.url.replace("$orgId", params.orgId)}>
										<item.icon className="text-muted-foreground" />
										<div className="flex flex-col">
											<span>{item.name}</span>
											<span className="text-muted-foreground text-xs">
												{item.description}
											</span>
										</div>
									</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
