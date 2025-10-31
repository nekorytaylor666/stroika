import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useMutation, useQuery } from "convex/react";
import { Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ProfileSettings() {
	const user = useQuery(api.users.me);
	const updateProfile = useMutation(api.users.updateProfile);

	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: user?.name || "",
		email: user?.email || "",
		phone: user?.phone || "",
	});

	// Update form data when user data loads
	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				email: user.email || "",
				phone: user.phone || "",
			});
		}
	}, [user]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			await updateProfile({
				name: formData.name,
				phone: formData.phone,
			});
			toast.success("Профиль обновлен");
		} catch (error) {
			toast.error("Ошибка при обновлении профиля");
		} finally {
			setIsLoading(false);
		}
	};

	if (!user) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const initials =
		user.name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || "??";

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Информация профиля</CardTitle>
					<CardDescription>Обновите информацию вашего профиля</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="flex items-center gap-6">
							<Avatar className="h-20 w-20">
								<AvatarImage src={user.avatarUrl} />
								<AvatarFallback>{initials}</AvatarFallback>
							</Avatar>
							<div className="flex-1">
								<Label>Фото профиля</Label>
								<p className="mt-1 text-muted-foreground text-sm">
									Рекомендуемый размер 400x400px
								</p>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-2"
									disabled
								>
									<Upload className="mr-2 h-4 w-4" />
									Загрузить фото
								</Button>
							</div>
						</div>

						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="name">Имя</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="Введите ваше имя"
								/>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									disabled
									className="bg-muted"
								/>
								<p className="text-muted-foreground text-xs">
									Email нельзя изменить
								</p>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="phone">Телефон</Label>
								<Input
									id="phone"
									type="tel"
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
									placeholder="+7 (999) 999-99-99"
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Сохранить изменения
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Информация об аккаунте</CardTitle>
					<CardDescription>
						Дополнительная информация о вашем аккаунте
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">ID пользователя</p>
							<p className="text-muted-foreground text-sm">{user.id}</p>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">Дата регистрации</p>
							<p className="text-muted-foreground text-sm">
								{new Date(user._creationTime).toLocaleDateString("ru-RU", {
									year: "numeric",
									month: "long",
									day: "numeric",
								})}
							</p>
						</div>
					</div>
					{user.role && (
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium text-sm">Роль</p>
								<p className="text-muted-foreground text-sm">{user.role}</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
