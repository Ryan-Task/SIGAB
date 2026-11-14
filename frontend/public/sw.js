self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "Peringatan SIGAB", {
    body: data.body || "Ada pembaruan kondisi wilayah pantauan Anda.",
    icon: data.icon || "/sigab-notification.svg",
    badge: data.badge || "/sigab-notification.svg",
    tag: data.tag || "sigab-alert",
    renotify: true,
    requireInteraction: Boolean(data.urgent),
    vibrate: data.urgent ? [300, 100, 300, 100, 500] : [200, 100, 200],
    data: { url: data.url || "/daerah-anda" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/daerah-anda", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const client = clients.find((item) => "focus" in item);
    if (client) {
      client.navigate(url);
      return client.focus();
    }
    return self.clients.openWindow(url);
  }));
});
