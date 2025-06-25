"use client";

import { MoreHorizontal } from "lucide-react";

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
import {
	constructionManagementItems,
	constructionSettingsItems,
} from "@/mock-data/construction/construction-nav";
import { Link } from "@tanstack/react-router";

export function NavConstructionTools() {
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
										<Link to={item.url}>
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
									<Link to={item.url}>
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
									<Link to={item.url}>
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
