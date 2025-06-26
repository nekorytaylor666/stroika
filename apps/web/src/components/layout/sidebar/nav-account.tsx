"use client";

import { Link } from "@tanstack/react-router";
import { Bell, CreditCard, Shield, User } from "lucide-react";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const accountItems = [
	{
		name: "Профиль",
		url: "/account/profile",
		icon: User,
	},
	{
		name: "Подписка",
		url: "/account/billing",
		icon: CreditCard,
	},
	{
		name: "Уведомления",
		url: "/account/notifications",
		icon: Bell,
	},
	{
		name: "Безопасность",
		url: "/account/security",
		icon: Shield,
	},
];

export function NavAccount() {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Account</SidebarGroupLabel>
			<SidebarMenu>
				{accountItems.map((item) => (
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
