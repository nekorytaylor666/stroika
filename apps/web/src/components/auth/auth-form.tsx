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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@stroika/backend";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useConvex, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

export function AuthForm() {
	const { signIn } = useAuthActions();
	const navigate = useNavigate();
	const search = useSearch({ from: "/auth" });
	const returnTo = (search as any)?.returnTo;
	const [isLoading, setIsLoading] = useState(false);
	const convex = useConvex();

	const handleSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
		flow: "signIn" | "signUp",
	) => {
		event.preventDefault();
		setIsLoading(true);

		const formData = new FormData(event.currentTarget);
		formData.append("flow", flow);

		try {
			await signIn("password", formData);
			toast.success(
				flow === "signIn" ? "Вход выполнен" : "Регистрация успешна",
			);

			// If there's a returnTo URL, redirect there
			if (returnTo) {
				navigate({ to: returnTo });
			} else {
				// Otherwise, redirect to the default organization
				const organizations = await convex.query(
					api.organizations.getUserOrganizations,
				);
				navigate({
					to: "/construction/$orgId/inbox",
					params: { orgId: organizations[0]._id },
				});
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Произошла ошибка при аутентификации",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-center font-bold text-2xl">
						Stroika
					</CardTitle>
					<CardDescription className="text-center">
						Система управления строительными проектами
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="signin" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="signin">Вход</TabsTrigger>
							<TabsTrigger value="signup">Регистрация</TabsTrigger>
						</TabsList>
						<TabsContent value="signin">
							<form
								onSubmit={(e) => handleSubmit(e, "signIn")}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="email-signin">Email</Label>
									<Input
										id="email-signin"
										name="email"
										type="email"
										placeholder="name@example.com"
										required
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password-signin">Пароль</Label>
									<Input
										id="password-signin"
										name="password"
										type="password"
										required
										disabled={isLoading}
									/>
								</div>
								<div className="flex items-center justify-end">
									<Link
										to="/auth/forgot-password"
										className="text-muted-foreground text-sm hover:underline"
									>
										Забыли пароль?
									</Link>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Вход..." : "Войти"}
								</Button>
							</form>
						</TabsContent>
						<TabsContent value="signup">
							<form
								onSubmit={(e) => handleSubmit(e, "signUp")}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Label htmlFor="name-signup">Имя</Label>
									<Input
										id="name-signup"
										name="name"
										type="text"
										placeholder="Иван Иванов"
										required
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email-signup">Email</Label>
									<Input
										id="email-signup"
										name="email"
										type="email"
										placeholder="name@example.com"
										required
										disabled={isLoading}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="password-signup">Пароль</Label>
									<Input
										id="password-signup"
										name="password"
										type="password"
										required
										disabled={isLoading}
									/>
								</div>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "Регистрация..." : "Зарегистрироваться"}
								</Button>
							</form>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
