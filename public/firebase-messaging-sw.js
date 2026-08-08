importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;

const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});

if (firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title ?? payload.notification?.title ?? "Resgatar";
    const body =
      payload.data?.body ??
      payload.notification?.body ??
      "Você tem uma nova atualização.";

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload.data ?? {},
      tag: payload.data?.url ?? `${title}|${body}`,
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "notification-click", url });
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
