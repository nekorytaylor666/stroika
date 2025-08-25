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
import { api } from "@stroika/backend";
import { useMutation } from "convex/react";
import { Bell, BellOff, Send } from "lucide-react";
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
	const sendTestNotification = useMutation(
		api.notifications.sendTestNotification,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isTestLoading, setIsTestLoading] = useState(false);

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

	const handleSendTestNotification = async () => {
		setIsTestLoading(true);
		try {
			// Check notification permission
			console.log("Notification permission:", permission);
			console.log("Is subscribed:", isSubscribed);

			// Check service worker and subscription details
			if ("serviceWorker" in navigator) {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				console.log("Current subscription:", subscription);
				if (subscription) {
					console.log("Subscription endpoint:", subscription.endpoint);
					console.log("Subscription keys:", {
						p256dh: subscription.getKey("p256dh"),
						auth: subscription.getKey("auth"),
					});
				}
			}

			// Check VAPID key
			console.log(
				"VAPID Public Key exists:",
				!!import.meta.env.VITE_VAPID_PUBLIC_KEY,
			);
			console.log(
				"VAPID Public Key length:",
				import.meta.env.VITE_VAPID_PUBLIC_KEY?.length,
			);
			console.log(
				"VAPID Public Key (first 20 chars):",
				import.meta.env.VITE_VAPID_PUBLIC_KEY?.substring(0, 20),
			);

			if (permission === "denied") {
				toast.error(
					"Уведомления заблокированы в браузере. Разрешите уведомления в настройках браузера.",
				);
				return;
			}

			if (!isSubscribed) {
				toast.error("Сначала подпишитесь на уведомления");
				return;
			}

			const result = await sendTestNotification();
			toast.success(result.message);

			// Log for debugging
			console.log("Test notification sent:", result);
		} catch (error: any) {
			console.error("Test notification error:", error);
			toast.error(error.message || "Ошибка при отправке тестового уведомления");
		} finally {
			setIsTestLoading(false);
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
						{isSubscribed && (
							<div className="mt-4 border-t pt-4">
								<Button
									variant="outline"
									size="sm"
									onClick={handleSendTestNotification}
									disabled={isTestLoading}
									className="w-full"
								>
									{isTestLoading ? (
										<>Отправка...</>
									) : (
										<>
											<Send className="mr-2 h-4 w-4" />
											Отправить тестовое уведомление
										</>
									)}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={async () => {
										if ("serviceWorker" in navigator) {
											const registration = await navigator.serviceWorker.ready;
											registration.active?.postMessage({
												type: "SHOW_TEST_NOTIFICATION",
											});
											toast.info(
												"Тестовое уведомление отправлено в service worker",
											);
										}
									}}
									className="mt-2 w-full"
								>
									<Bell className="mr-2 h-4 w-4" />
									Тест Service Worker
								</Button>
							</div>
						)}
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
