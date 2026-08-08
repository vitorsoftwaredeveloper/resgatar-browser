import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  deleteToken,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { ENV, IS_PUSH_CONFIGURED } from "@/config/env";

const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function serviceWorkerUrl(): string {
  const params = new URLSearchParams(firebaseConfig as Record<string, string>);
  return `${SERVICE_WORKER_PATH}?${params.toString()}`;
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!IS_PUSH_CONFIGURED || typeof window === "undefined") return null;
  if (!(await isSupported().catch(() => false))) return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  if (!messaging) {
    const { getMessaging } = await import("firebase/messaging");
    messaging = getMessaging(app);
  }

  return messaging;
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register(serviceWorkerUrl());
}

export async function getFcmToken(): Promise<string | null> {
  const instance = await getMessagingInstance();
  if (!instance) return null;

  const registration = await registerMessagingServiceWorker();
  if (!registration) return null;

  await navigator.serviceWorker.ready;

  return getToken(instance, {
    vapidKey: ENV.FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

export async function deleteFcmToken(): Promise<void> {
  const instance = await getMessagingInstance();
  if (!instance) return;

  await deleteToken(instance);
}

export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const instance = await getMessagingInstance();
  if (!instance) return () => {};

  return onMessage(instance, callback);
}
