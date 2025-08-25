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
import { Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const requestPasswordReset = useMutation(
		api.passwordReset.requestPasswordReset,
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await requestPasswordReset({ email });
			setIsSubmitted(true);
			toast.success("Проверьте вашу почту");
		} catch (error) {
			toast.error("Произошла ошибка. Попробуйте позже.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Проверьте вашу почту</CardTitle>
						<CardDescription>
							Если аккаунт с указанным email существует, мы отправили инструкции
							по восстановлению пароля на {email}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link to="/auth/sign-in">
							<Button variant="outline" className="w-full">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Вернуться к входу
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Восстановление пароля</CardTitle>
					<CardDescription>
						Введите email, связанный с вашим аккаунтом, и мы отправим вам
						инструкции по восстановлению пароля.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="name@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Отправка..." : "Отправить инструкции"}
						</Button>
					</form>
					<div className="mt-4">
						<Link to="/auth/sign-in">
							<Button variant="link" className="w-full">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Вернуться к входу
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
