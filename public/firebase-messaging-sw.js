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

function showFromPayload(payload) {
  const data = payload?.data ?? {};
  const title = data.title ?? payload?.notification?.title ?? "Resgatar";
  const body =
    data.body ??
    payload?.notification?.body ??
    "Você tem uma nova atualização.";

  return self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data,
    tag: data.url ?? `${title}|${body}`,
  });
}

let firebaseHandlesPush = false;

if (firebaseConfig.projectId) {
  try {
    firebase.initializeApp(firebaseConfig);
    firebase.messaging().onBackgroundMessage(showFromPayload);
    firebaseHandlesPush = true;
  } catch (error) {
    console.error("Firebase Messaging indisponível no service worker", error);
  }
}

self.addEventListener("push", (event) => {
  if (firebaseHandlesPush) return;

  let payload = null;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }

  event.waitUntil(showFromPayload(payload));
});

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
