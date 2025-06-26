"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	Building,
	ChevronDown,
	Filter,
	Mail,
	Plus,
	Search,
	Shield,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";

interface MemberManagementProps {
	organizationId?: string;
}

export function MemberManagement({ organizationId }: MemberManagementProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [departmentFilter, setDepartmentFilter] = useState<string>("all");
	const [selectedMember, setSelectedMember] = useState<any>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

	// Filter users based on search and filters
	const filteredUsers = users?.filter((user) => {
		const matchesSearch =
			searchQuery === "" ||
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesRole = roleFilter === "all" || user.roleId === roleFilter;

		const userDept = userDepartments?.find((ud) => ud.userId === user._id);
		const matchesDepartment =
			departmentFilter === "all" || userDept?.departmentId === departmentFilter;

		return matchesSearch && matchesRole && matchesDepartment;
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

	// Handle role change
	const handleRoleChange = async (userId: Id<"users">, roleId: Id<"roles">) => {
		try {
			await updateUserRole({ userId, roleId });
		} catch (error) {
			console.error("Failed to update role:", error);
		}
	};

	// Stats
	const stats = {
		totalMembers: users?.length || 0,
		activeMembers: users?.filter((u) => u.isActive).length || 0,
		departments: departments?.length || 0,
		roles: roles?.length || 0,
	};

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Всего участников
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.totalMembers}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Активные участники
						</CardTitle>
						<UserCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.activeMembers}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Отделы</CardTitle>
						<Building className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.departments}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Роли</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats.roles}</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-4">
					<div className="relative max-w-sm flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Поиск участников..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Все роли" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Все роли</SelectItem>
							{roles?.map((role) => (
								<SelectItem key={role._id} value={role._id}>
									{role.displayName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={departmentFilter} onValueChange={setDepartmentFilter}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Все отделы" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Все отделы</SelectItem>
							{departments?.map((dept) => (
								<SelectItem key={dept._id} value={dept._id}>
									{dept.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Пригласить участника
				</Button>
			</div>

			{/* Members Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Участник</TableHead>
							<TableHead>Роль</TableHead>
							<TableHead>Отдел</TableHead>
							<TableHead>Статус</TableHead>
							<TableHead>Присоединился</TableHead>
							<TableHead className="text-right">Действия</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredUsers?.map((user) => {
							const role = getUserRole(user.roleId);
							const department = getUserDepartment(user._id);
							return (
								<TableRow key={user._id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="h-8 w-8">
												<AvatarImage src={user.avatarUrl} />
												<AvatarFallback>
													{user.name
														.split(" ")
														.map((n) => n[0])
														.join("")}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium">{user.name}</p>
												<p className="text-muted-foreground text-sm">
													{user.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										{role && (
											<Badge variant="secondary">{role.displayName}</Badge>
										)}
									</TableCell>
									<TableCell>
										{department ? (
											<span className="text-sm">{department.name}</span>
										) : (
											<span className="text-muted-foreground text-sm">
												Не назначен
											</span>
										)}
									</TableCell>
									<TableCell>
										<Badge variant={user.isActive ? "default" : "secondary"}>
											{user.isActive ? "Активен" : "Неактивен"}
										</Badge>
									</TableCell>
									<TableCell>
										<span className="text-muted-foreground text-sm">
											{new Date(user._creationTime).toLocaleDateString("ru-RU")}
										</span>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setSelectedMember(user);
												setIsEditModalOpen(true);
											}}
										>
											Изменить
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</Card>

			{/* Edit Member Modal */}
			<MemberEditModal
				member={selectedMember}
				open={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				roles={roles}
				departments={departments}
				userDepartments={userDepartments}
				onRoleChange={handleRoleChange}
				onDepartmentChange={async (userId, departmentId, positionId) => {
					if (departmentId) {
						await assignUserToDepartment({
							userId,
							departmentId,
							positionId,
						});
					}
				}}
			/>
		</div>
	);
}

interface MemberEditModalProps {
	member: any;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roles: any[] | undefined;
	departments: any[] | undefined;
	userDepartments: any[] | undefined;
	onRoleChange: (userId: Id<"users">, roleId: Id<"roles">) => Promise<void>;
	onDepartmentChange: (
		userId: Id<"users">,
		departmentId: Id<"departments"> | null,
		positionId: Id<"organizationalPositions">,
	) => Promise<void>;
}

function MemberEditModal({
	member,
	open,
	onOpenChange,
	roles,
	departments,
	userDepartments,
	onRoleChange,
	onDepartmentChange,
}: MemberEditModalProps) {
	const [selectedRole, setSelectedRole] = useState(member?.roleId || "");
	const [selectedDepartment, setSelectedDepartment] = useState("");

	// Get organizational positions
	const positions = useQuery(
		api.permissions.queries.getAllOrganizationalPositions,
	);

	const userDept = userDepartments?.find((ud) => ud.userId === member?._id);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Редактировать участника</DialogTitle>
				</DialogHeader>
				{member && (
					<div className="space-y-6 py-4">
						{/* Member Info */}
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={member.avatarUrl} />
								<AvatarFallback>
									{member.name
										.split(" ")
										.map((n: string) => n[0])
										.join("")}
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="font-semibold text-lg">{member.name}</h3>
								<p className="text-muted-foreground text-sm">{member.email}</p>
							</div>
						</div>

						{/* Role Selection */}
						<div className="space-y-2">
							<label className="font-medium text-sm">Роль</label>
							<Select
								value={selectedRole}
								onValueChange={(value) => {
									setSelectedRole(value);
									onRoleChange(member._id, value as Id<"roles">);
								}}
							>
								<SelectTrigger>
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

						{/* Department Selection */}
						<div className="space-y-2">
							<label className="font-medium text-sm">Отдел</label>
							<Select
								value={userDept?.departmentId || ""}
								onValueChange={(value) => {
									// For now, assign as Engineer by default
									const engineerPosition = positions?.find(
										(p) => p.name === "Engineer",
									);
									if (engineerPosition) {
										onDepartmentChange(
											member._id,
											value as Id<"departments">,
											engineerPosition._id,
										);
									}
								}}
							>
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

						{/* Permissions Preview */}
						<div className="space-y-2">
							<label className="font-medium text-sm">Права доступа</label>
							<div className="rounded-md border bg-muted/50 p-4">
								<p className="text-muted-foreground text-sm">
									Права будут определены на основе выбранной роли и позиции в
									отделе
								</p>
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
