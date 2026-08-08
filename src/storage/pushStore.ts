const TOKEN_KEY = "@push:token";
const DISABLED_KEY = "@push:disabled";

const isBrowser = () => typeof window !== "undefined";

let token: string | null = isBrowser()
  ? window.localStorage.getItem(TOKEN_KEY)
  : null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToPushToken(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getPushTokenSnapshot(): string | null {
  return token;
}

export function getPushTokenServerSnapshot(): string | null {
  return null;
}

export function savePushToken(value: string): void {
  token = value;
  if (isBrowser()) window.localStorage.setItem(TOKEN_KEY, value);
  emit();
}

export function clearPushToken(): void {
  token = null;
  if (isBrowser()) window.localStorage.removeItem(TOKEN_KEY);
  emit();
}

export function isPushDisabledByUser(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(DISABLED_KEY) === "true";
}

export function setPushDisabledByUser(value: boolean): void {
  if (!isBrowser()) return;
  if (value) window.localStorage.setItem(DISABLED_KEY, "true");
  else window.localStorage.removeItem(DISABLED_KEY);
}
