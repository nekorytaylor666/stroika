"use client";

import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInboxStore } from "@/store/inbox-store";
import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";

export function NavInbox() {
	const { unreadCount } = useInboxStore();
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<Link to="/" className="w-full">
					<SidebarMenuButton>
						<Inbox size={16} />
						<span>Входящие</span>
						{unreadCount > 0 && (
							<SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>
						)}
					</SidebarMenuButton>
				</Link>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
