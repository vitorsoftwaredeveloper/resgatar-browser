"use client";

import { useEffect, useState } from "react";
import { dismissToast, subscribe, ToastItem } from "./toastStore";
import styles from "./ToastHost.module.css";

// Renderiza os toasts publicados via ToastMessage. Monte uma única vez, no
// nível raiz (Providers), para funcionar em qualquer tela.

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setItems), []);

  useEffect(() => {
    const timers = items.map((item) =>
      setTimeout(() => dismissToast(item.id), item.duration),
    );
    return () => timers.forEach(clearTimeout);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className={styles.host}>
      {items.map((item) => (
        <div key={item.id} className={[styles.toast, styles[item.type]].join(" ")}>
          <p className={styles.title}>{item.title}</p>
          {item.message && <p className={styles.message}>{item.message}</p>}
        </div>
      ))}
    </div>
  );
}
