"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import { useQuery } from "convex/react";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
	useQuery as useTanstackQuery,
	useMutation as useTanstackMutation,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { TeamsList } from "./teams-list";

interface TeamFormData {
	name: string;
	shortName: string;
	color: string;
	department: string;
}

interface Team {
	_id: string;
	name: string;
	organizationId: string;
	_creationTime?: number;
	createdAt?: number;
	updatedAt?: number;
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

export function LinearTeamManagement() {
	const [searchQuery, setSearchQuery] = useState("");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [formData, setFormData] = useState<TeamFormData>({
		name: "",
		shortName: "",
		color: defaultColors[0],
		department: "engineering",
	});

	// Get current user's organizations
	const { data: currentOrg } = authClient.useActiveOrganization();

	// Queries
	const { data: teams, refetch: refetchTeams } = useTanstackQuery({
		queryKey: [`organization-teams-${currentOrg?.id}`],
		queryFn: async () => {
			const { data } = await authClient.organization.listTeams();
			return data;
		},
		enabled: !!currentOrg?.id,
	});

	const teamsWithMembers = useQuery(api.teams.listAllTeamsWithMembers);

	const createTeam = useTanstackMutation({
		mutationFn: async (args: { name: string; organizationId: string }) => {
			const { data } = await authClient.organization.createTeam({
				organizationId: args.organizationId,
				name: args.name,
			});
			return data;
		},
		onSuccess: () => {
			toast.success("Команда успешно создана");
			refetchTeams();
		},
	});
	const updateTeam = useTanstackMutation({
		mutationFn: async (args: { teamId: string; data: { name?: string } }) => {
			const { data } = await authClient.organization.updateTeam({
				teamId: args.teamId,
				data: args.data,
			});
			return data;
		},
		onSuccess: () => {
			toast.success("Команда успешно обновлена");
			refetchTeams();
		},
	});
	const deleteTeam = useTanstackMutation({
		mutationFn: async (args: { teamId: string }) => {
			const { data } = await authClient.organization.removeTeam({
				teamId: args.teamId,
			});
			return data;
		},
		onSuccess: () => {
			toast.success("Команда успешно удалена");
			refetchTeams();
		},
	});

	const handleCreateTeam = async () => {
		if (!currentOrg) return;

		await createTeam.mutateAsync({
			organizationId: currentOrg.id,
			name: formData.name,
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
			await updateTeam.mutateAsync({
				teamId: selectedTeam._id,
				data: {
					name: formData.name,
				},
			});
			setIsEditModalOpen(false);
		}
	};

	const handleDeleteTeam = async (teamId: string) => {
		await deleteTeam.mutateAsync({ teamId });
	};

	const openEditModal = (team: Team) => {
		setSelectedTeam(team);
		setFormData({
			name: team.name,
			shortName: team.name.slice(0, 3).toUpperCase(),
			color: defaultColors[0],
			department: "engineering",
		});
		setIsEditModalOpen(true);
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
				<TeamsList
					teams={teamsWithMembers}
					searchQuery={searchQuery}
					onEdit={openEditModal}
					onDelete={handleDeleteTeam}
					onAddMember={() =>
						toast.info("Добавление участников скоро будет доступно")
					}
				/>
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
