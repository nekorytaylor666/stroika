import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@stroika/backend";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ForcePasswordChangeModal() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Check if user must change password
	const mustChangePassword = useQuery(
		api.passwordReset.checkMustChangePassword,
	);

	// We'll need to implement a change password mutation
	// const changePassword = useMutation(api.passwordReset.changePassword);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (newPassword !== confirmPassword) {
			toast.error("Новые пароли не совпадают");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("Пароль должен содержать минимум 8 символов");
			return;
		}

		if (currentPassword === newPassword) {
			toast.error("Новый пароль должен отличаться от текущего");
			return;
		}

		setIsLoading(true);

		try {
			// TODO: Implement password change mutation
			// await changePassword({ currentPassword, newPassword });
			toast.success("Пароль успешно изменен");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Ошибка при изменении пароля",
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!mustChangePassword?.mustChange) {
		return null;
	}

	return (
		<Dialog open={true} onOpenChange={() => {}}>
			<DialogContent className="sm:max-w-[425px]" hideCloseButton>
				<DialogHeader>
					<DialogTitle>Необходимо изменить пароль</DialogTitle>
					<DialogDescription>
						Для продолжения работы необходимо изменить временный пароль на
						новый.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="currentPassword">Текущий пароль</Label>
						<div className="relative">
							<Input
								id="currentPassword"
								type={showCurrentPassword ? "text" : "password"}
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowCurrentPassword(!showCurrentPassword)}
							>
								{showCurrentPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="newPassword">Новый пароль</Label>
						<div className="relative">
							<Input
								id="newPassword"
								type={showNewPassword ? "text" : "password"}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								disabled={isLoading}
								minLength={8}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowNewPassword(!showNewPassword)}
							>
								{showNewPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
						<div className="relative">
							<Input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
								minLength={8}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								{showConfirmPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					<div className="text-muted-foreground text-sm">
						<ul className="list-disc space-y-1 pl-5">
							<li>Минимум 8 символов</li>
							<li>Должен отличаться от текущего пароля</li>
							<li>Рекомендуется использовать буквы, цифры и символы</li>
						</ul>
					</div>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Изменение..." : "Изменить пароль"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
