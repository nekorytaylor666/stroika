"use client";

import { Link } from "@tanstack/react-router";
import {
	Archive,
	Bell,
	Box,
	ChevronRight,
	CopyMinus,
	Layers,
	Link as LinkIcon,
	MoreHorizontal,
	Settings,
} from "lucide-react";

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
import { teams } from "@/mock-data/teams";
import { RiDonutChartFill } from "@remixicon/react";

export function NavTeams() {
	const joinedTeams = teams.filter((t) => t.joined);
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Ваши команды</SidebarGroupLabel>
			<SidebarMenu>
				{joinedTeams.map((item, index) => (
					<Collapsible
						key={item.name}
						asChild
						defaultOpen={index === 0}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.name}>
									<div className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50">
										<div className="text-sm">{item.icon}</div>
									</div>
									<span className="text-sm">{item.name}</span>
									<span className="w-3 shrink-0">
										<ChevronRight className="w-full transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
									</span>
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
												<span>Настройки команды</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<LinkIcon className="size-4" />
												<span>Копировать ссылку</span>
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Archive className="size-4" />
												<span>Открыть архив</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem>
												<Bell className="size-4" />
												<span>Подписаться</span>
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem>
												<span>Покинуть команду...</span>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link to="/lndev-ui/team/CORE/all">
												<CopyMinus size={14} />
												<span>Задачи</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link to="/lndev-ui/team/CORE/all">
												<RiDonutChartFill size={14} />
												<span>Циклы</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link to="/lndev-ui/projects">
												<Box size={14} />
												<span>Проекты</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link to="#">
												<Layers size={14} />
												<span>Представления</span>
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
