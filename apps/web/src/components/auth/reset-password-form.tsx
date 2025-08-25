import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@stroika/backend";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ResetPasswordFormProps {
	token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const tokenValidation = useQuery(api.passwordReset.validateResetToken, {
		token,
	});
	const resetPassword = useMutation(api.passwordReset.resetPasswordWithToken);

	useEffect(() => {
		if (tokenValidation && !tokenValidation.valid) {
			toast.error(tokenValidation.error || "Invalid token");
			navigate({ to: "/auth/forgot-password" });
		}
	}, [tokenValidation, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Пароли не совпадают");
			return;
		}

		if (password.length < 8) {
			toast.error("Пароль должен содержать минимум 8 символов");
			return;
		}

		setIsLoading(true);

		try {
			await resetPassword({ token, newPassword: password });
			toast.success("Пароль успешно изменен");
			navigate({ to: "/auth/sign-in" });
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Произошла ошибка при сбросе пароля",
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!tokenValidation) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Card className="w-full max-w-md">
					<CardContent className="p-6">
						<div className="flex items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Создайте новый пароль</CardTitle>
					<CardDescription>
						Введите новый пароль для вашего аккаунта
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="password">Новый пароль</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={isLoading}
									minLength={8}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Подтвердите пароль</Label>
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
								<li>Рекомендуется использовать буквы, цифры и символы</li>
							</ul>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Сохранение..." : "Сохранить новый пароль"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
