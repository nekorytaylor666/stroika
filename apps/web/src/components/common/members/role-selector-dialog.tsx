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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@stroika/backend";
import type { Id } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface RoleSelectorDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	memberId: Id<"organizationMembers">;
	userId: Id<"users">;
	userName: string;
	currentRoleId: Id<"roles">;
	organizationId: Id<"organizations">;
	onUpdate?: () => void;
}

export default function RoleSelectorDialog({
	open,
	onOpenChange,
	memberId,
	userId,
	userName,
	currentRoleId,
	organizationId,
	onUpdate,
}: RoleSelectorDialogProps) {
	const [selectedRoleId, setSelectedRoleId] = useState<Id<"roles"> | undefined>(
		currentRoleId,
	);
	const [isLoading, setIsLoading] = useState(false);

	// Get available roles
	const roles = useQuery(api.permissions.roles.getRoles);

	// Get current role details
	const currentRole = roles?.find((r) => r._id === currentRoleId);

	// Update role mutation
	const updateRole = useMutation(api.organizationMembers.updateRole);

	const handleUpdateRole = async () => {
		if (!selectedRoleId || selectedRoleId === currentRoleId) {
			onOpenChange(false);
			return;
		}

		setIsLoading(true);
		try {
			await updateRole({
				organizationId,
				userId,
				roleId: selectedRoleId,
			});
			toast.success("Роль успешно обновлена");
			onUpdate?.();
			onOpenChange(false);
		} catch (error: unknown) {
			console.error("Failed to update role:", error);
			toast.error(error.message || "Не удалось обновить роль");
		} finally {
			setIsLoading(false);
		}
	};

	const selectedRole = roles?.find((r) => r._id === selectedRoleId);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Изменить роль</DialogTitle>
					<DialogDescription>
						Изменить роль для {userName}. Текущая роль:{" "}
						{currentRole?.displayName || "Неизвестная"}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="role" className="text-right">
							Новая роль
						</Label>
						<div className="col-span-3">
							<Select
								value={selectedRoleId}
								onValueChange={(value) =>
									setSelectedRoleId(value as Id<"roles">)
								}
								disabled={isLoading}
							>
								<SelectTrigger>
									<SelectValue placeholder="Выберите роль..." />
								</SelectTrigger>
								<SelectContent>
									{roles?.map((role) => (
										<SelectItem
											key={role._id}
											value={role._id}
											disabled={role._id === currentRoleId}
										>
											<div className="flex flex-col">
												<span className="font-medium">{role.displayName}</span>
												{role.description && (
													<span className="text-muted-foreground text-xs">
														{role.description}
													</span>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{selectedRole && selectedRole._id !== currentRoleId && (
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
							<h4 className="mb-1 font-medium text-blue-900 text-sm">
								{selectedRole.displayName}
							</h4>
							<p className="text-blue-700 text-xs">
								{selectedRole.description}
							</p>
							{selectedRole.memberCount !== undefined && (
								<p className="mt-1 text-blue-600 text-xs">
									{selectedRole.memberCount} участник(ов) с этой ролью
								</p>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Отмена
					</Button>
					<Button
						onClick={handleUpdateRole}
						disabled={isLoading || selectedRoleId === currentRoleId}
					>
						{isLoading ? "Обновление..." : "Обновить роль"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
