"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	BarChart3,
	Briefcase,
	FolderOpen,
	Grid3X3,
	List,
	Plus,
	Search,
	Settings,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { CreateTeamDialog } from "./create-team-dialog";
import { TeamActivityTab } from "./team-activity-tab";
import { TeamFilesTab } from "./team-files-tab";
import { TeamMembersTab } from "./team-members-tab";
import { TeamProjectsTab } from "./team-projects-tab";
import { TeamSettingsTab } from "./team-settings-tab";
import { TeamStatsTab } from "./team-stats-tab";
import { TeamTasksTab } from "./team-tasks-tab";

type ViewMode = "grid" | "list";

export function ConstructionTeamsLinear() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");
	const [selectedTeam, setSelectedTeam] =
		useState<Id<"constructionTeams"> | null>(null);
	const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

	const { orgId } = useParams({
		from: "/construction/$orgId/construction-teams",
	});

	// Fetch teams
	const teams = useQuery(api.constructionTeams.list, {
		organizationId: orgId as Id<"organizations">,
	});

	// Fetch selected team details
	const teamDetails = useQuery(
		api.constructionTeams.getTeamWithStats,
		selectedTeam ? { teamId: selectedTeam } : "skip",
	);

	// Filter teams
	const filteredTeams = teams?.filter((team) => {
		const matchesSearch = team.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
		const matchesDepartment =
			selectedDepartment === "all" || team.department === selectedDepartment;
		return matchesSearch && matchesDepartment;
	});

	// Team stats
	const teamStats = {
		totalTeams: teams?.length || 0,
		totalMembers:
			teams?.reduce((acc, team) => acc + (team.memberCount || 0), 0) || 0,
		activeProjects:
			teams?.reduce((acc, team) => acc + (team.activeProjectsCount || 0), 0) ||
			0,
		completedTasks:
			teams?.reduce((acc, team) => acc + (team.completedTasksCount || 0), 0) ||
			0,
	};

	return (
		<div className="flex h-full">
			{/* Teams List Sidebar */}
			<div className="flex w-80 flex-col border-r">
				<div className="space-y-4 p-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-lg">Команды</h2>
						<Button size="sm" onClick={() => setIsCreateTeamOpen(true)}>
							<Plus className="mr-1 h-4 w-4" />
							Создать
						</Button>
					</div>

					{/* Search and Filters */}
					<div className="space-y-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Поиск команд..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						<Select
							value={selectedDepartment}
							onValueChange={setSelectedDepartment}
						>
							<SelectTrigger>
								<SelectValue placeholder="Все отделы" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все отделы</SelectItem>
								<SelectItem value="design">Дизайн</SelectItem>
								<SelectItem value="construction">Строительство</SelectItem>
								<SelectItem value="engineering">Инженерия</SelectItem>
								<SelectItem value="management">Управление</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* View Mode Toggle */}
					<div className="flex items-center gap-1 rounded-md bg-muted p-1">
						<Button
							variant={viewMode === "grid" ? "secondary" : "ghost"}
							size="sm"
							className="flex-1"
							onClick={() => setViewMode("grid")}
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "secondary" : "ghost"}
							size="sm"
							className="flex-1"
							onClick={() => setViewMode("list")}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-2 gap-2">
						<Card>
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="font-semibold text-2xl">
											{teamStats.totalTeams}
										</p>
										<p className="text-muted-foreground text-xs">Команд</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<Activity className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="font-semibold text-2xl">
											{teamStats.totalMembers}
										</p>
										<p className="text-muted-foreground text-xs">Участников</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Teams List */}
				<ScrollArea className="flex-1">
					<div className="space-y-2 p-4">
						{!teams ? (
							<>
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-20 w-full" />
								))}
							</>
						) : filteredTeams?.length === 0 ? (
							<div className="py-8 text-center">
								<Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground text-sm">
									Команды не найдены
								</p>
							</div>
						) : (
							<>
								{viewMode === "grid" ? (
									<div className="grid gap-2">
										{filteredTeams?.map((team) => (
											<motion.div
												key={team._id}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.2 }}
											>
												<Card
													className={`cursor-pointer transition-colors ${
														selectedTeam === team._id
															? "border-primary bg-accent"
															: "hover:bg-accent/50"
													}`}
													onClick={() => setSelectedTeam(team._id)}
												>
													<CardContent className="p-4">
														<div className="space-y-2">
															<div className="flex items-start justify-between">
																<h3 className="font-medium">{team.name}</h3>
																<Badge variant="secondary" className="text-xs">
																	{team.memberCount || 0}
																</Badge>
															</div>
															<div className="flex items-center gap-4 text-muted-foreground text-xs">
																<span className="flex items-center gap-1">
																	<FolderOpen className="h-3 w-3" />
																	{team.activeProjectsCount || 0} проектов
																</span>
																<span className="flex items-center gap-1">
																	<Activity className="h-3 w-3" />
																	{team.completedTasksCount || 0} задач
																</span>
															</div>
														</div>
													</CardContent>
												</Card>
											</motion.div>
										))}
									</div>
								) : (
									<div className="space-y-1">
										{filteredTeams?.map((team) => (
											<motion.div
												key={team._id}
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ duration: 0.2 }}
												className={`flex cursor-pointer items-center justify-between rounded-md p-3 transition-colors ${
													selectedTeam === team._id
														? "bg-accent"
														: "hover:bg-accent/50"
												}`}
												onClick={() => setSelectedTeam(team._id)}
											>
												<div className="flex items-center gap-3">
													<Users className="h-4 w-4 text-muted-foreground" />
													<div>
														<p className="font-medium text-sm">{team.name}</p>
														<p className="text-muted-foreground text-xs">
															{team.memberCount || 0} участников
														</p>
													</div>
												</div>
												<Badge variant="outline" className="text-xs">
													{team.activeProjectsCount || 0}
												</Badge>
											</motion.div>
										))}
									</div>
								)}
							</>
						)}
					</div>
				</ScrollArea>
			</div>

			{/* Team Details */}
			<div className="flex flex-1 flex-col">
				{selectedTeam && teamDetails ? (
					<>
						{/* Team Header */}
						<div className="border-b">
							<div className="p-6">
								<div className="flex items-start justify-between">
									<div>
										<h1 className="font-semibold text-2xl">
											{teamDetails.name}
										</h1>
										<div className="mt-4 flex items-center gap-4">
											<Badge variant="secondary">
												{teamDetails.department?.name}
											</Badge>
											<span className="text-muted-foreground text-sm">
												Создана{" "}
												{format(
													new Date(teamDetails._creationTime),
													"d MMMM yyyy",
													{ locale: ru },
												)}
											</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button variant="destructive" size="sm">
											<Trash2 className="mr-1 h-4 w-4" />
											Удалить
										</Button>
									</div>
								</div>

								{/* Quick Stats */}
								<div className="mt-6 grid grid-cols-4 gap-4">
									<Card>
										<CardContent className="p-4">
											<div className="flex items-center gap-3">
												<div className="rounded-md bg-primary/10 p-2">
													<Users className="h-5 w-5 text-primary" />
												</div>
												<div>
													<p className="font-semibold text-2xl">
														{teamDetails.stats?.memberCount || 0}
													</p>
													<p className="text-muted-foreground text-sm">
														Участников
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="p-4">
											<div className="flex items-center gap-3">
												<div className="rounded-md bg-blue-500/10 p-2">
													<FolderOpen className="h-5 w-5 text-blue-500" />
												</div>
												<div>
													<p className="font-semibold text-2xl">
														{teamDetails.stats?.activeProjectsCount || 0}
													</p>
													<p className="text-muted-foreground text-sm">
														Проектов
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="p-4">
											<div className="flex items-center gap-3">
												<div className="rounded-md bg-green-500/10 p-2">
													<Activity className="h-5 w-5 text-green-500" />
												</div>
												<div>
													<p className="font-semibold text-2xl">
														{teamDetails.stats?.completedTasksCount || 0}
													</p>
													<p className="text-muted-foreground text-sm">
														Выполнено
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardContent className="p-4">
											<div className="flex items-center gap-3">
												<div className="rounded-md bg-orange-500/10 p-2">
													<BarChart3 className="h-5 w-5 text-orange-500" />
												</div>
												<div>
													<p className="font-semibold text-2xl">
														{teamDetails.stats?.avgCompletionRate || 0}%
													</p>
													<p className="text-muted-foreground text-sm">
														Эффективность
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</div>
						</div>

						{/* Tabs */}
						<Tabs defaultValue="members" className="flex-1">
							<TabsList className="h-12 w-full justify-start rounded-none border-b px-6">
								<TabsTrigger
									value="members"
									className="data-[state=active]:border-b-2"
								>
									<Users className="mr-2 h-4 w-4" />
									Участники
								</TabsTrigger>
								<TabsTrigger
									value="projects"
									className="data-[state=active]:border-b-2"
								>
									<Briefcase className="mr-2 h-4 w-4" />
									Проекты
								</TabsTrigger>
								<TabsTrigger
									value="tasks"
									className="data-[state=active]:border-b-2"
								>
									<Activity className="mr-2 h-4 w-4" />
									Задачи
								</TabsTrigger>
								<TabsTrigger
									value="activity"
									className="data-[state=active]:border-b-2"
								>
									<Activity className="mr-2 h-4 w-4" />
									Активность
								</TabsTrigger>
								<TabsTrigger
									value="files"
									className="data-[state=active]:border-b-2"
								>
									<FolderOpen className="mr-2 h-4 w-4" />
									Файлы
								</TabsTrigger>
								<TabsTrigger
									value="stats"
									className="data-[state=active]:border-b-2"
								>
									<BarChart3 className="mr-2 h-4 w-4" />
									Статистика
								</TabsTrigger>
								<TabsTrigger
									value="settings"
									className="data-[state=active]:border-b-2"
								>
									<Settings className="mr-2 h-4 w-4" />
									Настройки
								</TabsTrigger>
							</TabsList>

							<TabsContent value="members" className="flex-1 p-0">
								<TeamMembersTab
									teamId={selectedTeam}
									organizationId={orgId as Id<"organizations">}
								/>
							</TabsContent>

							<TabsContent value="projects" className="flex-1 p-0">
								<TeamProjectsTab teamId={selectedTeam} />
							</TabsContent>

							<TabsContent value="tasks" className="flex-1 p-0">
								<TeamTasksTab teamId={selectedTeam} />
							</TabsContent>

							<TabsContent value="activity" className="flex-1 p-0">
								<TeamActivityTab teamId={selectedTeam} />
							</TabsContent>

							<TabsContent value="files" className="flex-1 p-0">
								<TeamFilesTab teamId={selectedTeam} />
							</TabsContent>

							<TabsContent value="stats" className="flex-1 p-0">
								<TeamStatsTab teamId={selectedTeam} />
							</TabsContent>

							<TabsContent value="settings" className="flex-1 p-0">
								<TeamSettingsTab teamId={selectedTeam} />
							</TabsContent>
						</Tabs>
					</>
				) : (
					<div className="flex flex-1 items-center justify-center">
						<div className="text-center">
							<Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
							<h3 className="mb-2 font-medium text-lg">Выберите команду</h3>
							<p className="text-muted-foreground text-sm">
								Выберите команду из списка для просмотра деталей
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Create Team Dialog */}
			<CreateTeamDialog
				open={isCreateTeamOpen}
				onOpenChange={setIsCreateTeamOpen}
				organizationId={orgId as Id<"organizations">}
			/>
		</div>
	);
}
