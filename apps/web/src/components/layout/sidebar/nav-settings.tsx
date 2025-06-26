"use client";

import { Link } from "@tanstack/react-router";
import { Settings, Shield, User, Users } from "lucide-react";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const settingsItems = [
	{
		name: "Общие",
		url: "/settings",
		icon: Settings,
	},
	{
		name: "Профиль",
		url: "/settings/profile",
		icon: User,
	},
	{
		name: "Участники",
		url: "/settings/members",
		icon: Users,
	},
	{
		name: "Безопасность",
		url: "/settings/security",
		icon: Shield,
	},
];

export function NavSettings() {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Настройки</SidebarGroupLabel>
			<SidebarMenu>
				{settingsItems.map((item) => (
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
