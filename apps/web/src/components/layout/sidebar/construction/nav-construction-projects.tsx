"use client";

import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Activity,
	BarChart3,
	Building2,
	CalendarDays,
	CheckSquare,
	ChevronRight,
	FileText,
	DollarSign,
	Paperclip,
	Plus,
	Settings,
	Star,
	StarOff,
	Users,
} from "lucide-react";
import { useState } from "react";

export function NavConstructionProjects() {
	const params = useParams({ from: "/construction/$orgId" });
	const projects = useQuery(api.constructionProjects.getAll);
	const [favoriteProjects, setFavoriteProjects] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(true);

	// Get the 5 most recent projects
	const recentProjects = projects;

	// Filter favorite projects
	const favProjects =
		projects?.filter((p) => favoriteProjects.includes(p._id)) || [];

	const toggleFavorite = (projectId: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setFavoriteProjects((prev) =>
			prev.includes(projectId)
				? prev.filter((id) => id !== projectId)
				: [...prev, projectId],
		);
	};

	const getProjectLinks = (projectId: string) => [
		{
			name: "Обзор",
			icon: Building2,
			url: `/construction/${params.orgId}/projects/${projectId}/overview`,
		},
		{
			name: "Задачи",
			icon: CheckSquare,
			url: `/construction/${params.orgId}/projects/${projectId}/tasks`,
		},
		{
			name: "Финансы",
			icon: DollarSign,
			url: `/construction/${params.orgId}/projects/${projectId}/finance`,
		},
		{
			name: "Файлы",
			icon: Paperclip,
			url: `/construction/${params.orgId}/projects/${projectId}/attachments`,
		},
		{
			name: "Активность",
			icon: Activity,
			url: `/construction/${params.orgId}/projects/${projectId}/activity`,
		},
		{
			name: "Документы",
			icon: FileText,
			url: `/construction/${params.orgId}/projects/${projectId}/legal-documents`,
		},
		{
			name: "Календарь",
			icon: CalendarDays,
			url: `/construction/${params.orgId}/projects/${projectId}/calendar`,
		},
		{
			name: "Команда",
			icon: Users,
			url: `/construction/${params.orgId}/projects/${projectId}/team`,
		},
		{
			name: "Аналитика",
			icon: BarChart3,
			url: `/construction/${params.orgId}/projects/${projectId}/analytics`,
		},
		{
			name: "Настройки",
			icon: Settings,
			url: `/construction/${params.orgId}/projects/${projectId}/settings`,
		},
	];

	if (!projects || projects.length === 0) {
		return null;
	}

	return (
		<SidebarGroup>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<SidebarGroupLabel asChild>
					<CollapsibleTrigger className="group/label w-full">
						<span className="flex-1 text-left">Быстрый доступ к проектам</span>
						<ChevronRight
							className={cn(
								"ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
								isOpen && "rotate-90",
							)}
						/>
					</CollapsibleTrigger>
				</SidebarGroupLabel>

				<CollapsibleContent>
					<SidebarMenu>
						{/* Favorite Projects */}
						{favProjects.length > 0 && (
							<>
								<SidebarMenuItem>
									<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
										Избранные
									</div>
								</SidebarMenuItem>
								{favProjects.map((project) => (
									<Collapsible key={project._id}>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton className="group">
													<Building2 className="h-4 w-4" />
													<span className="flex-1 truncate">
														{project.name}
													</span>
													<Button
														variant="ghost"
														size="icon"
														className="h-5 w-5 opacity-0 group-hover:opacity-100"
														onClick={(e) => toggleFavorite(project._id, e)}
													>
														<Star className="h-3 w-3 fill-current" />
													</Button>
													<ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
												</SidebarMenuButton>
											</CollapsibleTrigger>
											<CollapsibleContent>
												<SidebarMenuSub>
													{getProjectLinks(project._id).map((link) => (
														<SidebarMenuSubItem key={link.name}>
															<SidebarMenuSubButton asChild>
																<Link to={link.url}>
																	<link.icon className="h-3 w-3" />
																	<span>{link.name}</span>
																</Link>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													))}
												</SidebarMenuSub>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>
								))}
							</>
						)}

						{/* Recent Projects */}
						<SidebarMenuItem>
							<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
								Недавние проекты
							</div>
						</SidebarMenuItem>
						{recentProjects.map((project) => (
							<Collapsible key={project._id}>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton className="group">
											<Building2 className="h-4 w-4" />
											<span className="flex-1 truncate">{project.name}</span>
											<Button
												variant="ghost"
												size="icon"
												className="h-5 w-5 opacity-0 group-hover:opacity-100"
												onClick={(e) => toggleFavorite(project._id, e)}
											>
												{favoriteProjects.includes(project._id) ? (
													<Star className="h-3 w-3 fill-current" />
												) : (
													<StarOff className="h-3 w-3" />
												)}
											</Button>
											<ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{getProjectLinks(project._id).map((link) => (
												<SidebarMenuSubItem key={link.name}>
													<SidebarMenuSubButton asChild>
														<Link to={link.url}>
															<link.icon className="h-3 w-3" />
															<span>{link.name}</span>
														</Link>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											))}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						))}

						{/* View All Projects Link */}
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link
									to={`/construction/${params.orgId}/construction-projects`}
									className="text-muted-foreground hover:text-foreground"
								>
									<Plus className="h-4 w-4" />
									<span>Все проекты</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</CollapsibleContent>
			</Collapsible>
		</SidebarGroup>
	);
}
