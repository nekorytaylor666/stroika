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
import type { Id } from "@stroika/backend";
import { api } from "@stroika/backend";
import { useMutation } from "convex/react";
import {
	Copy,
	MoreHorizontal,
	RefreshCw,
	Shield,
	Trash2,
	UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RoleSelectorDialog from "./role-selector-dialog";

interface MemberActionsDropdownProps {
	memberId: Id<"organizationMembers">;
	userId: Id<"users">;
	userName: string;
	userEmail: string;
	currentRoleId: Id<"roles">;
	organizationId: Id<"organizations">;
	isCurrentUser?: boolean;
	onUpdate?: () => void;
}

export default function MemberActionsDropdown({
	memberId,
	userId,
	userName,
	userEmail,
	currentRoleId,
	organizationId,
	isCurrentUser = false,
	onUpdate,
}: MemberActionsDropdownProps) {
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [showRoleDialog, setShowRoleDialog] = useState(false);
	const [generatedPassword, setGeneratedPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// Mutations
	const generatePassword = useMutation(
		api.passwordReset.generateTemporaryPasswordForUser,
	);
	const deactivateMember = useMutation(
		api.organizationMembers.deactivateMember,
	);
	const removeMember = useMutation(api.organizationMembers.removeMember);

	const handleGeneratePassword = async () => {
		setIsLoading(true);
		try {
			const result = await generatePassword({
				userId,
				sendEmail: true,
			});
			setGeneratedPassword(result.temporaryPassword);
			toast.success("Новый пароль сгенерирован и отправлен на email");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Ошибка при генерации пароля",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeactivate = async () => {
		if (!confirm(`Вы уверены, что хотите деактивировать ${userName}?`)) {
			return;
		}

		try {
			await deactivateMember({ memberId });
			toast.success("Пользователь деактивирован");
			onUpdate?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при деактивации пользователя",
			);
		}
	};

	const handleRemove = async () => {
		if (
			!confirm(
				`Вы уверены, что хотите удалить ${userName} из организации? Это действие нельзя отменить.`,
			)
		) {
			return;
		}

		try {
			await removeMember({ memberId });
			toast.success("Пользователь удален из организации");
			onUpdate?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Ошибка при удалении пользователя",
			);
		}
	};

	const handleCopyPassword = () => {
		navigator.clipboard.writeText(generatedPassword);
		toast.success("Пароль скопирован в буфер обмена");
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem
						onClick={() => setShowPasswordDialog(true)}
						disabled={isCurrentUser}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Сбросить пароль
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => setShowRoleDialog(true)}
						disabled={isCurrentUser}
					>
						<Shield className="mr-2 h-4 w-4" />
						Изменить роль
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuItem
						onClick={handleDeactivate}
						disabled={isCurrentUser}
						className="text-orange-600 focus:text-orange-600"
					>
						<UserX className="mr-2 h-4 w-4" />
						Деактивировать
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={handleRemove}
						disabled={isCurrentUser}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Удалить из организации
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Сбросить пароль</DialogTitle>
						<DialogDescription>
							Сгенерировать новый временный пароль для {userName}?
						</DialogDescription>
					</DialogHeader>

					{generatedPassword ? (
						<div className="space-y-4">
							<div className="rounded-lg border border-green-200 bg-green-50 p-4">
								<p className="mb-2 font-medium text-green-800 text-sm">
									Пароль успешно сброшен!
								</p>
								<p className="text-green-700 text-sm">
									Новый пароль отправлен на {userEmail}
								</p>
							</div>

							<div className="space-y-2">
								<p className="font-medium text-sm">Временный пароль:</p>
								<div className="flex items-center space-x-2">
									<code className="flex-1 rounded bg-gray-100 p-2 font-mono text-sm">
										{generatedPassword}
									</code>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleCopyPassword}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									Пользователь должен будет изменить пароль при следующем входе.
								</p>
							</div>
						</div>
					) : (
						<div className="py-4">
							<p className="mb-4 text-muted-foreground text-sm">
								Будет сгенерирован новый временный пароль. Пользователь получит
								email с инструкциями и должен будет изменить пароль при
								следующем входе.
							</p>
						</div>
					)}

					<DialogFooter>
						{!generatedPassword ? (
							<>
								<Button
									variant="outline"
									onClick={() => setShowPasswordDialog(false)}
									disabled={isLoading}
								>
									Отмена
								</Button>
								<Button onClick={handleGeneratePassword} disabled={isLoading}>
									{isLoading ? "Генерация..." : "Сгенерировать пароль"}
								</Button>
							</>
						) : (
							<Button onClick={() => setShowPasswordDialog(false)}>
								Закрыть
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<RoleSelectorDialog
				open={showRoleDialog}
				onOpenChange={setShowRoleDialog}
				memberId={memberId}
				userId={userId}
				userName={userName}
				currentRoleId={currentRoleId}
				organizationId={organizationId}
				onUpdate={onUpdate}
			/>
		</>
	);
}
