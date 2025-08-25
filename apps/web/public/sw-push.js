// Push notification handlers for the service worker

self.addEventListener("push", (event) => {
	console.log("[Service Worker] Push event received");

	if (!event.data) {
		console.log("[Service Worker] No data in push event");
		return;
	}

	let notification;
	try {
		notification = event.data.json();
		console.log("[Service Worker] Parsed notification:", notification);
	} catch (e) {
		console.log(
			"[Service Worker] Failed to parse JSON, using text:",
			event.data.text(),
		);
		notification = {
			title: "Новое уведомление",
			body: event.data.text(),
		};
	}

	const options = {
		body: notification.body,
		icon: notification.icon || "/favicon.svg",
		badge: notification.badge || "/favicon.svg",
		data: notification.data || {},
		actions: notification.actions || [],
		requireInteraction: true,
		vibrate: [200, 100, 200],
	};

	console.log("[Service Worker] Showing notification with options:", options);

	event.waitUntil(
		self.registration
			.showNotification(notification.title, options)
			.then(() =>
				console.log("[Service Worker] Notification shown successfully"),
			)
			.catch((err) =>
				console.error("[Service Worker] Error showing notification:", err),
			),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const action = event.action;
	const data = event.notification.data || {};

	if (action === "dismiss") {
		return;
	}

	let url = "/";

	// Determine URL based on notification data
	if (data.url) {
		url = data.url;
	} else if (data.issueId) {
		url = `/issues/${data.issueId}`;
	} else if (data.projectId) {
		url = `/projects/${data.projectId}`;
	}

	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				// Check if there's already a window/tab open
				for (let i = 0; i < clientList.length; i++) {
					const client = clientList[i];
					if (client.url.includes(self.location.origin) && "focus" in client) {
						client.navigate(url);
						return client.focus();
					}
				}
				// If no window/tab is open, open a new one
				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			}),
	);
});

// Handle background sync for failed notifications
self.addEventListener("sync", (event) => {
	if (event.tag === "notification-sync") {
		event.waitUntil(syncNotifications());
	}
});

async function syncNotifications() {
	// This would sync any failed notifications with the server
	// Implementation depends on your specific needs
}

// Test function for debugging
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SHOW_TEST_NOTIFICATION") {
		console.log("[Service Worker] Test notification requested");
		self.registration
			.showNotification("Test Notification from SW", {
				body: "If you see this, service worker notifications are working!",
				icon: "/favicon.svg",
				badge: "/favicon.svg",
				tag: "test-notification",
				requireInteraction: true,
			})
			.then(() => {
				console.log("[Service Worker] Test notification shown");
			})
			.catch((err) => {
				console.error("[Service Worker] Error showing test notification:", err);
			});
	}
});
