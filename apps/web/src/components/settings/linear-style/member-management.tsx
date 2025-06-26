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
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
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

interface LinearMemberManagementProps {
	organizationId?: string;
}

export function LinearMemberManagement({
	organizationId,
}: LinearMemberManagementProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedMember, setSelectedMember] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

	// Queries
	const users = useQuery(api.users.getAll);
	const roles = useQuery(api.permissions.queries.getAllRoles);
	const departments = useQuery(api.departments.queries.getAllDepartments);
	const userDepartments = useQuery(
		api.departments.queries.getAllUserDepartments,
	);

	// Mutations
	const updateUserRole = useMutation(api.users.updateUserRole);
	const assignUserToDepartment = useMutation(
		api.departments.mutations.assignUserToDepartment,
	);
	const removeUserFromDepartment = useMutation(
		api.departments.mutations.removeUserFromDepartment,
	);

	// Filter users based on search
	const filteredUsers = users?.filter((user) => {
		const matchesSearch =
			searchQuery === "" ||
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesSearch;
	});

	// Get role name for a user
	const getUserRole = (roleId?: Id<"roles">) => {
		if (!roleId || !roles) return null;
		return roles.find((r) => r._id === roleId);
	};

	// Get department info for a user
	const getUserDepartment = (userId: Id<"users">) => {
		const userDept = userDepartments?.find((ud) => ud.userId === userId);
		if (!userDept || !departments) return null;
		return departments.find((d) => d._id === userDept.departmentId);
	};

	const handleRoleChange = async (userId: Id<"users">, roleId: Id<"roles">) => {
		await updateUserRole({ userId, roleId });
	};

	const handleDepartmentChange = async (
		userId: Id<"users">,
		departmentId: Id<"departments">,
	) => {
		// Remove from current department first
		const currentDept = getUserDepartment(userId);
		if (currentDept) {
			const userDept = userDepartments?.find((ud) => ud.userId === userId);
			if (userDept) {
				await removeUserFromDepartment({ id: userDept._id });
			}
		}
		// Assign to new department
		await assignUserToDepartment({
			userId,
			departmentId,
			isPrimary: true,
			startDate: new Date().toISOString(),
		});
	};

	const openEditModal = (member: any) => {
		setSelectedMember(member);
		setIsEditModalOpen(true);
	};

	return (
		<>
			<div className="space-y-6">
				{/* Header with actions */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">Участники</h2>
						<p className="text-muted-foreground text-sm">
							{users?.length || 0} участников
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
							{filteredUsers?.map((user) => {
								const role = getUserRole(user.roleId);
								const department = getUserDepartment(user._id);
								const isOnline = user.status === "online";

								return (
									<tr
										key={user._id}
										className="group transition-colors hover:bg-muted/50"
									>
										<td className="px-6 py-4">
											<div className="flex items-center">
												<Avatar className="h-8 w-8">
													<AvatarImage src={user.avatarUrl} />
													<AvatarFallback>
														{user.name
															.split(" ")
															.map((n) => n[0])
															.join("")
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="ml-3">
													<div className="font-medium text-sm">{user.name}</div>
													<div className="text-muted-foreground text-sm">
														{user.email}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<Select
												value={user.roleId}
												onValueChange={(value) =>
													handleRoleChange(user._id, value as Id<"roles">)
												}
											>
												<SelectTrigger className="h-8 w-[140px] border-0 bg-transparent hover:bg-muted">
													<SelectValue>
														{role ? (
															<div className="flex items-center gap-2">
																<Shield className="h-3 w-3 text-muted-foreground" />
																<span className="text-sm">
																	{role.displayName}
																</span>
															</div>
														) : (
															<span className="text-muted-foreground text-sm">
																Выберите роль
															</span>
														)}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{roles?.map((r) => (
														<SelectItem key={r._id} value={r._id}>
															{r.displayName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</td>
										<td className="px-6 py-4">
											<Select
												value={department?._id || "none"}
												onValueChange={(value) => {
													if (value !== "none") {
														handleDepartmentChange(
															user._id,
															value as Id<"departments">,
														);
													}
												}}
											>
												<SelectTrigger className="h-8 w-[160px] border-0 bg-transparent hover:bg-muted">
													<SelectValue>
														{department ? (
															<div className="flex items-center gap-2">
																<Building className="h-3 w-3 text-muted-foreground" />
																<span className="text-sm">
																	{department.name}
																</span>
															</div>
														) : (
															<span className="text-muted-foreground text-sm">
																Выберите отдел
															</span>
														)}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="none">Без отдела</SelectItem>
													{departments?.map((d) => (
														<SelectItem key={d._id} value={d._id}>
															{d.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
											{format(new Date(user.joinedDate), "d MMM yyyy", {
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
													<DropdownMenuItem onClick={() => openEditModal(user)}>
														<User className="mr-2 h-4 w-4" />
														Редактировать
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Mail className="mr-2 h-4 w-4" />
														Отправить сообщение
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600">
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
									<AvatarImage src={selectedMember.avatarUrl} />
									<AvatarFallback>
										{selectedMember.name
											.split(" ")
											.map((n: string) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="font-semibold">{selectedMember.name}</h3>
									<p className="text-muted-foreground text-sm">
										{selectedMember.email}
									</p>
								</div>
							</div>
							<div className="space-y-4">
								<div>
									<Label>Роль</Label>
									<Select
										value={selectedMember.roleId}
										onValueChange={(value) => {
											handleRoleChange(
												selectedMember._id,
												value as Id<"roles">,
											);
											setSelectedMember({ ...selectedMember, roleId: value });
										}}
									>
										<SelectTrigger>
											<SelectValue />
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
								<div>
									<Label>Отдел</Label>
									<Select
										value={getUserDepartment(selectedMember._id)?._id || "none"}
										onValueChange={(value) => {
											if (value !== "none") {
												handleDepartmentChange(
													selectedMember._id,
													value as Id<"departments">,
												);
											}
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Без отдела</SelectItem>
											{departments?.map((dept) => (
												<SelectItem key={dept._id} value={dept._id}>
													{dept.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
							/>
						</div>
						<div>
							<Label>Роль</Label>
							<Select>
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
						<Button onClick={() => setIsInviteModalOpen(false)}>
							Отправить приглашение
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
