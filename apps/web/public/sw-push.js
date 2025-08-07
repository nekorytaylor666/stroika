// Push notification handlers for the service worker

self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  let notification;
  try {
    notification = event.data.json();
  } catch (e) {
    notification = {
      title: 'Новое уведомление',
      body: event.data.text(),
    };
  }

  const options = {
    body: notification.body,
    icon: notification.icon || '/favicon.svg',
    badge: notification.badge || '/favicon.svg',
    data: notification.data || {},
    actions: notification.actions || [],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(notification.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  let url = '/';

  // Determine URL based on notification data
  if (data.url) {
    url = data.url;
  } else if (data.issueId) {
    url = `/issues/${data.issueId}`;
  } else if (data.projectId) {
    url = `/projects/${data.projectId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle background sync for failed notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // This would sync any failed notifications with the server
  // Implementation depends on your specific needs
}