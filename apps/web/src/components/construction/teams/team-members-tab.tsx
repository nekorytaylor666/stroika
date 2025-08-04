"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@backend/convex/_generated/dataModel";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Activity,
	Calendar,
	CheckCircle2,
	Clock,
	Mail,
	MoreVertical,
	Phone,
	Search,
	Trash2,
	UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AddTeamMemberDialog } from "./add-team-member-dialog";

interface TeamMembersTabProps {
	teamId: Id<"constructionTeams">;
	organizationId: Id<"organizations">;
}

export function TeamMembersTab({
	teamId,
	organizationId,
}: TeamMembersTabProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

	// Fetch team members
	const members = useQuery(api.constructionTeams.getTeamMembers, { teamId });
	const removeMember = useMutation(api.constructionTeams.removeMember);

	// Filter members
	const filteredMembers = members?.filter((member) =>
		member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleRemoveMember = async (userId: Id<"users">) => {
		try {
			await removeMember({ teamId, userId });
			toast.success("Участник удален из команды");
		} catch (error) {
			console.error("Failed to remove member:", error);
			toast.error("Не удалось удалить участника");
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="border-b p-6">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="font-medium text-lg">Участники команды</h3>
					<Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
						<UserPlus className="mr-1 h-4 w-4" />
						Добавить участника
					</Button>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск участников..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Members List */}
			<ScrollArea className="flex-1">
				<div className="p-6">
					{!members ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Skeleton key={i} className="h-40" />
							))}
						</div>
					) : filteredMembers?.length === 0 ? (
						<div className="py-12 text-center">
							<UserPlus className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">
								{searchQuery
									? "Участники не найдены"
									: "В команде пока нет участников"}
							</p>
							{!searchQuery && (
								<Button
									size="sm"
									variant="outline"
									className="mt-3"
									onClick={() => setIsAddMemberOpen(true)}
								>
									Добавить первого участника
								</Button>
							)}
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{filteredMembers.map((member, index) => (
								<motion.div
									key={member.user?._id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
								>
									<Card className="overflow-hidden">
										<CardContent className="p-0">
											{/* Member Header */}
											<div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4">
												<div className="flex items-start justify-between">
													<div className="flex items-center gap-3">
														<Avatar className="h-12 w-12">
															<AvatarImage src={member.user?.profileImageUrl} />
															<AvatarFallback>
																{member.user?.name?.slice(0, 2).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div>
															<h4 className="font-medium">
																{member.user?.name}
															</h4>
															<p className="text-muted-foreground text-sm">
																{member.role || "Участник"}
															</p>
														</div>
													</div>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
															>
																<MoreVertical className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																className="text-destructive"
																onClick={() =>
																	handleRemoveMember(member.user!._id)
																}
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Удалить из команды
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>

											{/* Member Stats */}
											<div className="space-y-3 p-4">
												{/* Contact Info */}
												<div className="space-y-2">
													{member.user?.email && (
														<div className="flex items-center gap-2 text-sm">
															<Mail className="h-4 w-4 text-muted-foreground" />
															<span className="truncate text-muted-foreground">
																{member.user.email}
															</span>
														</div>
													)}
													{member.phone && (
														<div className="flex items-center gap-2 text-sm">
															<Phone className="h-4 w-4 text-muted-foreground" />
															<span className="text-muted-foreground">
																{member.phone}
															</span>
														</div>
													)}
												</div>

												{/* Stats */}
												<div className="grid grid-cols-2 gap-2 border-t pt-2">
													<div className="text-center">
														<p className="font-semibold text-lg">
															{member.stats?.activeTasksCount || 0}
														</p>
														<p className="text-muted-foreground text-xs">
															Активных задач
														</p>
													</div>
													<div className="text-center">
														<p className="font-semibold text-lg">
															{member.stats?.completedTasksCount || 0}
														</p>
														<p className="text-muted-foreground text-xs">
															Выполнено
														</p>
													</div>
												</div>

												{/* Status */}
												<div className="flex items-center justify-between border-t pt-2">
													<Badge
														variant={member.isActive ? "default" : "secondary"}
														className="text-xs"
													>
														{member.isActive ? "Активен" : "Неактивен"}
													</Badge>
													<span className="text-muted-foreground text-xs">
														{member.joinedAt &&
															format(new Date(member.joinedAt), "d MMM yyyy", {
																locale: ru,
															})}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Add Member Dialog */}
			<AddTeamMemberDialog
				open={isAddMemberOpen}
				onOpenChange={setIsAddMemberOpen}
				teamId={teamId}
				organizationId={organizationId}
			/>
		</div>
	);
}
