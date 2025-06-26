"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	AlertTriangle,
	Calendar,
	Check,
	Edit,
	Key,
	Plus,
	Search,
	Shield,
	ShieldCheck,
	User,
	X,
} from "lucide-react";
import { useState } from "react";

interface PermissionsManagementProps {
	organizationId?: string;
}

// Resource and action mapping for display
const resourceDisplayNames: Record<string, string> = {
	projects: "Проекты",
	constructionProjects: "Строительные проекты",
	users: "Пользователи",
	teams: "Команды",
	constructionTeams: "Строительные команды",
	issues: "Задачи",
	roles: "Роли",
	permissions: "Права доступа",
	revenue: "Доходы",
	workCategories: "Категории работ",
};

const actionDisplayNames: Record<string, string> = {
	create: "Создание",
	read: "Просмотр",
	update: "Изменение",
	delete: "Удаление",
	manage: "Управление",
};

export function PermissionsManagement({
	organizationId,
}: PermissionsManagementProps) {
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

	// Queries
	const roles = useQuery(api.permissions.queries.getAllRoles);
	const permissions = useQuery(api.permissions.queries.getAllPermissions);
	const rolePermissions = useQuery(
		api.permissions.queries.getAllRolePermissions,
	);
	const userPermissions = useQuery(
		api.permissions.queries.getAllUserPermissions,
	);
	const users = useQuery(api.users.getAll);
	const auditLog = useQuery(api.permissions.queries.getRecentAuditLog);

	// Mutations
	const updateRolePermissions = useMutation(
		api.permissions.utils.updateRolePermissions,
	);
	const grantUserPermission = useMutation(
		api.permissions.utils.grantUserPermission,
	);
	const revokeUserPermission = useMutation(
		api.permissions.utils.revokeUserPermission,
	);

	// Group permissions by resource
	const permissionsByResource = permissions?.reduce(
		(acc, perm) => {
			if (!acc[perm.resource]) {
				acc[perm.resource] = [];
			}
			acc[perm.resource].push(perm);
			return acc;
		},
		{} as Record<string, typeof permissions>,
	);

	// Get permissions for selected role
	const selectedRolePermissions = rolePermissions?.filter(
		(rp) => rp.roleId === selectedRole,
	);

	// Get permissions for selected user
	const selectedUserPermissions = userPermissions?.filter(
		(up) => up.userId === selectedUser,
	);

	// Filter users for search
	const filteredUsers = users?.filter(
		(user) =>
			searchQuery === "" ||
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Handle role permission toggle
	const handleRolePermissionToggle = async (
		roleId: Id<"roles">,
		permissionId: Id<"permissions">,
		granted: boolean,
	) => {
		const currentPermissions =
			rolePermissions
				?.filter((rp) => rp.roleId === roleId)
				.map((rp) => rp.permissionId) || [];

		const updatedPermissions = granted
			? [...currentPermissions, permissionId]
			: currentPermissions.filter((id) => id !== permissionId);

		await updateRolePermissions({
			roleId,
			permissionIds: updatedPermissions,
		});
	};

	return (
		<div className="space-y-6">
			<Tabs defaultValue="roles" className="space-y-4">
				<TabsList>
					<TabsTrigger value="roles">Роли и права</TabsTrigger>
					<TabsTrigger value="users">Права пользователей</TabsTrigger>
					<TabsTrigger value="audit">История изменений</TabsTrigger>
				</TabsList>

				{/* Roles Tab */}
				<TabsContent value="roles" className="space-y-4">
					<div className="grid gap-4 lg:grid-cols-12">
						{/* Roles List */}
						<Card className="lg:col-span-4">
							<CardHeader>
								<CardTitle>Системные роли</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{roles?.map((role) => (
									<button
										key={role._id}
										onClick={() => setSelectedRole(role._id)}
										className={cn(
											"flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent",
											selectedRole === role._id && "bg-accent",
										)}
									>
										<div>
											<p className="font-medium">{role.displayName}</p>
											<p className="text-muted-foreground text-sm">
												{role.description}
											</p>
										</div>
										<Shield className="h-4 w-4 text-muted-foreground" />
									</button>
								))}
							</CardContent>
						</Card>

						{/* Permissions Matrix */}
						<Card className="lg:col-span-8">
							<CardHeader>
								<CardTitle>
									{selectedRole
										? `Права доступа: ${
												roles?.find((r) => r._id === selectedRole)?.displayName
											}`
										: "Выберите роль"}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedRole && permissionsByResource ? (
									<div className="space-y-6">
										{Object.entries(permissionsByResource).map(
											([resource, perms]) => (
												<div key={resource}>
													<h4 className="mb-3 font-medium">
														{resourceDisplayNames[resource] || resource}
													</h4>
													<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
														{perms.map((permission) => {
															const isGranted = selectedRolePermissions?.some(
																(rp) => rp.permissionId === permission._id,
															);
															return (
																<label
																	key={permission._id}
																	className="flex items-center space-x-2"
																>
																	<Checkbox
																		checked={isGranted}
																		onCheckedChange={(checked) => {
																			handleRolePermissionToggle(
																				selectedRole as Id<"roles">,
																				permission._id,
																				checked as boolean,
																			);
																		}}
																	/>
																	<span className="text-sm">
																		{actionDisplayNames[permission.action] ||
																			permission.action}
																	</span>
																</label>
															);
														})}
													</div>
												</div>
											),
										)}
									</div>
								) : (
									<p className="text-muted-foreground">
										Выберите роль для просмотра и изменения прав доступа
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Users Tab */}
				<TabsContent value="users" className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="relative max-w-sm">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Поиск пользователей..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Button
							onClick={() => setIsGrantModalOpen(true)}
							disabled={!selectedUser}
						>
							<Plus className="mr-2 h-4 w-4" />
							Назначить право
						</Button>
					</div>

					<div className="grid gap-4 lg:grid-cols-12">
						{/* Users List */}
						<Card className="lg:col-span-4">
							<CardHeader>
								<CardTitle>Пользователи</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								{filteredUsers?.map((user) => (
									<button
										key={user._id}
										onClick={() => setSelectedUser(user._id)}
										className={cn(
											"flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent",
											selectedUser === user._id && "bg-accent",
										)}
									>
										<div>
											<p className="font-medium">{user.name}</p>
											<p className="text-muted-foreground text-sm">
												{user.email}
											</p>
										</div>
										<User className="h-4 w-4 text-muted-foreground" />
									</button>
								))}
							</CardContent>
						</Card>

						{/* User Permissions */}
						<Card className="lg:col-span-8">
							<CardHeader>
								<CardTitle>
									{selectedUser
										? `Индивидуальные права: ${
												users?.find((u) => u._id === selectedUser)?.name
											}`
										: "Выберите пользователя"}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{selectedUser && selectedUserPermissions ? (
									<div className="space-y-4">
										{selectedUserPermissions.length > 0 ? (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Ресурс</TableHead>
														<TableHead>Действие</TableHead>
														<TableHead>Тип</TableHead>
														<TableHead>Срок действия</TableHead>
														<TableHead className="text-right">
															Действия
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{selectedUserPermissions.map((userPerm) => {
														const permission = permissions?.find(
															(p) => p._id === userPerm.permissionId,
														);
														if (!permission) return null;

														return (
															<TableRow key={userPerm._id}>
																<TableCell>
																	{resourceDisplayNames[permission.resource] ||
																		permission.resource}
																</TableCell>
																<TableCell>
																	{actionDisplayNames[permission.action] ||
																		permission.action}
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			userPerm.type === "grant"
																				? "default"
																				: "destructive"
																		}
																	>
																		{userPerm.type === "grant" ? (
																			<>
																				<Check className="mr-1 h-3 w-3" />
																				Разрешено
																			</>
																		) : (
																			<>
																				<X className="mr-1 h-3 w-3" />
																				Запрещено
																			</>
																		)}
																	</Badge>
																</TableCell>
																<TableCell>
																	{userPerm.expiresAt ? (
																		<div className="flex items-center gap-1 text-sm">
																			<Calendar className="h-3 w-3" />
																			{new Date(
																				userPerm.expiresAt,
																			).toLocaleDateString("ru-RU")}
																		</div>
																	) : (
																		<span className="text-muted-foreground text-sm">
																			Бессрочно
																		</span>
																	)}
																</TableCell>
																<TableCell className="text-right">
																	<Button
																		variant="ghost"
																		size="sm"
																		onClick={() =>
																			revokeUserPermission({
																				userPermissionId: userPerm._id,
																			})
																		}
																	>
																		Удалить
																	</Button>
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
										) : (
											<p className="text-center text-muted-foreground">
												У пользователя нет индивидуальных прав. Права
												определяются ролью.
											</p>
										)}
									</div>
								) : (
									<p className="text-center text-muted-foreground">
										Выберите пользователя для просмотра индивидуальных прав
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Audit Tab */}
				<TabsContent value="audit" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>История изменений прав доступа</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Дата и время</TableHead>
										<TableHead>Пользователь</TableHead>
										<TableHead>Действие</TableHead>
										<TableHead>Изменения</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{auditLog?.map((entry) => (
										<TableRow key={entry._id}>
											<TableCell>
												{new Date(entry.timestamp).toLocaleString("ru-RU")}
											</TableCell>
											<TableCell>
												{users?.find((u) => u._id === entry.performedBy)
													?.name || "Система"}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{entry.action}</Badge>
											</TableCell>
											<TableCell className="max-w-md">
												<p className="text-sm">{entry.details}</p>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Grant Permission Modal */}
			<GrantPermissionModal
				open={isGrantModalOpen}
				onOpenChange={setIsGrantModalOpen}
				userId={selectedUser}
				permissions={permissions}
				onGrant={async (data) => {
					if (selectedUser) {
						await grantUserPermission({
							userId: selectedUser as Id<"users">,
							permissionId: data.permissionId,
							type: data.type,
							expiresAt: data.expiresAt,
							reason: data.reason,
						});
						setIsGrantModalOpen(false);
					}
				}}
			/>
		</div>
	);
}

interface GrantPermissionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string | null;
	permissions: any[] | undefined;
	onGrant: (data: {
		permissionId: Id<"permissions">;
		type: "grant" | "revoke";
		expiresAt?: string;
		reason?: string;
	}) => Promise<void>;
}

function GrantPermissionModal({
	open,
	onOpenChange,
	userId,
	permissions,
	onGrant,
}: GrantPermissionModalProps) {
	const [selectedPermission, setSelectedPermission] = useState("");
	const [type, setType] = useState<"grant" | "revoke">("grant");
	const [hasExpiration, setHasExpiration] = useState(false);
	const [expiresAt, setExpiresAt] = useState("");
	const [reason, setReason] = useState("");

	const handleSubmit = async () => {
		await onGrant({
			permissionId: selectedPermission as Id<"permissions">,
			type,
			expiresAt: hasExpiration ? expiresAt : undefined,
			reason: reason || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Назначить индивидуальное право</DialogTitle>
					<DialogDescription>
						Назначьте или отзовите право доступа для пользователя
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Право доступа</Label>
						<Select
							value={selectedPermission}
							onValueChange={setSelectedPermission}
						>
							<SelectTrigger>
								<SelectValue placeholder="Выберите право" />
							</SelectTrigger>
							<SelectContent>
								{permissions?.map((permission) => (
									<SelectItem key={permission._id} value={permission._id}>
										{resourceDisplayNames[permission.resource] ||
											permission.resource}{" "}
										-{" "}
										{actionDisplayNames[permission.action] || permission.action}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Тип действия</Label>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant={type === "grant" ? "default" : "outline"}
								onClick={() => setType("grant")}
								className="justify-start"
							>
								<Check className="mr-2 h-4 w-4" />
								Разрешить
							</Button>
							<Button
								variant={type === "revoke" ? "destructive" : "outline"}
								onClick={() => setType("revoke")}
								className="justify-start"
							>
								<X className="mr-2 h-4 w-4" />
								Запретить
							</Button>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							id="expiration"
							checked={hasExpiration}
							onCheckedChange={setHasExpiration}
						/>
						<Label htmlFor="expiration">Ограничить срок действия</Label>
					</div>

					{hasExpiration && (
						<div className="space-y-2">
							<Label>Дата окончания</Label>
							<Input
								type="datetime-local"
								value={expiresAt}
								onChange={(e) => setExpiresAt(e.target.value)}
							/>
						</div>
					)}

					<div className="space-y-2">
						<Label>Причина (необязательно)</Label>
						<Input
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Укажите причину назначения права"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Отмена
					</Button>
					<Button onClick={handleSubmit} disabled={!selectedPermission}>
						Назначить
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
