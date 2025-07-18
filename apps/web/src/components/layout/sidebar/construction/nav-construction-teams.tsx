"use client";

import { Link, useParams } from "@tanstack/react-router";
import {
	Archive,
	Bell,
	Building,
	ChevronRight,
	MoreHorizontal,
	Settings,
	TrendingUp,
	Users,
	Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useConstructionData } from "@/hooks/use-construction-data";

export function NavConstructionTeams() {
	const { teams, isLoading } = useConstructionData();
	const params = useParams({ from: "/construction/$orgId" });

	if (isLoading) {
		return (
			<SidebarGroup>
				<SidebarGroupLabel>Строительные отделы</SidebarGroupLabel>
				<SidebarMenu>
					<div className="px-2 py-4 text-muted-foreground text-xs">
						Загружаем команды...
					</div>
				</SidebarMenu>
			</SidebarGroup>
		);
	}

	const joinedTeams = teams?.filter((t) => t.joined) || [];

	const getDepartmentColor = (department: string) => {
		switch (department) {
			case "design":
				return "text-blue-600";
			case "construction":
				return "text-orange-600";
			case "engineering":
				return "text-green-600";
			case "management":
				return "text-purple-600";
			default:
				return "text-gray-600";
		}
	};

	const getDepartmentName = (department: string) => {
		switch (department) {
			case "design":
				return "Проектирование";
			case "construction":
				return "Строительство";
			case "engineering":
				return "Инженерия";
			case "management":
				return "Управление";
			default:
				return "Общее";
		}
	};

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Строительные отделы</SidebarGroupLabel>
			<SidebarMenu>
				{joinedTeams.map((team, index) => (
					<Collapsible
						key={team._id}
						asChild
						defaultOpen={index === 0}
						className="group/collapsible"
					>
						<SidebarMenuItem className="gap-8">
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={team.name}>
									<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
										<div className="text-sm">
											<Users className="size-4" />
										</div>
									</div>
									<div className="flex flex-col items-start overflow-hidden">
										<span className="truncate font-medium text-sm">
											{team.shortName}
										</span>
										<span
											className={`text-xs ${getDepartmentColor(team.department)}`}
										>
											{getDepartmentName(team.department)}
										</span>
									</div>
									<div className="ml-auto flex items-center gap-1">
										<Badge
											variant={
												team.workload > 90
													? "destructive"
													: team.workload > 75
														? "secondary"
														: "outline"
											}
											className="px-1 py-0 text-xs"
										>
											{team.workload}%
										</Badge>
										<span className="w-3 shrink-0">
											<ChevronRight className="w-full transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</span>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<SidebarMenuAction asChild showOnHover>
												<div>
													<MoreHorizontal />
													<span className="sr-only">Ещё</span>
												</div>
											</SidebarMenuAction>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-48 rounded-lg"
											side="right"
											align="start"
										>
											<DropdownMenuItem>
												<Settings className="size-4" />
												<span>Настройки отдела</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<TrendingUp className="size-4" />
												<span>Анализ загруженности</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Archive className="size-4" />
												<span>Архив проектов</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem>
												<Bell className="size-4" />
												<span>Уведомления</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link
												to={`/construction/${params.orgId}/teams/${team._id}/all`}
											>
												<Building size={14} />
												<span>Проекты отдела</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link
												to={`/construction/${params.orgId}/teams/${team._id}`}
											>
												<Users size={14} />
												<span>Сотрудники</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link
												to={`/construction/${params.orgId}/analytics/workload`}
											>
												<TrendingUp size={14} />
												<span>Загруженность</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link to="#">
												<Wrench size={14} />
												<span>Инструменты</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
