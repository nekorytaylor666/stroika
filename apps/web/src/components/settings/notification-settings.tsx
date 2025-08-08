import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { api } from "@/lib/convex";
import { useMutation } from "convex/react";
import { Bell, BellOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NotificationSettings() {
	const {
		permission,
		isSubscribed,
		isSupported,
		preferences,
		toggleSubscription,
	} = usePushNotifications();

	const updatePreferences = useMutation(
		api.notifications.updateNotificationPreferences,
	);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleSubscription = async () => {
		setIsLoading(true);
		try {
			await toggleSubscription();
		} finally {
			setIsLoading(false);
		}
	};

	const handlePreferenceChange = async (key: string, value: boolean) => {
		try {
			await updatePreferences({ [key]: value });
			toast.success("Настройки уведомлений обновлены");
		} catch (error) {
			toast.error("Ошибка при обновлении настроек");
		}
	};

	if (!isSupported) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Push-уведомления</CardTitle>
					<CardDescription>
						Ваш браузер не поддерживает push-уведомления
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Push-уведомления</CardTitle>
					<CardDescription>
						Получайте уведомления о важных событиях в проектах
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Push-уведомления</Label>
								<p className="text-muted-foreground text-sm">
									{isSubscribed
										? "Вы подписаны на push-уведомления"
										: permission === "denied"
											? "Уведомления заблокированы в настройках браузера"
											: "Включите push-уведомления для получения обновлений"}
								</p>
							</div>
							<Button
								variant={isSubscribed ? "outline" : "default"}
								size="sm"
								onClick={handleToggleSubscription}
								disabled={isLoading || permission === "denied"}
							>
								{isSubscribed ? (
									<>
										<BellOff className="mr-2 h-4 w-4" />
										Отключить
									</>
								) : (
									<>
										<Bell className="mr-2 h-4 w-4" />
										Включить
									</>
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{preferences && (
				<Card>
					<CardHeader>
						<CardTitle>Типы уведомлений</CardTitle>
						<CardDescription>
							Выберите, о каких событиях вы хотите получать уведомления
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Назначение задач</Label>
									<p className="text-muted-foreground text-sm">
										Когда вам назначают новую задачу
									</p>
								</div>
								<Switch
									checked={preferences.taskAssigned}
									onCheckedChange={(checked) =>
										handlePreferenceChange("taskAssigned", checked)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Изменение статуса</Label>
									<p className="text-muted-foreground text-sm">
										Когда статус вашей задачи изменяется
									</p>
								</div>
								<Switch
									checked={preferences.taskStatusChanged}
									onCheckedChange={(checked) =>
										handlePreferenceChange("taskStatusChanged", checked)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Комментарии</Label>
									<p className="text-muted-foreground text-sm">
										Когда кто-то комментирует вашу задачу
									</p>
								</div>
								<Switch
									checked={preferences.taskCommented}
									onCheckedChange={(checked) =>
										handlePreferenceChange("taskCommented", checked)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Приближение дедлайна</Label>
									<p className="text-muted-foreground text-sm">
										Напоминания о приближающихся сроках
									</p>
								</div>
								<Switch
									checked={preferences.taskDueSoon}
									onCheckedChange={(checked) =>
										handlePreferenceChange("taskDueSoon", checked)
									}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<Label>Обновления проектов</Label>
									<p className="text-muted-foreground text-sm">
										Важные изменения в проектах
									</p>
								</div>
								<Switch
									checked={preferences.projectUpdates}
									onCheckedChange={(checked) =>
										handlePreferenceChange("projectUpdates", checked)
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
