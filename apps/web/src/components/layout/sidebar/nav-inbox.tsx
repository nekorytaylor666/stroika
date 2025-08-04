"use client";

import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInboxStore } from "@/store/inbox-store";
import { api } from "@stroika/backend";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Inbox } from "lucide-react";

export function NavInbox() {
	const { unreadCount } = useInboxStore();
	const organizations = useQuery(api.organizations.getUserOrganizations);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<Link
					to="/construction/$orgId/inbox"
					disabled={!organizations?.[0]._id}
					params={{
						// @ts-expect-error - Reason: disabled link if no id
						orgId: organizations?.[0]._id,
					}}
					className="w-full"
				>
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
