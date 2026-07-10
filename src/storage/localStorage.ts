import { IMemberWithContribution } from "@/types/Member";

// Adaptador web equivalente ao resgatar_app/src/storage/asyncStorage.ts.
// No app, dados sensíveis iam para o SecureStore e públicos para o AsyncStorage.
// No browser não há SecureStore; usamos localStorage e mantemos a mesma API de
// funções para que os serviços portem sem alteração. Todas as funções são
// SSR-safe (no-op quando window não existe).

const MEMBER_KEY = "@auth:member";
const ONBOARDING_KEY_PREFIX = "@onboarding:seen:";
const DASHBOARD_ORDER_PREFIX = "@dashboard:order:";
const LITURGY_CACHE_PREFIX = "@liturgy:";

const isBrowser = () => typeof window !== "undefined";

function getItem(key: string): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(key);
}

function setItem(key: string, value: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, value);
}

function removeItem(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

export async function saveMember(member: IMemberWithContribution): Promise<void> {
  setItem(MEMBER_KEY, JSON.stringify(member));
}

export async function getStoredMember(): Promise<IMemberWithContribution | null> {
  const raw = getItem(MEMBER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IMemberWithContribution;
  } catch {
    return null;
  }
}

export async function removeMember(): Promise<void> {
  removeItem(MEMBER_KEY);
}

export async function getOnboardingSeen(memberId: string): Promise<boolean> {
  return getItem(`${ONBOARDING_KEY_PREFIX}${memberId}`) === "true";
}

export async function setOnboardingSeen(memberId: string): Promise<void> {
  setItem(`${ONBOARDING_KEY_PREFIX}${memberId}`, "true");
}

export async function clearOnboardingSeen(memberId: string): Promise<void> {
  removeItem(`${ONBOARDING_KEY_PREFIX}${memberId}`);
}

export async function getDashboardOrder(
  memberId: string,
): Promise<string[] | null> {
  const raw = getItem(`${DASHBOARD_ORDER_PREFIX}${memberId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

export async function setDashboardOrder(
  memberId: string,
  order: string[],
): Promise<void> {
  setItem(`${DASHBOARD_ORDER_PREFIX}${memberId}`, JSON.stringify(order));
}

export async function getLiturgyCache<T>(dateKey: string): Promise<T | null> {
  const raw = getItem(`${LITURGY_CACHE_PREFIX}${dateKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setLiturgyCache<T>(
  dateKey: string,
  data: T,
): Promise<void> {
  setItem(`${LITURGY_CACHE_PREFIX}${dateKey}`, JSON.stringify(data));
}
