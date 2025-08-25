"use client";

import { LinearActivityFeed } from "@/components/common/activity/linear-activity-feed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
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
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	Calendar,
	Check,
	CheckCircle2,
	Filter,
	Grid3X3,
	List,
	Search,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectTeamMemberCard } from "./project-team-member-card";

interface ProjectTeamManagementLinearProps {
	projectId: Id<"constructionProjects">;
}

export function ProjectTeamManagementLinear({
	projectId,
}: ProjectTeamManagementLinearProps) {
	const isMobile = useMobile();
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);
	const [memberSearchQuery, setMemberSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchQuery, setSearchQuery] = useState("");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("name");
	const [selectedMember, setSelectedMember] = useState<any>(null);
	const [activeTab, setActiveTab] = useState("members");
	const [showFilters, setShowFilters] = useState(false);

	// Fetch team data with statistics
	const teamData = useQuery(api.constructionTeams.getProjectTeamWithStats, {
		projectId,
	});

	// Fetch all users for adding members
	const allUsers = useQuery(api.users.getAll);

	// Fetch departments for filtering
	const departments = useQuery(api.departments.list);

	// Mutations
	const addTeamMember = useMutation(api.constructionTeams.addTeamMember);
	const removeTeamMember = useMutation(api.constructionTeams.removeTeamMember);

	const handleAddMembers = async () => {
		if (selectedUserIds.length === 0) return;

		try {
			// Add all selected members
			await Promise.all(
				selectedUserIds.map((userId) =>
					addTeamMember({
						projectId,
						userId,
					}),
				),
			);

			toast.success(
				selectedUserIds.length === 1
					? "Участник добавлен в команду"
					: `${selectedUserIds.length} участников добавлено в команду`,
			);
			setIsAddMemberOpen(false);
			setSelectedUserIds([]);
			setMemberSearchQuery("");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при добавлении участников",
			);
		}
	};

	const toggleUserSelection = (userId: Id<"users">) => {
		setSelectedUserIds((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleRemoveMember = async (userId: Id<"users">) => {
		try {
			const result = await removeTeamMember({
				projectId,
				userId,
			});
			toast.success(
				`Участник удален из команды${
					result.unassignedTasks > 0
						? `. ${result.unassignedTasks} задач были сняты с назначения`
						: ""
				}`,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при удалении участника",
			);
		}
	};

	// Filter and sort members
	const filteredMembers = teamData?.members.filter((member) => {
		const matchesSearch =
			searchQuery === "" ||
			member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.email.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesDepartment =
			departmentFilter === "all" || member.department?._id === departmentFilter;

		const matchesStatus =
			statusFilter === "all" ||
			(statusFilter === "available" && member.availability !== "off") ||
			(statusFilter === "on-site" && member.availability === "on-site") ||
			(statusFilter === "office" && member.availability === "office") ||
			(statusFilter === "remote" && member.availability === "remote");

		return matchesSearch && matchesDepartment && matchesStatus;
	});

	// Sort members
	const sortedMembers = filteredMembers?.sort((a, b) => {
		switch (sortBy) {
			case "name":
				return a.name.localeCompare(b.name);
			case "workload":
				return (b.workload || 0) - (a.workload || 0);
			case "performance": {
				const aRate =
					a.taskStats.plan > 0 ? a.taskStats.fact / a.taskStats.plan : 0;
				const bRate =
					b.taskStats.plan > 0 ? b.taskStats.fact / b.taskStats.plan : 0;
				return bRate - aRate;
			}
			case "tasks":
				return b.taskStats.total - a.taskStats.total;
			default:
				return 0;
		}
	});

	// Filter out existing team members from available users and apply search
	const availableUsers = allUsers
		?.filter((user): user is NonNullable<typeof user> => user !== null)
		.filter(
			(user) => !teamData?.members.some((member) => member._id === user._id),
		)
		.filter((user) => {
			if (!memberSearchQuery) return true;
			const searchLower = memberSearchQuery.toLowerCase();
			return (
				user.name.toLowerCase().includes(searchLower) ||
				user.email.toLowerCase().includes(searchLower)
			);
		});

	if (!teamData) {
		return <ProjectTeamSkeleton />;
	}

	const upcomingDeadlines = teamData.members.reduce((count, member) => {
		return (
			count +
			member.recentTasks.filter((task) => {
				if (!task.dueDate) return false;
				const dueDate = new Date(task.dueDate);
				const today = new Date();
				const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
				return dueDate >= today && dueDate <= weekFromNow;
			}).length
		);
	}, 0);

	return (
		<div className="flex h-full flex-col space-y-4">
			{/* Header with View Toggle */}
			<div className="flex flex-shrink-0 items-center justify-between">
				<div>
					<h2 className="font-semibold text-xl">Команда проекта</h2>
					{!isMobile && (
						<p className="text-muted-foreground text-sm">
							Управление участниками и отслеживание активности
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					{!isMobile && (
						<>
							<Button
								variant={viewMode === "grid" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("grid")}
								className="gap-2"
							>
								<Grid3X3 className="h-4 w-4" />
								Сетка
							</Button>
							<Button
								variant={viewMode === "list" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("list")}
								className="gap-2"
							>
								<List className="h-4 w-4" />
								Список
							</Button>
						</>
					)}
					<Button
						size="sm"
						onClick={() => setIsAddMemberOpen(true)}
						className={cn(isMobile && "px-2")}
					>
						<UserPlus className={cn("h-4 w-4", !isMobile && "mr-2")} />
						{!isMobile && "Добавить участника"}
					</Button>
				</div>
			</div>

			{/* Team Overview Stats */}
			<div
				className={cn(
					"grid flex-shrink-0 gap-3",
					isMobile ? "grid-cols-2" : "md:grid-cols-4",
				)}
			>
				<Card className="p-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">Участники</p>
						<Users className="h-4 w-4 text-muted-foreground" />
					</div>
					<p className="mt-1 font-semibold text-xl">
						{teamData.teamStats.totalMembers}
					</p>
					<p className="text-muted-foreground text-xs">
						{teamData.members.filter((m) => m.availability !== "off").length}{" "}
						активных
					</p>
				</Card>
				<Card className="p-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">Активные задачи</p>
						<Activity className="h-4 w-4 text-blue-500" />
					</div>
					<p className="mt-1 font-semibold text-xl">
						{teamData.teamStats.totalTasks - teamData.teamStats.completedTasks}
					</p>
					<p className="text-muted-foreground text-xs">
						{teamData.teamStats.unassignedTasks} не назначено
					</p>
				</Card>
				<Card className="p-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">Выполнение</p>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</div>
					<p className="mt-1 font-semibold text-xl">
						{Math.round(
							(teamData.teamStats.completedTasks /
								teamData.teamStats.plannedTasks) *
								100,
						) || 0}
						%
					</p>
					<p className="text-muted-foreground text-xs">
						{teamData.teamStats.completedTasks} из{" "}
						{teamData.teamStats.plannedTasks}
					</p>
				</Card>
				<Card className="p-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">Сроки</p>
						<Calendar className="h-4 w-4 text-orange-500" />
					</div>
					<p className="mt-1 font-semibold text-xl">{upcomingDeadlines}</p>
					<p className="text-muted-foreground text-xs">На этой неделе</p>
				</Card>
			</div>

			{/* Tabs for Members and Activity */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex min-h-0 flex-1 flex-col space-y-3"
			>
				<TabsList className="grid w-full max-w-[400px] flex-shrink-0 grid-cols-2">
					<TabsTrigger value="members" className="gap-2">
						<Users className="h-4 w-4" />
						Участники команды
					</TabsTrigger>
					<TabsTrigger value="activity" className="gap-2">
						<Activity className="h-4 w-4" />
						Активность
					</TabsTrigger>
				</TabsList>

				{/* Members Tab */}
				<TabsContent
					value="members"
					className="flex min-h-0 flex-1 flex-col space-y-3 overflow-hidden"
				>
					{/* Filters Bar */}
					<Card className="flex-shrink-0 p-3">
						{isMobile ? (
							<div className="space-y-3">
								{/* Mobile Search */}
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Поиск участников..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
								</div>

								{/* Mobile Filters Toggle */}
								<div className="flex items-center justify-between">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowFilters(!showFilters)}
										className="gap-2"
									>
										<Filter className="h-4 w-4" />
										Фильтры
									</Button>
									<div className="flex gap-1">
										<Button
											variant={viewMode === "grid" ? "default" : "outline"}
											size="sm"
											onClick={() => setViewMode("grid")}
										>
											<Grid3X3 className="h-4 w-4" />
										</Button>
										<Button
											variant={viewMode === "list" ? "default" : "outline"}
											size="sm"
											onClick={() => setViewMode("list")}
										>
											<List className="h-4 w-4" />
										</Button>
									</div>
								</div>

								{/* Mobile Filters Panel */}
								{showFilters && (
									<div className="space-y-3 border-t pt-3">
										<Select
											value={departmentFilter}
											onValueChange={setDepartmentFilter}
										>
											<SelectTrigger>
												<SelectValue placeholder="Все отделы" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Все отделы</SelectItem>
												{departments?.map((dept) => (
													<SelectItem key={dept._id} value={dept._id}>
														{dept.displayName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Select
											value={statusFilter}
											onValueChange={setStatusFilter}
										>
											<SelectTrigger>
												<SelectValue placeholder="Все статусы" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Все статусы</SelectItem>
												<SelectItem value="available">Доступны</SelectItem>
												<SelectItem value="on-site">На объекте</SelectItem>
												<SelectItem value="office">В офисе</SelectItem>
												<SelectItem value="remote">Удаленно</SelectItem>
											</SelectContent>
										</Select>
										<Select value={sortBy} onValueChange={setSortBy}>
											<SelectTrigger>
												<SelectValue placeholder="Сортировка" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="name">По имени</SelectItem>
												<SelectItem value="workload">По загрузке</SelectItem>
												<SelectItem value="performance">
													По выполнению
												</SelectItem>
												<SelectItem value="tasks">По задачам</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</div>
						) : (
							<div className="flex flex-wrap items-center gap-3">
								<div className="relative min-w-[200px] flex-1">
									<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Поиск по имени или email..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
								</div>
								<Select
									value={departmentFilter}
									onValueChange={setDepartmentFilter}
								>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Все отделы" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Все отделы</SelectItem>
										{departments?.map((dept) => (
											<SelectItem key={dept._id} value={dept._id}>
												{dept.displayName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Все статусы" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Все статусы</SelectItem>
										<SelectItem value="available">Доступны</SelectItem>
										<SelectItem value="on-site">На объекте</SelectItem>
										<SelectItem value="office">В офисе</SelectItem>
										<SelectItem value="remote">Удаленно</SelectItem>
									</SelectContent>
								</Select>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger className="w-[180px]">
										<SelectValue placeholder="Сортировка" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="name">По имени</SelectItem>
										<SelectItem value="workload">По загрузке</SelectItem>
										<SelectItem value="performance">По выполнению</SelectItem>
										<SelectItem value="tasks">По задачам</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</Card>

					{/* Members Grid/List - Scrollable Container */}
					<div className="min-h-0 flex-1 overflow-y-auto">
						{sortedMembers?.length === 0 ? (
							<Card className="p-8">
								<div className="flex flex-col items-center justify-center text-center">
									<Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
									<h3 className="font-medium text-lg">Участники не найдены</h3>
									<p className="mt-2 text-muted-foreground text-sm">
										Попробуйте изменить параметры поиска или фильтры
									</p>
								</div>
							</Card>
						) : (
							<div
								className={cn(
									"pb-4",
									viewMode === "grid"
										? isMobile
											? "grid grid-cols-1 gap-3"
											: "grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
										: "space-y-2",
								)}
							>
								{sortedMembers?.map((member) => (
									<ProjectTeamMemberCard
										key={member._id}
										member={member}
										variant={viewMode}
										onRemove={() => handleRemoveMember(member._id)}
										onViewDetails={() => setSelectedMember(member)}
									/>
								))}
							</div>
						)}
					</div>
				</TabsContent>

				{/* Activity Tab */}
				<TabsContent
					value="activity"
					className="min-h-0 flex-1 overflow-y-auto"
				>
					<LinearActivityFeed
						type="project"
						projectId={projectId}
						className=" pb-4"
					/>
				</TabsContent>
			</Tabs>

			{/* Add Members Dialog/Drawer */}
			{isMobile ? (
				<Drawer
					open={isAddMemberOpen}
					onOpenChange={(open) => {
						setIsAddMemberOpen(open);
						if (!open) {
							setSelectedUserIds([]);
							setMemberSearchQuery("");
						}
					}}
				>
					<DrawerContent className="max-h-[90vh]">
						<DrawerHeader>
							<DrawerTitle>Добавить участников</DrawerTitle>
							<DrawerDescription>
								Выберите пользователей для добавления в команду
							</DrawerDescription>
						</DrawerHeader>
						<div className="flex flex-col space-y-4 p-4">
							{/* Search Input */}
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Поиск по имени..."
									value={memberSearchQuery}
									onChange={(e) => setMemberSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>

							{/* Selected Count */}
							{selectedUserIds.length > 0 && (
								<div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
									<p className="font-medium text-primary text-sm">
										Выбрано: {selectedUserIds.length}
									</p>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedUserIds([])}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							)}

							{/* Users List */}
							<div className="min-h-0 flex-1 overflow-y-auto">
								{availableUsers && availableUsers.length > 0 ? (
									<div className="space-y-2">
										{availableUsers.map((user) => (
											<div
												key={user._id}
												className={cn(
													"flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 active:bg-muted",
													selectedUserIds.includes(user._id) &&
														"border border-primary/20 bg-primary/10",
												)}
												onClick={() => toggleUserSelection(user._id)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														toggleUserSelection(user._id);
													}
												}}
												role="button"
												tabIndex={0}
											>
												<Checkbox
													checked={selectedUserIds.includes(user._id)}
													onCheckedChange={() => toggleUserSelection(user._id)}
												/>
												<Avatar className="h-10 w-10">
													<AvatarImage src={user.avatarUrl || undefined} />
													<AvatarFallback>
														{user.name
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="min-w-0 flex-1">
													<div className="truncate font-medium">
														{user.name}
													</div>
													<div className="truncate text-muted-foreground text-sm">
														{user.email}
													</div>
													{user.position && (
														<Badge variant="outline" className="mt-1 text-xs">
															{user.position}
														</Badge>
													)}
												</div>
												{selectedUserIds.includes(user._id) && (
													<Check className="h-5 w-5 flex-shrink-0 text-primary" />
												)}
											</div>
										))}
									</div>
								) : (
									<div className="flex h-[200px] flex-col items-center justify-center text-center">
										<Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
										<p className="text-muted-foreground text-sm">
											{memberSearchQuery
												? "Пользователи не найдены"
												: "Все пользователи уже добавлены"}
										</p>
									</div>
								)}
							</div>

							{/* Actions */}
							<div className="flex gap-2 border-t pt-4">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => {
										setIsAddMemberOpen(false);
										setSelectedUserIds([]);
										setMemberSearchQuery("");
									}}
								>
									Отмена
								</Button>
								<Button
									className="flex-1"
									onClick={handleAddMembers}
									disabled={selectedUserIds.length === 0}
								>
									Добавить{" "}
									{selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
								</Button>
							</div>
						</div>
					</DrawerContent>
				</Drawer>
			) : (
				<Dialog
					open={isAddMemberOpen}
					onOpenChange={(open) => {
						setIsAddMemberOpen(open);
						if (!open) {
							setSelectedUserIds([]);
							setMemberSearchQuery("");
						}
					}}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Добавить участников в команду</DialogTitle>
							<DialogDescription>
								Выберите одного или нескольких пользователей для добавления в
								команду проекта
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							{/* Search Input */}
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Поиск по имени или email..."
									value={memberSearchQuery}
									onChange={(e) => setMemberSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>

							{/* Selected Count */}
							{selectedUserIds.length > 0 && (
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground text-sm">
										Выбрано: {selectedUserIds.length} участник
										{selectedUserIds.length === 1 ? "" : "ов"}
									</p>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedUserIds([])}
									>
										Очистить выбор
									</Button>
								</div>
							)}

							{/* Users List */}
							<ScrollArea className="h-[400px] rounded-md border p-4">
								{availableUsers && availableUsers.length > 0 ? (
									<div className="space-y-2">
										{availableUsers.map((user) => (
											<div
												key={user._id}
												className={cn(
													"flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50",
													selectedUserIds.includes(user._id) && "bg-primary/10",
												)}
												onClick={() => toggleUserSelection(user._id)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														toggleUserSelection(user._id);
													}
												}}
												role="button"
												tabIndex={0}
											>
												<Checkbox
													checked={selectedUserIds.includes(user._id)}
													onCheckedChange={() => toggleUserSelection(user._id)}
												/>
												<Avatar className="h-10 w-10">
													<AvatarImage src={user.avatarUrl || undefined} />
													<AvatarFallback>
														{user.name
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1">
													<div className="font-medium">{user.name}</div>
													<div className="text-muted-foreground text-sm">
														{user.email}
													</div>
													{user.position && (
														<Badge variant="outline" className="mt-1">
															{user.position}
														</Badge>
													)}
												</div>
												{selectedUserIds.includes(user._id) && (
													<Check className="h-5 w-5 text-primary" />
												)}
											</div>
										))}
									</div>
								) : (
									<div className="flex h-[300px] flex-col items-center justify-center text-center">
										<Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
										<p className="text-muted-foreground">
											{memberSearchQuery
												? "Пользователи не найдены"
												: "Все пользователи уже добавлены в команду"}
										</p>
									</div>
								)}
							</ScrollArea>

							{/* Actions */}
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => {
										setIsAddMemberOpen(false);
										setSelectedUserIds([]);
										setMemberSearchQuery("");
									}}
								>
									Отмена
								</Button>
								<Button
									onClick={handleAddMembers}
									disabled={selectedUserIds.length === 0}
								>
									Добавить{" "}
									{selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			{/* Member Details Dialog */}
			<Dialog
				open={!!selectedMember}
				onOpenChange={() => setSelectedMember(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Информация об участнике</DialogTitle>
					</DialogHeader>
					{selectedMember && (
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage src={selectedMember.avatarUrl || undefined} />
									<AvatarFallback className="text-lg">
										{selectedMember.name
											.split(" ")
											.map((n: string) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="font-semibold text-lg">
										{selectedMember.name}
									</h3>
									<p className="text-muted-foreground">
										{selectedMember.email}
									</p>
									<div className="mt-1 flex items-center gap-2">
										{selectedMember.department && (
											<Badge variant="outline">
												{selectedMember.department.name}
											</Badge>
										)}
										{selectedMember.position && (
											<Badge variant="outline">
												{selectedMember.position.name}
											</Badge>
										)}
									</div>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<Card className="p-4">
									<h4 className="mb-3 font-medium">Статистика задач</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Всего задач:
											</span>
											<span className="font-medium">
												{selectedMember.taskStats.total}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Запланировано:
											</span>
											<span className="font-medium">
												{selectedMember.taskStats.plan}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Выполнено:</span>
											<span className="font-medium">
												{selectedMember.taskStats.fact}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-muted-foreground">Просрочено:</span>
											<span className="font-medium text-red-600">
												{selectedMember.taskStats.overdue || 0}
											</span>
										</div>
									</div>
								</Card>

								<Card className="p-4">
									<h4 className="mb-3 font-medium">Показатели</h4>
									<div className="space-y-3">
										<div>
											<div className="mb-1 flex justify-between text-sm">
												<span className="text-muted-foreground">
													Выполнение:
												</span>
												<span className="font-medium">
													{selectedMember.taskStats.plan > 0
														? Math.round(
																(selectedMember.taskStats.fact /
																	selectedMember.taskStats.plan) *
																	100,
															)
														: 0}
													%
												</span>
											</div>
										</div>
										<div>
											<div className="mb-1 flex justify-between text-sm">
												<span className="text-muted-foreground">Загрузка:</span>
												<span className="font-medium">
													{selectedMember.workload || 0}%
												</span>
											</div>
										</div>
									</div>
								</Card>
							</div>

							{selectedMember.recentTasks.length > 0 && (
								<Card className="p-4">
									<h4 className="mb-3 font-medium">Текущие задачи</h4>
									<div className="space-y-2">
										{selectedMember.recentTasks.map((task: any) => (
											<div
												key={task._id}
												className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
											>
												<div className="flex items-center gap-3">
													<div
														className="h-2 w-2 rounded-full"
														style={{
															backgroundColor: task.status?.color || "#666",
														}}
													/>
													<div>
														<p className="font-medium text-sm">
															{task.identifier} - {task.title}
														</p>
														<p className="text-muted-foreground text-xs">
															{task.status?.name}
														</p>
													</div>
												</div>
												{task.dueDate && (
													<Badge variant="outline" className="text-xs">
														<Calendar className="mr-1 h-3 w-3" />
														{new Date(task.dueDate).toLocaleDateString("ru-RU")}
													</Badge>
												)}
											</div>
										))}
									</div>
								</Card>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

function ProjectTeamSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="mb-2 h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-9 w-32" />
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={`stats-${i}`} className="p-4">
						<Skeleton className="mb-2 h-4 w-20" />
						<Skeleton className="h-8 w-16" />
					</Card>
				))}
			</div>

			<Card className="p-4">
				<Skeleton className="h-10 w-full" />
			</Card>

			<div className="grid gap-4 md:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card key={`member-${i}`} className="p-5">
						<div className="mb-4 flex items-start gap-3">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div className="flex-1">
								<Skeleton className="mb-2 h-4 w-32" />
								<Skeleton className="h-3 w-48" />
							</div>
						</div>
						<div className="space-y-3">
							<div className="grid grid-cols-3 gap-3">
								{[...Array(3)].map((_, j) => (
									<Skeleton
										key={`metric-${i}-${j}`}
										className="h-12 w-full rounded-lg"
									/>
								))}
							</div>
							<Skeleton className="h-2 w-full" />
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
