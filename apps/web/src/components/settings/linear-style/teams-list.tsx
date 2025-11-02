"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Settings, Trash2, UserPlus } from "lucide-react";

interface Member {
	_id: string;
	name: string;
	email: string;
	role: string;
}

interface Team {
	_id: string;
	name: string;
	members: Member[];
	organizationId: string;
	_creationTime?: number;
	createdAt?: number;
	updatedAt?: number;
}

interface TeamsListProps {
	teams: Team[] | undefined;
	searchQuery: string;
	onEdit: (team: Team) => void;
	onDelete: (teamId: string) => void;
	onAddMember: (team: Team) => void;
}

export function TeamsList({
	teams,
	searchQuery,
	onEdit,
	onDelete,
	onAddMember,
}: TeamsListProps) {
	// Filter teams based on search query
	const filteredTeams = teams?.filter((team) =>
		team.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (!filteredTeams || filteredTeams.length === 0) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground text-sm">
					{searchQuery ? "Нет команд по вашему запросу" : "Нет команд"}
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{filteredTeams.map((team) => (
				<div
					key={team._id}
					className="group relative rounded-lg border bg-card p-5 transition-all hover:shadow-md"
				>
					{/* Team header */}
					<div className="mb-4 flex items-start justify-between">
						<div className="flex-1">
							<h3 className="font-semibold text-base">{team.name}</h3>
							<p className="text-muted-foreground text-xs">
								{team.members?.length || 0}{" "}
								{team.members?.length === 1 ? "участник" : "участников"}
							</p>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="opacity-0 transition-opacity group-hover:opacity-100"
								>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onEdit(team)}>
									<Settings className="mr-2 h-4 w-4" />
									Редактировать
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onAddMember(team)}>
									<UserPlus className="mr-2 h-4 w-4" />
									Добавить участника
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => onDelete(team._id)}
									className="text-destructive"
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Удалить
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Members avatars */}
					{team.members && team.members.length > 0 && (
						<div className="space-y-2">
							<div className="-space-x-2 flex *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
								{team.members.slice(0, 8).map((member) => (
									<Avatar key={member._id} data-slot="avatar">
										<AvatarImage
											src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`}
											alt={member.name}
										/>
										<AvatarFallback className="bg-primary/10 font-medium text-xs">
											{member.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								))}
								{team.members.length > 8 && (
									<div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-xs ring-2 ring-background">
										+{team.members.length - 8}
									</div>
								)}
							</div>

							{/* Team member list */}
							<div className="mt-3 max-h-32 space-y-2 overflow-y-auto">
								{team.members.map((member) => (
									<div
										key={member._id}
										className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
									>
										<Avatar className="h-6 w-6 border">
											<AvatarImage
												src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`}
												alt={member.name}
											/>
											<AvatarFallback className="bg-primary/10 text-xs">
												{member.name
													.split(" ")
													.map((n) => n[0])
													.join("")
													.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium text-xs">
												{member.name}
											</p>
											<p className="truncate text-muted-foreground text-xs">
												{member.email}
											</p>
										</div>
										{member.role === "admin" && (
											<Badge variant="secondary" className="ml-auto text-xs">
												Admin
											</Badge>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{!team.members ||
						(team.members.length === 0 && (
							<div className="py-4 text-center">
								<p className="text-muted-foreground text-xs">
									В команде пока нет участников
								</p>
							</div>
						))}
				</div>
			))}
		</div>
	);
}
