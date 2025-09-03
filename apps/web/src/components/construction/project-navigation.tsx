"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
	Link,
	useLocation,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import {
	Activity,
	BarChart3,
	Calendar,
	ChevronDown,
	FileText,
	Folder,
	LayoutGrid,
	Paperclip,
	Settings,
	Users,
} from "lucide-react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

export function ProjectNavigation() {
	const isMobile = useMobile();
	const navigate = useNavigate();
	const { orgId, projectId } = useParams({
		from: "/construction/$orgId/projects/$projectId",
	});
	const location = useLocation();

	const navItems: NavItem[] = [
		{
			label: "Обзор",
			href: `/construction/${orgId}/projects/${projectId}/overview`,
			icon: LayoutGrid,
		},
		{
			label: "Задачи",
			href: `/construction/${orgId}/projects/${projectId}/tasks`,
			icon: Folder,
		},
		{
			label: "Активность",
			href: `/construction/${orgId}/projects/${projectId}/activity`,
			icon: Activity,
		},
		{
			label: "Команда",
			href: `/construction/${orgId}/projects/${projectId}/team`,
			icon: Users,
		},
		{
			label: "Календарь",
			href: `/construction/${orgId}/projects/${projectId}/calendar`,
			icon: Calendar,
		},
		{
			label: "Аналитика",
			href: `/construction/${orgId}/projects/${projectId}/analytics`,
			icon: BarChart3,
		},
		{
			label: "Вложения",
			href: `/construction/${orgId}/projects/${projectId}/attachments`,
			icon: Paperclip,
		},
		{
			label: "Документы",
			href: `/construction/${orgId}/projects/${projectId}/legal-documents`,
			icon: FileText,
		},
		{
			label: "Настройки",
			href: `/construction/${orgId}/projects/${projectId}/settings`,
			icon: Settings,
		},
	];

	const currentNavItem = navItems.find(
		(item) => location.pathname === item.href,
	);

	const handleNavChange = (href: string) => {
		navigate({ to: href });
	};

	// Mobile view with select dropdown
	if (isMobile) {
		return (
			<div className="border-b px-4 py-3">
				<Select value={location.pathname} onValueChange={handleNavChange}>
					<SelectTrigger className="h-10 w-full justify-between">
						<div className="flex items-center gap-2">
							{currentNavItem && (
								<>
									<currentNavItem.icon className="h-4 w-4" />
									<span className="font-medium">{currentNavItem.label}</span>
								</>
							)}
						</div>
					</SelectTrigger>
					<SelectContent>
						{navItems.map((item) => (
							<SelectItem key={item.href} value={item.href}>
								<div className="flex items-center gap-2">
									<item.icon className="h-4 w-4" />
									<span>{item.label}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		);
	}

	// Desktop view with tab navigation
	return (
		<div className="flex items-center gap-1 border-b px-6 py-1">
			{navItems.map((item) => {
				const isActive = location.pathname === item.href;
				return (
					<Link key={item.href} to={item.href}>
						<Button
							variant={isActive ? "secondary" : "ghost"}
							size="sm"
							className={cn(
								"h-8 gap-2 px-3",
								isActive && "bg-accent font-medium",
							)}
						>
							<item.icon className="h-4 w-4" />
							{item.label}
						</Button>
					</Link>
				);
			})}
		</div>
	);
}
