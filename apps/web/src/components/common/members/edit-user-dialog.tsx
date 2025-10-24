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
import type { Id } from "@stroika/backend";
import { api } from "@stroika/backend";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface EditUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: Id<"users">;
	userName: string;
	userEmail: string;
	onUpdate?: () => void;
}

export default function EditUserDialog({
	open,
	onOpenChange,
	userId,
	userName,
	userEmail,
	onUpdate,
}: EditUserDialogProps) {
	const [name, setName] = useState(userName);
	const [email, setEmail] = useState(userEmail);
	const [isLoading, setIsLoading] = useState(false);

	// Update user mutation
	const updateUser = useMutation(api.users.update);

	// Reset form when dialog opens/closes
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setName(userName);
			setEmail(userEmail);
		}
		onOpenChange(newOpen);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate inputs
		if (!name.trim()) {
			toast.error("Имя обязательно для заполнения");
			return;
		}

		if (!email.trim()) {
			toast.error("Электронная почта обязательна для заполнения");
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast.error("Пожалуйста, введите корректный адрес электронной почты");
			return;
		}

		// Check if anything changed
		if (name.trim() === userName && email.trim() === userEmail) {
			toast.info("Нет изменений для сохранения");
			onOpenChange(false);
			return;
		}

		setIsLoading(true);
		try {
			await updateUser({
				id: userId,
				name: name.trim() !== userName ? name.trim() : undefined,
				email: email.trim() !== userEmail ? email.trim() : undefined,
			});

			toast.success("Пользователь успешно обновлен");
			onUpdate?.();
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Не удалось обновить пользователя",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Редактировать пользователя</DialogTitle>
					<DialogDescription>
						Обновить имя и электронную почту пользователя.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Имя</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Введите имя пользователя"
							disabled={isLoading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Электронная почта</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Введите электронную почту"
							disabled={isLoading}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Отмена
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Сохранение..." : "Сохранить изменения"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
