import { api } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// VAPID public key - this should match the one in your Convex environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding)
		.replace(/\-/g, "+")
		.replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export function usePushNotifications() {
	const [permission, setPermission] =
		useState<NotificationPermission>("default");
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isSupported, setIsSupported] = useState(false);

	const subscribeToPush = useMutation(api.notifications.subscribeToPush);
	const unsubscribeFromPush = useMutation(
		api.notifications.unsubscribeFromPush,
	);
	const preferences = useQuery(api.notifications.getNotificationPreferences);

	useEffect(() => {
		// Check if push notifications are supported
		const supported =
			"serviceWorker" in navigator &&
			"PushManager" in window &&
			"Notification" in window;
		setIsSupported(supported);

		if (supported) {
			// Check current permission status
			setPermission(Notification.permission);

			// Check if already subscribed
			checkSubscription();
		}
	}, []);

	const checkSubscription = async () => {
		if (!("serviceWorker" in navigator)) return;

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();
			setIsSubscribed(!!subscription);
		} catch (error) {
			console.error("Error checking subscription:", error);
		}
	};

	const requestPermission = useCallback(async () => {
		if (!isSupported) {
			toast.error("Push-уведомления не поддерживаются в вашем браузере");
			return false;
		}

		if (!VAPID_PUBLIC_KEY) {
			toast.error("VAPID ключ не настроен. Обратитесь к администратору.");
			return false;
		}

		try {
			const result = await Notification.requestPermission();
			setPermission(result);

			if (result === "granted") {
				const subscribed = await subscribe();
				return subscribed;
			} else if (result === "denied") {
				toast.error(
					"Вы заблокировали уведомления. Измените настройки в браузере.",
				);
				return false;
			}

			return false;
		} catch (error) {
			console.error("Error requesting permission:", error);
			toast.error("Ошибка при запросе разрешения на уведомления");
			return false;
		}
	}, [isSupported]);

	const subscribe = async () => {
		if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) {
			return false;
		}

		try {
			const registration = await navigator.serviceWorker.ready;

			// Check if already subscribed
			const existingSubscription =
				await registration.pushManager.getSubscription();
			if (existingSubscription) {
				await existingSubscription.unsubscribe();
			}

			// Subscribe to push notifications
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
			});

			// Send subscription to server
			await subscribeToPush({
				subscription: {
					endpoint: subscription.endpoint,
					keys: {
						p256dh: btoa(
							String.fromCharCode(
								...new Uint8Array(subscription.getKey("p256dh")!),
							),
						),
						auth: btoa(
							String.fromCharCode(
								...new Uint8Array(subscription.getKey("auth")!),
							),
						),
					},
				},
				userAgent: navigator.userAgent,
			});

			setIsSubscribed(true);
			toast.success("Вы успешно подписались на уведомления");
			return true;
		} catch (error) {
			console.error("Error subscribing to push:", error);
			toast.error("Ошибка при подписке на уведомления");
			return false;
		}
	};

	const unsubscribe = async () => {
		if (!("serviceWorker" in navigator)) {
			return false;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.getSubscription();

			if (subscription) {
				await subscription.unsubscribe();
				await unsubscribeFromPush({
					endpoint: subscription.endpoint,
				});
			}

			setIsSubscribed(false);
			toast.success("Вы отписались от уведомлений");
			return true;
		} catch (error) {
			console.error("Error unsubscribing:", error);
			toast.error("Ошибка при отписке от уведомлений");
			return false;
		}
	};

	const toggleSubscription = async () => {
		if (isSubscribed) {
			return unsubscribe();
		} else {
			if (permission === "granted") {
				return subscribe();
			} else {
				return requestPermission();
			}
		}
	};

	return {
		permission,
		isSubscribed,
		isSupported,
		preferences,
		requestPermission,
		subscribe,
		unsubscribe,
		toggleSubscription,
	};
}
