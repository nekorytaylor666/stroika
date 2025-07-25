"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	Building,
	Hash,
	MoreHorizontal,
	Plus,
	Search,
	Settings,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";
import { useState } from "react";

interface LinearTeamManagementProps {
	organizationId?: string;
}

interface TeamFormData {
	name: string;
	shortName: string;
	color: string;
	department: string;
}

const defaultColors = [
	"#FF6B6B",
	"#4ECDC4",
	"#45B7D1",
	"#96CEB4",
	"#FECA57",
	"#FF9FF3",
	"#54A0FF",
	"#48DBFB",
];

export function LinearTeamManagement({
	organizationId,
}: LinearTeamManagementProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<any>(null);
	const [formData, setFormData] = useState<TeamFormData>({
		name: "",
		shortName: "",
		color: defaultColors[0],
		department: "engineering",
	});

	// Queries
	const teams = useQuery(api.constructionTeams.getAll);
	const users = useQuery(api.users.getAll);

	// Mutations
	const createTeam = useMutation(api.constructionTeams.create);
	const updateTeam = useMutation(api.constructionTeams.update);
	const deleteTeam = useMutation(api.constructionTeams.delete);
	const addMemberToTeam = useMutation(api.constructionTeams.addMember);
	const removeMemberFromTeam = useMutation(api.constructionTeams.removeMember);

	// Filter teams based on search
	const filteredTeams = teams?.filter((team) => {
		const matchesSearch =
			searchQuery === "" ||
			team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			team.shortName.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});

	const handleCreateTeam = async () => {
		await createTeam({
			...formData,
			icon: "users",
			joined: true,
			memberIds: [],
			projectIds: [],
			workload: 0,
		});
		setIsCreateModalOpen(false);
		setFormData({
			name: "",
			shortName: "",
			color: defaultColors[0],
			department: "engineering",
		});
	};

	const handleUpdateTeam = async () => {
		if (selectedTeam) {
			await updateTeam({
				id: selectedTeam._id,
				...formData,
			});
			setIsEditModalOpen(false);
		}
	};

	const handleDeleteTeam = async (teamId: Id<"constructionTeams">) => {
		await deleteTeam({ id: teamId });
	};

	const openEditModal = (team: any) => {
		setSelectedTeam(team);
		setFormData({
			name: team.name,
			shortName: team.shortName,
			color: team.color,
			department: team.department,
		});
		setIsEditModalOpen(true);
	};

	const getTeamMembers = (memberIds: Id<"users">[]) => {
		if (!users) return [];
		return users.filter((user) => memberIds.includes(user._id));
	};

	return (
		<>
			<div className="space-y-6">
				{/* Header with actions */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">Команды</h2>
						<p className="text-muted-foreground text-sm">
							{teams?.length || 0} команд
						</p>
					</div>
					<Button onClick={() => setIsCreateModalOpen(true)} size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Создать команду
					</Button>
				</div>

				{/* Search bar */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск команд..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Teams grid */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredTeams?.map((team) => {
						const members = getTeamMembers(team.memberIds);
						return (
							<div
								key={team._id}
								className="group relative rounded-lg border p-6 transition-all hover:shadow-sm"
							>
								{/* Team header */}
								<div className="mb-4 flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div
											className="flex h-10 w-10 items-center justify-center rounded-lg"
											style={{ backgroundColor: team.color }}
										>
											<Hash className="h-5 w-5 text-white" />
										</div>
										<div>
											<h3 className="font-semibold">{team.name}</h3>
											<p className="text-muted-foreground text-sm">
												{team.shortName}
											</p>
										</div>
									</div>
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
											<DropdownMenuItem onClick={() => openEditModal(team)}>
												<Settings className="mr-2 h-4 w-4" />
												Настроить
											</DropdownMenuItem>
											<DropdownMenuItem>
												<UserPlus className="mr-2 h-4 w-4" />
												Добавить участников
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className="text-red-600"
												onClick={() => handleDeleteTeam(team._id)}
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Удалить команду
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Team info */}
								<div className="space-y-3">
									<div>
										<p className="text-muted-foreground text-xs">Отдел</p>
										<Badge variant="secondary" className="mt-1">
											{team.department === "design"
												? "Дизайн"
												: team.department === "construction"
													? "Строительство"
													: team.department === "engineering"
														? "Инженерия"
														: "Менеджмент"}
										</Badge>
									</div>

									<div>
										<p className="mb-2 text-muted-foreground text-xs">
											Участники ({members.length})
										</p>
										<div className="-space-x-2 flex">
											{members.slice(0, 5).map((member) => (
												<Avatar
													key={member._id}
													className="h-8 w-8 border-2 border-background"
												>
													<AvatarImage src={member.avatarUrl} />
													<AvatarFallback className="text-xs">
														{member.name
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
											))}
											{members.length > 5 && (
												<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted font-medium text-xs">
													+{members.length - 5}
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Загруженность</span>
										<span className="font-medium">{team.workload}%</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Create Team Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Создать команду</DialogTitle>
						<DialogDescription>
							Создайте новую команду для организации работы
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Название команды</Label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Например: Frontend Team"
								className="mt-1"
							/>
						</div>
						<div>
							<Label>Короткое название</Label>
							<Input
								value={formData.shortName}
								onChange={(e) =>
									setFormData({ ...formData, shortName: e.target.value })
								}
								placeholder="Например: FE"
								className="mt-1"
							/>
						</div>
						<div>
							<Label>Отдел</Label>
							<Select
								value={formData.department}
								onValueChange={(value) =>
									setFormData({ ...formData, department: value })
								}
							>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="design">Дизайн</SelectItem>
									<SelectItem value="construction">Строительство</SelectItem>
									<SelectItem value="engineering">Инженерия</SelectItem>
									<SelectItem value="management">Менеджмент</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Цвет команды</Label>
							<div className="mt-2 flex gap-2">
								{defaultColors.map((color) => (
									<button
										key={color}
										type="button"
										className={cn(
											"h-8 w-8 rounded-lg border-2",
											formData.color === color
												? "border-foreground"
												: "border-transparent",
										)}
										style={{ backgroundColor: color }}
										onClick={() => setFormData({ ...formData, color })}
									/>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateModalOpen(false)}
						>
							Отмена
						</Button>
						<Button onClick={handleCreateTeam}>Создать</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Edit Team Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Настройки команды</DialogTitle>
						<DialogDescription>Измените параметры команды</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Название команды</Label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="mt-1"
							/>
						</div>
						<div>
							<Label>Короткое название</Label>
							<Input
								value={formData.shortName}
								onChange={(e) =>
									setFormData({ ...formData, shortName: e.target.value })
								}
								className="mt-1"
							/>
						</div>
						<div>
							<Label>Отдел</Label>
							<Select
								value={formData.department}
								onValueChange={(value) =>
									setFormData({ ...formData, department: value })
								}
							>
								<SelectTrigger className="mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="design">Дизайн</SelectItem>
									<SelectItem value="construction">Строительство</SelectItem>
									<SelectItem value="engineering">Инженерия</SelectItem>
									<SelectItem value="management">Менеджмент</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Цвет команды</Label>
							<div className="mt-2 flex gap-2">
								{defaultColors.map((color) => (
									<button
										key={color}
										type="button"
										className={cn(
											"h-8 w-8 rounded-lg border-2",
											formData.color === color
												? "border-foreground"
												: "border-transparent",
										)}
										style={{ backgroundColor: color }}
										onClick={() => setFormData({ ...formData, color })}
									/>
								))}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
							Отмена
						</Button>
						<Button onClick={handleUpdateTeam}>Сохранить</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
