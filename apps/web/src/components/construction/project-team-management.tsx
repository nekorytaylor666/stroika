"use client";

import { UserSelector } from "@/components/common/user-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Crown,
	MoreHorizontal,
	Plus,
	TrendingDown,
	TrendingUp,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProjectTeamManagementProps {
	projectId: Id<"constructionProjects">;
}

export function ProjectTeamManagement({
	projectId,
}: ProjectTeamManagementProps) {
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
		null,
	);

	// Fetch team data with statistics
	const teamData = useQuery(api.constructionTeams.getProjectTeamWithStats, {
		projectId,
	});

	// Fetch all users for adding members
	const allUsers = useQuery(api.users.getAll);

	// Mutations
	const addTeamMember = useMutation(api.constructionTeams.addTeamMember);
	const removeTeamMember = useMutation(api.constructionTeams.removeTeamMember);

	const handleAddMember = async () => {
		if (!selectedUserId) return;

		try {
			await addTeamMember({
				projectId,
				userId: selectedUserId,
			});
			toast.success("Участник добавлен в команду");
			setIsAddMemberOpen(false);
			setSelectedUserId(null);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при добавлении участника",
			);
		}
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

	if (!teamData) {
		return <ProjectTeamSkeleton />;
	}

	// Filter out existing team members from available users
	const availableUsers = allUsers?.filter(
		(user) => !teamData.members.some((member) => member._id === user._id),
	);

	return (
		<div className="space-y-6">
			{/* Team Overview Stats */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">Участники</p>
						<Users className="h-4 w-4 text-muted-foreground" />
					</div>
					<p className="mt-2 font-semibold text-2xl">
						{teamData.teamStats.totalMembers}
					</p>
				</Card>
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">Всего задач</p>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</div>
					<p className="mt-2 font-semibold text-2xl">
						{teamData.teamStats.totalTasks}
					</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{teamData.teamStats.unassignedTasks} не назначено
					</p>
				</Card>
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">В работе</p>
						<Clock className="h-4 w-4 text-blue-500" />
					</div>
					<p className="mt-2 font-semibold text-2xl">
						{teamData.teamStats.inProgressTasks}
					</p>
					<Progress
						value={
							(teamData.teamStats.inProgressTasks /
								teamData.teamStats.totalTasks) *
							100
						}
						className="mt-2 h-1"
					/>
				</Card>
				<Card className="p-4">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-sm">Завершено</p>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</div>
					<p className="mt-2 font-semibold text-2xl">
						{teamData.teamStats.completedTasks}
					</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{Math.round(
							(teamData.teamStats.completedTasks /
								teamData.teamStats.totalTasks) *
								100,
						)}
						% от всех задач
					</p>
				</Card>
			</div>

			{/* Team Members List */}
			<Card>
				<div className="flex items-center justify-between border-b p-4">
					<h2 className="font-semibold text-lg">Команда проекта</h2>
					<Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
						<UserPlus className="mr-2 h-4 w-4" />
						Добавить участника
					</Button>
				</div>
				<div className="divide-y">
					{teamData.members.map((member) => (
						<MemberRow
							key={member._id}
							member={member}
							onRemove={() => handleRemoveMember(member._id)}
						/>
					))}
				</div>
			</Card>

			{/* Add Member Dialog */}
			<Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Добавить участника в команду</DialogTitle>
						<DialogDescription>
							Выберите пользователя для добавления в команду проекта
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<UserSelector
							users={availableUsers || []}
							value={selectedUserId || undefined}
							onChange={(userId) => setSelectedUserId(userId as Id<"users">)}
							placeholder="Выберите участника..."
						/>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setIsAddMemberOpen(false);
									setSelectedUserId(null);
								}}
							>
								Отмена
							</Button>
							<Button onClick={handleAddMember} disabled={!selectedUserId}>
								Добавить
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

interface TeamMember {
	_id: Id<"users">;
	name: string;
	email: string;
	avatarUrl?: string | null;
	isLead: boolean;
	department: {
		_id: string;
		name: string;
	} | null;
	position: {
		_id: string;
		name: string;
	} | null;
	taskStats: {
		total: number;
		completed: number;
		inProgress: number;
		todo: number;
		overdue: number;
	};
	recentTasks: Array<{
		_id: string;
		title: string;
		identifier: string;
		status: any;
		dueDate?: string;
		priority?: string;
	}>;
}

interface MemberRowProps {
	member: TeamMember;
	onRemove: () => void;
}

function MemberRow({ member, onRemove }: MemberRowProps) {
	const completionRate =
		member.taskStats.total > 0
			? Math.round((member.taskStats.completed / member.taskStats.total) * 100)
			: 0;

	const productivityTrend =
		member.taskStats.completed > member.taskStats.inProgress
			? "up"
			: member.taskStats.completed < member.taskStats.inProgress
				? "down"
				: "neutral";

	return (
		<div className="flex items-center justify-between p-4 hover:bg-muted/50">
			<div className="flex items-center gap-4">
				<Avatar className="h-10 w-10">
					<AvatarImage src={member.avatarUrl} alt={member.name} />
					<AvatarFallback>
						{member.name
							.split(" ")
							.map((n: string) => n[0])
							.join("")
							.toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div>
					<div className="flex items-center gap-2">
						<p className="font-medium">{member.name}</p>
						{member.isLead && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Crown className="h-4 w-4 text-yellow-600" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Руководитель проекта</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<span>{member.email}</span>
						{member.department && (
							<>
								<span>•</span>
								<span>{member.department.name}</span>
							</>
						)}
						{member.position && (
							<>
								<span>•</span>
								<span>{member.position.name}</span>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-6">
				{/* Task Statistics */}
				<div className="grid grid-cols-4 gap-4 text-center">
					<div>
						<p className="font-semibold text-lg">{member.taskStats.total}</p>
						<p className="text-muted-foreground text-xs">Всего</p>
					</div>
					<div>
						<p className="font-semibold text-green-600 text-lg">
							{member.taskStats.completed}
						</p>
						<p className="text-muted-foreground text-xs">Завершено</p>
					</div>
					<div>
						<p className="font-semibold text-blue-600 text-lg">
							{member.taskStats.inProgress}
						</p>
						<p className="text-muted-foreground text-xs">В работе</p>
					</div>
					<div>
						<p className="font-semibold text-lg text-orange-600">
							{member.taskStats.todo}
						</p>
						<p className="text-muted-foreground text-xs">К выполнению</p>
					</div>
				</div>

				{/* Performance Indicators */}
				<div className="flex items-center gap-3">
					{/* Completion Rate */}
					<div className="text-center">
						<div className="flex items-center gap-1">
							<span className="font-semibold text-sm">{completionRate}%</span>
							{productivityTrend === "up" && (
								<TrendingUp className="h-4 w-4 text-green-500" />
							)}
							{productivityTrend === "down" && (
								<TrendingDown className="h-4 w-4 text-red-500" />
							)}
						</div>
						<p className="text-muted-foreground text-xs">Выполнено</p>
					</div>

					{/* Overdue Warning */}
					{member.taskStats.overdue > 0 && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Badge variant="destructive" className="gap-1">
										<AlertCircle className="h-3 w-3" />
										{member.taskStats.overdue}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									<p>{member.taskStats.overdue} просроченных задач</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>

				{/* Actions */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={onRemove}
							disabled={member.isLead}
							className="text-red-600"
						>
							<UserMinus className="mr-2 h-4 w-4" />
							Удалить из команды
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

function ProjectTeamSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i} className="p-4">
						<Skeleton className="mb-2 h-4 w-20" />
						<Skeleton className="h-8 w-16" />
					</Card>
				))}
			</div>
			<Card>
				<div className="border-b p-4">
					<Skeleton className="h-6 w-32" />
				</div>
				<div className="divide-y">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex items-center justify-between p-4">
							<div className="flex items-center gap-4">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div>
									<Skeleton className="mb-2 h-4 w-32" />
									<Skeleton className="h-3 w-48" />
								</div>
							</div>
							<div className="flex gap-4">
								{[...Array(4)].map((_, j) => (
									<Skeleton key={j} className="h-12 w-12" />
								))}
							</div>
						</div>
					))}
				</div>
			</Card>
		</div>
	);
}
