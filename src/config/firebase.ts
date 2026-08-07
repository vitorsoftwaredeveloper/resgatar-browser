import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { deleteToken, getToken, isSupported, Messaging } from "firebase/messaging";
import { ENV } from "./env";

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!ENV.FIREBASE_API_KEY) {
    console.error("Firebase Web Push não configurado (env NEXT_PUBLIC_FIREBASE_*).");
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const { getMessaging } = await import("firebase/messaging");
  return getMessaging(getFirebaseApp());
}

export async function getFcmToken(): Promise<string | null> {
  if (!ENV.FIREBASE_VAPID_KEY) {
    console.error("Firebase Web Push não configurado (env NEXT_PUBLIC_FIREBASE_VAPID_KEY).");
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const swRegistration = await navigator.serviceWorker.ready;

  return getToken(messaging, {
    vapidKey: ENV.FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swRegistration,
  });
}

export async function deleteFcmToken(): Promise<void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  await deleteToken(messaging);
}
