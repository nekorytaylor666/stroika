"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	Building2,
	Edit,
	MoreHorizontal,
	Plus,
	Search,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";

interface TeamManagementProps {
	organizationId?: string;
}

export function TeamManagement({ organizationId }: TeamManagementProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<any>(null);
	const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

	// Queries
	const teams = useQuery(api.constructionTeams.getAll);
	const users = useQuery(api.users.getAll);
	const departments = useQuery(api.departments.queries.getAllDepartments);

	// Mutations
	const createTeam = useMutation(api.constructionTeams.create);
	const updateTeam = useMutation(api.constructionTeams.update);
	const deleteTeam = useMutation(api.constructionTeams.deleteTeam);

	// Filter teams based on search
	const filteredTeams = teams?.filter((team) => {
		return (
			searchQuery === "" ||
			team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			team.description?.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	// Get department name
	const getDepartmentName = (departmentId?: Id<"departments">) => {
		if (!departmentId || !departments) return null;
		return departments.find((d) => d._id === departmentId)?.name;
	};

	// Get team members info
	const getTeamMembers = (memberIds: Id<"users">[]) => {
		if (!users) return [];
		return memberIds
			.map((id) => users.find((u) => u._id === id))
			.filter(Boolean);
	};

	// Stats
	const stats = {
		totalTeams: teams?.length || 0,
		totalMembers:
			teams?.reduce((acc, team) => acc + team.memberIds.length, 0) || 0,
		averageSize:
			teams && teams.length > 0
				? Math.round(
						teams.reduce((acc, team) => acc + team.memberIds.length, 0) /
							teams.length,
					)
				: 0,
		departments: new Set(teams?.map((t) => t.departmentId).filter(Boolean))
			.size,
	};

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Всего команд</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalTeams}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Всего участников
						</CardTitle>
						<UserPlus className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalMembers}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Средний размер
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.averageSize}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Охвачено отделов
						</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.departments}</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Actions */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative max-w-sm flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск команд..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Создать команду
				</Button>
			</div>

			{/* Teams Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredTeams?.map((team) => {
					const members = getTeamMembers(team.memberIds);
					const departmentName = getDepartmentName(team.departmentId);

					return (
						<Card key={team._id} className="relative">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">{team.name}</CardTitle>
										{departmentName && (
											<Badge variant="secondary" className="mt-1">
												{departmentName}
											</Badge>
										)}
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												onClick={() => {
													setSelectedTeam(team);
													setIsEditModalOpen(true);
												}}
											>
												<Edit className="mr-2 h-4 w-4" />
												Редактировать
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													setSelectedTeam(team);
													setIsAddMemberModalOpen(true);
												}}
											>
												<UserPlus className="mr-2 h-4 w-4" />
												Добавить участника
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-red-600"
												onClick={async () => {
													if (
														confirm(
															"Вы уверены, что хотите удалить эту команду?",
														)
													) {
														await deleteTeam({ id: team._id });
													}
												}}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Удалить
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{team.description && (
									<p className="text-muted-foreground text-sm">
										{team.description}
									</p>
								)}

								{/* Members */}
								<div>
									<p className="mb-2 font-medium text-sm">
										Участники ({members.length})
									</p>
									<div className="flex flex-wrap gap-2">
										{members.slice(0, 5).map((member: any) => (
											<Avatar key={member._id} className="h-8 w-8">
												<AvatarImage src={member.avatarUrl} />
												<AvatarFallback>
													{member.name
														.split(" ")
														.map((n: string) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
										))}
										{members.length > 5 && (
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium text-xs">
												+{members.length - 5}
											</div>
										)}
									</div>
								</div>

								{/* Lead */}
								{team.leadId && (
									<div>
										<p className="mb-1 font-medium text-sm">Руководитель</p>
										{users && (
											<div className="flex items-center gap-2">
												<Avatar className="h-6 w-6">
													<AvatarImage
														src={
															users.find((u) => u._id === team.leadId)
																?.avatarUrl
														}
													/>
													<AvatarFallback>
														{users
															.find((u) => u._id === team.leadId)
															?.name.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<span className="text-sm">
													{users.find((u) => u._id === team.leadId)?.name}
												</span>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Create/Edit Team Modal */}
			<TeamFormModal
				open={isCreateModalOpen || isEditModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsCreateModalOpen(false);
						setIsEditModalOpen(false);
						setSelectedTeam(null);
					}
				}}
				team={selectedTeam}
				users={users}
				departments={departments}
				onSubmit={async (data) => {
					if (selectedTeam) {
						await updateTeam({ id: selectedTeam._id, ...data });
					} else {
						await createTeam(data);
					}
					setIsCreateModalOpen(false);
					setIsEditModalOpen(false);
					setSelectedTeam(null);
				}}
			/>

			{/* Add Member Modal */}
			<AddMemberModal
				open={isAddMemberModalOpen}
				onOpenChange={setIsAddMemberModalOpen}
				team={selectedTeam}
				users={users}
				onAddMember={async (userId) => {
					if (selectedTeam) {
						const updatedMemberIds = [...selectedTeam.memberIds, userId];
						await updateTeam({
							id: selectedTeam._id,
							memberIds: updatedMemberIds,
						});
						setIsAddMemberModalOpen(false);
					}
				}}
			/>
		</div>
	);
}

interface TeamFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	team: any;
	users: any[] | undefined;
	departments: any[] | undefined;
	onSubmit: (data: any) => Promise<void>;
}

function TeamFormModal({
	open,
	onOpenChange,
	team,
	users,
	departments,
	onSubmit,
}: TeamFormModalProps) {
	const [name, setName] = useState(team?.name || "");
	const [description, setDescription] = useState(team?.description || "");
	const [departmentId, setDepartmentId] = useState(team?.departmentId || "");
	const [leadId, setLeadId] = useState(team?.leadId || "");

	const handleSubmit = async () => {
		await onSubmit({
			name,
			description,
			departmentId: departmentId || undefined,
			leadId: leadId || undefined,
			memberIds: team?.memberIds || [],
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{team ? "Редактировать команду" : "Создать команду"}
					</DialogTitle>
					<DialogDescription>Заполните информацию о команде</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">Название</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Название команды"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Описание</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Описание команды"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="department">Отдел</Label>
						<Select value={departmentId} onValueChange={setDepartmentId}>
							<SelectTrigger>
								<SelectValue placeholder="Выберите отдел" />
							</SelectTrigger>
							<SelectContent>
								{departments?.map((dept) => (
									<SelectItem key={dept._id} value={dept._id}>
										{dept.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lead">Руководитель</Label>
						<Select value={leadId} onValueChange={setLeadId}>
							<SelectTrigger>
								<SelectValue placeholder="Выберите руководителя" />
							</SelectTrigger>
							<SelectContent>
								{users?.map((user) => (
									<SelectItem key={user._id} value={user._id}>
										{user.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button onClick={handleSubmit}>
						{team ? "Сохранить" : "Создать"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface AddMemberModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	team: any;
	users: any[] | undefined;
	onAddMember: (userId: Id<"users">) => Promise<void>;
}

function AddMemberModal({
	open,
	onOpenChange,
	team,
	users,
	onAddMember,
}: AddMemberModalProps) {
	const [selectedUserId, setSelectedUserId] = useState("");

	// Filter out users already in the team
	const availableUsers = users?.filter(
		(user) => !team?.memberIds.includes(user._id),
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Добавить участника</DialogTitle>
					<DialogDescription>
						Выберите участника для добавления в команду "{team?.name}"
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Select value={selectedUserId} onValueChange={setSelectedUserId}>
						<SelectTrigger>
							<SelectValue placeholder="Выберите участника" />
						</SelectTrigger>
						<SelectContent>
							{availableUsers?.map((user) => (
								<SelectItem key={user._id} value={user._id}>
									<div className="flex items-center gap-2">
										<Avatar className="h-6 w-6">
											<AvatarImage src={user.avatarUrl} />
											<AvatarFallback>
												{user.name
													.split(" ")
													.map((n) => n[0])
													.join("")}
											</AvatarFallback>
										</Avatar>
										<span>{user.name}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button
						onClick={async () => {
							if (selectedUserId) {
								await onAddMember(selectedUserId as Id<"users">);
								onOpenChange(false);
							}
						}}
						disabled={!selectedUserId}
					>
						Добавить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
