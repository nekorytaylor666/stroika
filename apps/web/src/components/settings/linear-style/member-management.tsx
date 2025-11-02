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
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import {
	useMutation as useTanstackMutation,
	useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
	Building,
	ChevronDown,
	Mail,
	MoreHorizontal,
	Plus,
	Search,
	Shield,
	User,
	UserMinus,
	UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function LinearMemberManagement() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMember, setSelectedMember] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRoleId, setInviteRoleId] = useState<Id<"roles">>();

	// Get current user's organizations
	const { data: currentOrg } = authClient.useActiveOrganization();

	// Queries
	const { data: members, refetch: refetchMembers } = useTanstackQuery({
		queryKey: [`organization-members-${currentOrg?.id}`],
		queryFn: async () => {
			const { data } = await authClient.organization.listMembers();
			console.log(data);
			return data.members;
		},
		enabled: !!currentOrg?.id,
	});
	const { data: invites } = useTanstackQuery({
		queryKey: [`organization-invitations-${currentOrg?.id}`],
		queryFn: async () => {
			const { data } = await authClient.organization.listInvitations();
			return data;
		},
		enabled: !!currentOrg?.id,
	});

	const { data: teams } = useTanstackQuery({
		queryKey: [`organization-teams-${currentOrg?.id}`],
		queryFn: async () => {
			const { data } = await authClient.organization.listTeams();
			return data;
		},
		enabled: !!currentOrg?.id,
	});

	const { data: roles } = useTanstackQuery({
		queryKey: [`organization-roles-${currentOrg?.id}`],
		queryFn: async () => {
			const { data } = await authClient.permissions.roles.getRoles();
			return data;
		},
		enabled: !!currentOrg?.id,
	});
	// Mutations
	const updateMemberRole = useTanstackMutation({
		mutationFn: async (args: {
			memberId: Id<"member">;
			role: "owner" | "admin" | "member";
		}) => {
			const { memberId, role } = args;
			const { data } = await authClient.organization.updateMemberRole({
				memberId,
				organizationId: currentOrg?.id,
				role,
			});
			return data;
		},
		onSuccess(data, variables, onMutateResult, context) {
			toast.success("Роль успешно обновлена");
			refetchMembers();
		},
	});
	const removeMember = useMutation(api.organizationMembers.removeMember);
	const createInvite = useMutation(api.invites.createInvite);
	const cancelInvite = useMutation(api.invites.cancelInvite);

	// Filter members based on search
	const filteredMembers = members?.filter((member) => {
		if (!member.user) return false;
		const matchesSearch =
			searchQuery === "" ||
			member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});

	// Filter pending invites
	const pendingInvites = invites?.filter(
		(invite) => invite.status === "pending" && !invite.isExpired,
	);

	const handleInvite = async () => {
		try {
			const result = await createInvite({
				organizationId: currentOrg.id,
				email: inviteEmail,
				roleId: inviteRoleId,
			});

			// Show invite link to user
			alert(
				`Invite created! Share this link: ${window.location.origin}${result.inviteUrl}`,
			);

			setIsInviteModalOpen(false);
			setInviteEmail("");
			setInviteRoleId(undefined);
		} catch (error) {
			console.error("Failed to create invite:", error);
		}
	};

	const handleUpdateRole = async (
		memberId: Id<"member">,
		role: "owner" | "admin" | "member",
	) => {
		try {
			console.log("Updating role for user:", memberId, "with role:", role);
			await updateMemberRole.mutateAsync({
				memberId,
				role,
			});
		} catch (error) {
			console.error("Failed to update role:", error);
		}
	};

	const handleRemoveMember = async (userId: Id<"user">) => {
		if (!currentOrg) return;

		try {
			await removeMember({
				organizationId: currentOrg.id,
				userId,
			});
		} catch (error) {
			console.error("Failed to remove member:", error);
		}
	};

	const openEditModal = (member: any) => {
		setSelectedMember(member);
		setIsEditModalOpen(true);
	};

	console.log(members);
	return (
		<>
			<div className="space-y-6">
				{/* Header with actions */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">Участники</h2>
						<p className="text-muted-foreground text-sm">
							{filteredMembers?.length || 0} участников
						</p>
					</div>
					<Button onClick={() => setIsInviteModalOpen(true)} size="sm">
						<UserPlus className="mr-2 h-4 w-4" />
						Пригласить
					</Button>
				</div>

				{/* Search bar */}
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Поиск участников..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Members table */}
				<div className="rounded-lg border">
					<table className="w-full">
						<thead>
							<tr className="border-b">
								<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Участник
								</th>
								<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Роль
								</th>
								<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Отдел
								</th>
								<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Статус
								</th>
								<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Присоединился
								</th>
								<th className="relative px-6 py-3">
									<span className="sr-only">Действия</span>
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{filteredMembers?.map((member) => {
								const isOnline = member.user?.status === "online";
								const memberTeams = member.teams || [];

								return (
									<tr
										key={member.id}
										className="group transition-colors hover:bg-muted/50"
									>
										<td className="px-6 py-4">
											<div className="flex items-center">
												<Avatar className="h-8 w-8">
													<AvatarImage src={member.user?.image} />
													<AvatarFallback>
														{member.user?.name
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="ml-3">
													<div className="font-medium text-sm">
														{member.user?.name}
													</div>
													<div className="text-muted-foreground text-sm">
														{member.user?.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<Select
												value={member.role}
												onValueChange={(value) =>
													handleUpdateRole(
														member.id,
														value as "owner" | "admin" | "member",
													)
												}
											>
												<SelectTrigger className="h-8 w-[140px] border-0 bg-transparent hover:bg-muted">
													<SelectValue>
														{member.role ? (
															<div className="flex items-center gap-2">
																<Shield className="h-3 w-3 text-muted-foreground" />
																<span className="text-sm">{member.role}</span>
															</div>
														) : (
															<span className="text-muted-foreground text-sm">
																Выберите роль
															</span>
														)}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{["owner", "admin", "member"].map((r) => (
														<SelectItem key={r} value={r}>
															{r}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</td>
										<td className="px-6 py-4">
											{memberTeams.length > 0 ? (
												<div className="flex flex-wrap gap-1">
													{memberTeams.map((team) => (
														<Badge
															key={team.id}
															variant="secondary"
															className="text-xs"
														>
															{team.name}
														</Badge>
													))}
												</div>
											) : (
												<span className="text-muted-foreground text-sm">
													Нет команд
												</span>
											)}
										</td>
										<td className="px-6 py-4">
											<Badge
												variant={isOnline ? "default" : "secondary"}
												className={cn(
													"font-normal",
													isOnline
														? "bg-green-100 text-green-700 hover:bg-green-100"
														: "",
												)}
											>
												{isOnline ? "В сети" : "Не в сети"}
											</Badge>
										</td>
										<td className="px-6 py-4 text-muted-foreground text-sm">
											{format(new Date(member.createdAt), "d MMM yyyy", {
												locale: ru,
											})}
										</td>
										<td className="px-6 py-4">
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
													<DropdownMenuItem
														onClick={() => openEditModal(member)}
													>
														<User className="mr-2 h-4 w-4" />
														Редактировать
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Mail className="mr-2 h-4 w-4" />
														Отправить сообщение
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-red-600"
														onClick={() => handleRemoveMember(member.user!.id)}
													>
														<UserMinus className="mr-2 h-4 w-4" />
														Удалить из организации
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* Edit Member Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Редактировать участника</DialogTitle>
						<DialogDescription>
							Измените информацию о участнике организации
						</DialogDescription>
					</DialogHeader>
					{selectedMember && (
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<Avatar className="h-16 w-16">
									<AvatarImage src={selectedMember.user?.avatarUrl} />
									<AvatarFallback>
										{selectedMember.user?.name
											.split(" ")
											.map((n: string) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="font-semibold">{selectedMember.user?.name}</h3>
									<p className="text-muted-foreground text-sm">
										{selectedMember.user?.email}
									</p>
								</div>
							</div>
							<div className="space-y-4">
								<div>
									<Label>Роль</Label>
									<Select
										value={selectedMember.role?._id}
										onValueChange={(value) => {
											if (currentOrg && selectedMember.user) {
												handleUpdateRole(
													selectedMember.id,
													value as "owner" | "admin" | "member",
												);
												setSelectedMember({
													...selectedMember,
													role: roles?.find((r) => r._id === value),
												});
											}
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{["owner", "admin", "member"].map((role) => (
												<SelectItem key={role} value={role}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Команды</Label>
									<div className="text-muted-foreground text-sm">
										{selectedMember.teams?.length > 0 ? (
											<div className="mt-2 flex flex-wrap gap-1">
												{selectedMember.teams.map((team: any) => (
													<Badge key={team._id} variant="secondary">
														{team.name}
													</Badge>
												))}
											</div>
										) : (
											"Участник не состоит в командах"
										)}
									</div>
								</div>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
							Отмена
						</Button>
						<Button onClick={() => setIsEditModalOpen(false)}>Сохранить</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Invite Member Modal */}
			<Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Пригласить участника</DialogTitle>
						<DialogDescription>
							Отправьте приглашение новому участнику организации
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Email</Label>
							<Input
								type="email"
								placeholder="example@company.com"
								className="mt-1"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
							/>
						</div>
						<div>
							<Label>Роль</Label>
							<Select
								value={inviteRoleId}
								onValueChange={(value) => setInviteRoleId(value as Id<"roles">)}
							>
								<SelectTrigger className="mt-1">
									<SelectValue placeholder="Выберите роль" />
								</SelectTrigger>
								<SelectContent>
									{roles?.map((role) => (
										<SelectItem key={role._id} value={role._id}>
											{role.displayName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsInviteModalOpen(false)}
						>
							Отмена
						</Button>
						<Button onClick={handleInvite}>Отправить приглашение</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Pending Invites Section */}
			{pendingInvites && pendingInvites.length > 0 && (
				<div className="mt-8 space-y-4">
					<h3 className="font-semibold text-lg">Ожидающие приглашения</h3>
					<div className="rounded-lg border">
						<table className="w-full">
							<thead>
								<tr className="border-b">
									<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
										Email
									</th>
									<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
										Роль
									</th>
									<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
										Приглашен
									</th>
									<th className="px-6 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
										Код приглашения
									</th>
									<th className="relative px-6 py-3">
										<span className="sr-only">Действия</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								{pendingInvites.map((invite) => (
									<tr key={invite._id}>
										<td className="px-6 py-4 text-sm">{invite.email}</td>
										<td className="px-6 py-4 text-sm">
											{invite.role?.displayName}
										</td>
										<td className="px-6 py-4 text-muted-foreground text-sm">
											{format(new Date(invite.createdAt), "d MMM yyyy", {
												locale: ru,
											})}
										</td>
										<td className="px-6 py-4">
											<code className="rounded bg-muted px-2 py-1 text-xs">
												{invite.inviteCode}
											</code>
										</td>
										<td className="px-6 py-4">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => cancelInvite({ inviteId: invite._id })}
												className="text-red-600 hover:text-red-700"
											>
												Отменить
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</>
	);
}
