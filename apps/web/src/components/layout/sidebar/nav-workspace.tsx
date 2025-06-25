"use client";

import { Layers, LayoutList, MoreHorizontal } from "lucide-react";

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
import { workspaceItems } from "@/mock-data/side-bar-nav";
import { RiPresentationLine } from "@remixicon/react";
import { Link } from "@tanstack/react-router";

export function NavWorkspace() {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Рабочее пространство</SidebarGroupLabel>
			<SidebarMenu>
				{workspaceItems.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton asChild>
							<Link to={item.url}>
								<item.icon />
								<span>{item.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton asChild>
								<span>
									<MoreHorizontal />
									<span>Ещё</span>
								</span>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-48 rounded-lg"
							side="bottom"
							align="start"
						>
							<DropdownMenuItem>
								<RiPresentationLine className="text-muted-foreground" />
								<span>Инициативы</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Layers className="text-muted-foreground" />
								<span>Представления</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<LayoutList className="text-muted-foreground" />
								<span>Настроить боковую панель</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
