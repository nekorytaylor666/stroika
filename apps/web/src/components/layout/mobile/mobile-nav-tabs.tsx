"use client";

import { cn } from "@/lib/utils";
import { useConstructionCreateIssueStore } from "@/store/construction/construction-create-issue-store";
import { api } from "@stroika/backend";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Building, CheckSquare, Home, Inbox, Plus, User } from "lucide-react";

interface MobileNavItem {
	name: string;
	href: string;
	icon: typeof Home;
	action?: () => void;
}

export function MobileNavTabs() {
	const location = useLocation();
	const organizations = useQuery(api.organizations.getUserOrganizations);
	const orgId = organizations?.[0]?._id;
	const { openModal } = useConstructionCreateIssueStore();

	if (!orgId) return null;

	const navItems: MobileNavItem[] = [
		{
			name: "Главная",
			href: `/construction/${orgId}/construction-projects`,
			icon: Home,
		},
		{
			name: "Входящие",
			href: `/construction/${orgId}/inbox`,
			icon: Inbox,
		},
		{
			name: "Создать",
			href: "#",
			icon: Plus,
			action: () => openModal(),
		},
		{
			name: "Задачи",
			href: `/construction/${orgId}/tasks`,
			icon: CheckSquare,
		},
		{
			name: "Профиль",
			href: `/settings`,
			icon: User,
		},
	];

	return (
		<div className="safe-area-bottom fixed right-0 bottom-0 left-0 z-50 border-t bg-background lg:hidden">
			<nav className="flex h-16 items-center justify-around px-2">
				{navItems.map((item) => {
					const isActive = location.pathname.includes(item.href.split("/")[3]);
					const Icon = item.icon;

					if (item.action) {
						return (
							<button
								key={item.name}
								onClick={item.action}
								className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors"
							>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
									<Icon className="h-5 w-5" />
								</div>
								<span className="text-[10px] text-muted-foreground">
									{item.name}
								</span>
							</button>
						);
					}

					return (
						<Link
							key={item.name}
							to={item.href}
							className={cn(
								"flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors",
								isActive
									? "text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="h-5 w-5" />
							<span className="text-[10px]">{item.name}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
