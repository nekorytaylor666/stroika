"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Id } from "@stroika/backend";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Building,
	Calendar,
	CheckCircle2,
	Clock,
	Crown,
	HardHat,
	MoreHorizontal,
	TrendingUp,
	User,
	UserMinus,
} from "lucide-react";
import { motion } from "motion/react";

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
		plan: number;
		fact: number;
		overdue: number;
	};
	recentTasks: Array<{
		_id: string;
		title: string;
		identifier: string;
		status: {
			_id: Id<"status">;
			name: string;
			color: string;
			iconName: string;
		} | null;
		dueDate?: string;
		priority?: string;
	}>;
	workload: number; // 0-100 percentage
	availability?: "on-site" | "office" | "remote" | "off";
}

interface ProjectTeamMemberCardProps {
	member: TeamMember;
	onRemove: () => void;
	onViewDetails: () => void;
	variant?: "grid" | "list";
}

export function ProjectTeamMemberCard({
	member,
	onRemove,
	onViewDetails,
	variant = "grid",
}: ProjectTeamMemberCardProps) {
	const completionRate =
		member.taskStats.plan > 0
			? Math.round((member.taskStats.fact / member.taskStats.plan) * 100)
			: 0;

	const performanceColor =
		completionRate >= 90
			? "text-green-600"
			: completionRate >= 70
				? "text-yellow-600"
				: "text-red-600";

	const workloadColor =
		member.workload >= 80
			? "bg-red-500"
			: member.workload >= 60
				? "bg-yellow-500"
				: "bg-blue-500";

	const getAvailabilityIcon = () => {
		switch (member.availability) {
			case "on-site":
				return <HardHat className="h-3 w-3" />;
			case "office":
				return <Building className="h-3 w-3" />;
			case "remote":
				return <User className="h-3 w-3" />;
			default:
				return null;
		}
	};

	const getAvailabilityLabel = () => {
		switch (member.availability) {
			case "on-site":
				return "На объекте";
			case "office":
				return "В офисе";
			case "remote":
				return "Удаленно";
			case "off":
				return "Недоступен";
			default:
				return "Неизвестно";
		}
	};

	if (variant === "list") {
		return (
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<Card className="group p-3 transition-all hover:shadow-md">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Avatar className="h-10 w-10">
								<AvatarImage
									src={member.avatarUrl || undefined}
									alt={member.name}
								/>
								<AvatarFallback>
									{member.name
										.split(" ")
										.map((n) => n[0])
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

						<div className="flex items-center gap-4">
							{/* Task Statistics */}
							<div className="grid grid-cols-4 gap-3 text-center">
								<div>
									<p className="font-semibold text-base">
										{member.taskStats.total}
									</p>
									<p className="text-muted-foreground text-xs">Всего</p>
								</div>
								<div>
									<p className="font-semibold text-base text-blue-600">
										{member.taskStats.plan}
									</p>
									<p className="text-muted-foreground text-xs">План</p>
								</div>
								<div>
									<p className="font-semibold text-base text-green-600">
										{member.taskStats.fact}
									</p>
									<p className="text-muted-foreground text-xs">Факт</p>
								</div>
								<div>
									<p
										className={cn("font-semibold text-base", performanceColor)}
									>
										{completionRate}%
									</p>
									<p className="text-muted-foreground text-xs">Выполнено</p>
								</div>
							</div>

							{/* Workload */}
							<div className="w-24">
								<div className="mb-1 flex items-center justify-between">
									<span className="text-xs">Загрузка</span>
									<span className="font-medium text-xs">
										{member.workload}%
									</span>
								</div>
								<Progress value={member.workload} className="h-2" />
							</div>

							{/* Actions */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 opacity-0 group-hover:opacity-100"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={onViewDetails}>
										<User className="mr-2 h-4 w-4" />
										Подробнее
									</DropdownMenuItem>
									<DropdownMenuSeparator />
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
				</Card>
			</motion.div>
		);
	}

	// Grid variant
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ y: -4 }}
			transition={{ duration: 0.2 }}
		>
			<Card className="group relative h-full overflow-hidden p-3 transition-all hover:shadow-lg">
				{/* Header */}
				<div className="mb-3 flex items-start justify-between">
					<div className="flex items-center gap-2">
						<Avatar className="h-10 w-10">
							<AvatarImage
								src={member.avatarUrl || undefined}
								alt={member.name}
							/>
							<AvatarFallback>
								{member.name
									.split(" ")
									.map((n) => n[0])
									.join("")
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<p className="truncate font-medium">{member.name}</p>
								{member.isLead && (
									<Crown className="h-4 w-4 shrink-0 text-yellow-600" />
								)}
							</div>
							<p className="truncate text-muted-foreground text-sm">
								{member.position?.name ||
									member.department?.name ||
									member.email}
							</p>
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={onViewDetails}>
								<User className="mr-2 h-4 w-4" />
								Подробнее
							</DropdownMenuItem>
							<DropdownMenuSeparator />
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

				{/* Availability Badge */}

				{/* Stats Grid */}
				<div className="mb-3 grid grid-cols-3 gap-2 text-center">
					<div className="rounded-lg bg-muted/50 p-1.5">
						<p className="font-semibold text-blue-600 text-sm">
							{member.taskStats.plan}
						</p>
						<p className="text-muted-foreground text-xs">План</p>
					</div>
					<div className="rounded-lg bg-muted/50 p-1.5">
						<p className="font-semibold text-green-600 text-sm">
							{member.taskStats.fact}
						</p>
						<p className="text-muted-foreground text-xs">Факт</p>
					</div>
					<div className="rounded-lg bg-muted/50 p-1.5">
						<p className={cn("font-semibold text-sm", performanceColor)}>
							{completionRate}%
						</p>
						<p className="text-muted-foreground text-xs">Выполнено</p>
					</div>
				</div>

				{/* Workload Progress */}
				<div className="mb-3">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-xs">Загрузка</span>
						<span className="font-medium text-xs">{member.workload}%</span>
					</div>
					<div className="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className={cn("h-full transition-all", workloadColor)}
							style={{ width: `${member.workload}%` }}
						/>
					</div>
				</div>

				{/* Recent Tasks */}
				{member.recentTasks.length > 0 && (
					<div className="space-y-1">
						<p className="font-medium text-muted-foreground text-xs">
							Текущие задачи
						</p>
						<div className="space-y-1">
							{member.recentTasks.slice(0, 2).map((task) => (
								<div
									key={task._id}
									className="flex items-center gap-1 rounded-md bg-muted/30 p-1.5 text-xs"
								>
									<div
										className="h-2 w-2 shrink-0 rounded-full"
										style={{ backgroundColor: task.status?.color || "#666" }}
									/>
									<span className="truncate font-medium">
										{task.identifier}
									</span>
									<span className="truncate text-muted-foreground">
										{task.title}
									</span>
									{task.dueDate && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger>
													<Calendar className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
												</TooltipTrigger>
												<TooltipContent>
													<p>
														Срок:{" "}
														{format(new Date(task.dueDate), "d MMM", {
															locale: ru,
														})}
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Overdue Indicator */}
				{member.taskStats.overdue > 0 && (
					<div className="absolute right-2 bottom-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Badge variant="destructive" className="gap-1 text-xs">
										<Clock className="h-3 w-3" />
										{member.taskStats.overdue}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									<p>Просроченных задач: {member.taskStats.overdue}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				)}
			</Card>
		</motion.div>
	);
}
