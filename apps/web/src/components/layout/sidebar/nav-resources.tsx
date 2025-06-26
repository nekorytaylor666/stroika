"use client";

import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, HelpCircle, MessageSquare } from "lucide-react";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const resourcesItems = [
	{
		name: "Документация",
		url: "/docs",
		icon: BookOpen,
	},
	{
		name: "Руководства",
		url: "/guides",
		icon: FileText,
	},
	{
		name: "Поддержка",
		url: "/support",
		icon: HelpCircle,
	},
	{
		name: "Обратная связь",
		url: "/feedback",
		icon: MessageSquare,
	},
];

export function NavResources() {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Ресурсы</SidebarGroupLabel>
			<SidebarMenu>
				{resourcesItems.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton asChild>
							<Link to={item.url}>
								<item.icon className="size-4" />
								<span>{item.name}</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
