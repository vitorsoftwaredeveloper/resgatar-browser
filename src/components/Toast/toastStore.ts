export type ToastType = "success" | "error" | "warning";

export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

type Listener = (items: ToastItem[]) => void;

// Pub/sub simples para o toast global do web. Equivalente ao root do
// react-native-toast-message, mas mantido em memória (sem dependência externa)
// e montado uma vez em <Providers> para funcionar em qualquer parte do app.

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => listeners.delete(listener);
}

export function pushToast(type: ToastType, title: string, message: string | undefined, duration: number) {
  const id = nextId++;
  items = [...items, { id, type, title, message, duration }];
  emit();
  return id;
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}
