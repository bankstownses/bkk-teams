// BKK-FEIGE service worker -- runs in the background, separate from the
// app's own page, which is what lets it show a real notification even
// when the app isn't open at all.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "BKK-FEIGE", body: event.data ? event.data.text() : "" }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "BKK-FEIGE — Incoming Tasking", {
      body: data.body || "",
      icon: data.icon,
      badge: data.icon,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true, // stays visible until the person deals with it, not just a few seconds
      tag: "bkk-feige-tasking",
      renotify: true,
    })
  );
});

// Tapping the notification brings the app to the front (or opens it fresh
// if it wasn't running), rather than just dismissing it.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
