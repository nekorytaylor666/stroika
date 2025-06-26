"use client";

import {
	Building,
	Calculator,
	Calendar,
	FileText,
	MapPin,
	MoreHorizontal,
	Settings,
	Shield,
	Truck,
} from "lucide-react";

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
import { Link, useParams } from "@tanstack/react-router";

const constructionManagementItems = [
	{
		name: "Календарь проектов",
		url: "/construction/$orgId/planning/calendar",
		icon: Calendar,
		description: "Планирование и сроки",
	},
	{
		name: "Смета и расчеты",
		url: "/construction/$orgId/planning/estimates",
		icon: Calculator,
		description: "Бюджеты и расчеты",
	},
	{
		name: "Объекты и локации",
		url: "/construction/$orgId/planning/locations",
		icon: MapPin,
		description: "География строительства",
	},
	{
		name: "Логистика",
		url: "/construction/$orgId/planning/logistics",
		icon: Truck,
		description: "Снабжение и материалы",
	},
];

const constructionSettingsItems = [
	{
		name: "Настройки ССП",
		url: "/construction/$orgId/settings",
		icon: Settings,
		description: "Конфигурация системы",
	},
	{
		name: "Отчеты",
		url: "/construction/$orgId/settings/reports",
		icon: FileText,
		description: "Настройка отчетности",
	},
	{
		name: "Организация",
		url: "/construction/$orgId/members",
		icon: Building,
		description: "Участники, команды и права",
	},
	{
		name: "Администрирование",
		url: "/construction/$orgId/admin",
		icon: Shield,
		description: "Системное администрирование",
	},
];

export function NavConstructionTools() {
	const params = useParams({ from: "/construction/$orgId" });

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Инструменты планирования</SidebarGroupLabel>
			<SidebarMenu>
				{constructionManagementItems.slice(0, 2).map((item) => (
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
									<span>Дополнительно</span>
								</span>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-64 rounded-lg"
							side="bottom"
							align="start"
						>
							{constructionManagementItems.slice(2).map((item) => (
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
							<DropdownMenuSeparator />
							{constructionSettingsItems.map((item) => (
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
