"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import {
	AlertTriangle,
	Check,
	ChevronRight,
	Info,
	Lock,
	Plus,
	Search,
	Settings,
	Shield,
	X,
} from "lucide-react";
import { useState } from "react";

interface LinearPermissionsManagementProps {
	organizationId?: string;
}

interface RoleFormData {
	name: string;
	displayName: string;
	description: string;
}

const permissionGroups = [
	{
		name: "Проекты",
		resource: "projects",
		permissions: [
			{ action: "create", label: "Создание проектов" },
			{ action: "read", label: "Просмотр проектов" },
			{ action: "update", label: "Редактирование проектов" },
			{ action: "delete", label: "Удаление проектов" },
			{ action: "manage", label: "Полное управление проектами" },
		],
	},
	{
		name: "Задачи",
		resource: "issues",
		permissions: [
			{ action: "create", label: "Создание задач" },
			{ action: "read", label: "Просмотр задач" },
			{ action: "update", label: "Редактирование задач" },
			{ action: "delete", label: "Удаление задач" },
			{ action: "assign", label: "Назначение задач" },
		],
	},
	{
		name: "Команды",
		resource: "teams",
		permissions: [
			{ action: "create", label: "Создание команд" },
			{ action: "read", label: "Просмотр команд" },
			{ action: "update", label: "Редактирование команд" },
			{ action: "delete", label: "Удаление команд" },
			{ action: "manage_members", label: "Управление участниками" },
		],
	},
	{
		name: "Пользователи",
		resource: "users",
		permissions: [
			{ action: "read", label: "Просмотр пользователей" },
			{ action: "update", label: "Редактирование пользователей" },
			{ action: "delete", label: "Удаление пользователей" },
			{ action: "manage_roles", label: "Управление ролями" },
		],
	},
];

export function LinearPermissionsManagement({
	organizationId,
}: LinearPermissionsManagementProps) {
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
	const [roleFormData, setRoleFormData] = useState<RoleFormData>({
		name: "",
		displayName: "",
		description: "",
	});

	// Queries
	const roles = useQuery(api.permissions.queries.getAllRoles);
	const permissions = useQuery(api.permissions.queries.getAllPermissions);
	const rolePermissions = useQuery(
		api.permissions.queries.getAllRolePermissions,
	);

	// Mutations
	const createRole = useMutation(api.permissions.mutations.createRole);
	const updateRolePermissions = useMutation(
		api.permissions.utils.updateRolePermissions,
	);

	// Get permissions for a specific role
	const getRolePermissions = (roleId: Id<"roles">) => {
		if (!rolePermissions || !permissions) return new Set<string>();
		const rolePerms = rolePermissions.filter((rp) => rp.roleId === roleId);
		const permIds = new Set<string>();
		rolePerms.forEach((rp) => {
			const perm = permissions.find((p) => p._id === rp.permissionId);
			if (perm) {
				permIds.add(`${perm.resource}:${perm.action}`);
			}
		});
		return permIds;
	};

	const handleCreateRole = async () => {
		await createRole({
			...roleFormData,
			isSystem: false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		setIsCreateRoleModalOpen(false);
		setRoleFormData({ name: "", displayName: "", description: "" });
	};

	const handlePermissionToggle = async (
		roleId: Id<"roles">,
		resource: string,
		action: string,
		enabled: boolean,
	) => {
		const permission = permissions?.find(
			(p) => p.resource === resource && p.action === action,
		);
		if (permission) {
			await updateRolePermissions({
				roleId,
				permissionId: permission._id,
				granted: enabled,
			});
		}
	};

	const selectedRoleData = roles?.find((r) => r._id === selectedRole);
	const selectedRolePermissions = selectedRole
		? getRolePermissions(selectedRole as Id<"roles">)
		: new Set<string>();

	return (
		<div className="flex h-full">
			{/* Roles sidebar */}
			<div className="w-80 border-r">
				<div className="p-6">
					<div className="mb-6 flex items-center justify-between">
						<h3 className="font-semibold">Роли</h3>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setIsCreateRoleModalOpen(true)}
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
					<ScrollArea className="h-[500px]">
						<div className="space-y-1">
							{roles?.map((role) => (
								<button
									key={role._id}
									onClick={() => setSelectedRole(role._id)}
									className={cn(
										"w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
										selectedRole === role._id
											? "bg-accent text-accent-foreground"
											: "hover:bg-muted/50",
									)}
								>
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium">{role.displayName}</div>
											{role.description && (
												<div className="text-muted-foreground text-xs">
													{role.description}
												</div>
											)}
										</div>
										{role.isSystem && (
											<Lock className="h-3 w-3 text-muted-foreground" />
										)}
									</div>
								</button>
							))}
						</div>
					</ScrollArea>
				</div>
			</div>

			{/* Permissions content */}
			<div className="flex-1">
				{selectedRoleData ? (
					<div className="p-6">
						<div className="mb-6">
							<div className="flex items-center gap-2">
								<h2 className="font-semibold text-xl">
									{selectedRoleData.displayName}
								</h2>
								{selectedRoleData.isSystem && (
									<Badge variant="secondary" className="gap-1">
										<Lock className="h-3 w-3" />
										Системная роль
									</Badge>
								)}
							</div>
							{selectedRoleData.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{selectedRoleData.description}
								</p>
							)}
						</div>

						<div className="space-y-6">
							{permissionGroups.map((group) => (
								<div key={group.resource} className="space-y-3">
									<h3 className="flex items-center gap-2 font-medium">
										<Shield className="h-4 w-4 text-muted-foreground" />
										{group.name}
									</h3>
									<div className="space-y-2">
										{group.permissions.map((permission) => {
											const permKey = `${group.resource}:${permission.action}`;
											const isEnabled = selectedRolePermissions.has(permKey);
											const isSystemRole = selectedRoleData.isSystem;

											return (
												<div
													key={permKey}
													className="flex items-center justify-between rounded-lg border p-3"
												>
													<div className="flex items-center gap-3">
														<Checkbox
															checked={isEnabled}
															disabled={isSystemRole}
															onCheckedChange={(checked) =>
																handlePermissionToggle(
																	selectedRole as Id<"roles">,
																	group.resource,
																	permission.action,
																	checked as boolean,
																)
															}
														/>
														<span className="text-sm">{permission.label}</span>
													</div>
													{isEnabled && (
														<Check className="h-4 w-4 text-green-600" />
													)}
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>

						{selectedRoleData.isSystem && (
							<div className="mt-6 rounded-lg bg-muted/50 p-4">
								<div className="flex gap-2">
									<Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
									<div className="text-muted-foreground text-sm">
										Системные роли нельзя изменить. Они предоставляют базовые
										права доступа, необходимые для работы системы.
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
							<h3 className="mt-4 font-semibold">Выберите роль</h3>
							<p className="mt-2 text-muted-foreground text-sm">
								Выберите роль слева для управления правами доступа
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Create Role Modal */}
			<Dialog
				open={isCreateRoleModalOpen}
				onOpenChange={setIsCreateRoleModalOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Создать роль</DialogTitle>
						<DialogDescription>
							Создайте новую роль с настраиваемыми правами доступа
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Системное имя</Label>
							<Input
								value={roleFormData.name}
								onChange={(e) =>
									setRoleFormData({ ...roleFormData, name: e.target.value })
								}
								placeholder="например: project_manager"
								className="mt-1"
							/>
							<p className="mt-1 text-muted-foreground text-xs">
								Используется в системе, только латинские буквы и подчеркивания
							</p>
						</div>
						<div>
							<Label>Отображаемое имя</Label>
							<Input
								value={roleFormData.displayName}
								onChange={(e) =>
									setRoleFormData({
										...roleFormData,
										displayName: e.target.value,
									})
								}
								placeholder="например: Менеджер проектов"
								className="mt-1"
							/>
						</div>
						<div>
							<Label>Описание</Label>
							<Textarea
								value={roleFormData.description}
								onChange={(e) =>
									setRoleFormData({
										...roleFormData,
										description: e.target.value,
									})
								}
								placeholder="Опишите назначение этой роли..."
								className="mt-1"
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateRoleModalOpen(false)}
						>
							Отмена
						</Button>
						<Button onClick={handleCreateRole}>Создать</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
