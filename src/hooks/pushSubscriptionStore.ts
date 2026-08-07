const STORAGE_KEY = "@push:subscribed";

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "true";
}

let subscribed = readInitial();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToPushSubscriptionStore(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getPushSubscriptionSnapshot(): boolean {
  return subscribed;
}

export function getPushSubscriptionServerSnapshot(): boolean {
  return false;
}

export function setPushSubscribed(value: boolean): void {
  subscribed = value;
  if (typeof window !== "undefined") {
    if (value) window.localStorage.setItem(STORAGE_KEY, "true");
    else window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}
