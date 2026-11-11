/* DoctorPro Service Worker — Unlimited Free Browser Web Push Notifications */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "DoctorPro Alert",
    body: "You have an appointment or queue update.",
    url: "/live-queue",
    tag: "doctorpro-turn-alert",
    urgent: false,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag || "doctorpro-turn-alert",
    renotify: true,
    requireInteraction: Boolean(payload.urgent),
    vibrate: payload.urgent ? [250, 100, 250, 100, 250] : [180, 90, 180],
    data: {
      url: payload.url || "/live-queue",
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath = event.notification?.data?.url || "/live-queue";
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            if ("navigate" in client) {
              client.navigate(targetUrl).catch(() => {});
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
