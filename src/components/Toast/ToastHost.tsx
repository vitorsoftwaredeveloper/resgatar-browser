"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { LogoResgatar } from "@/components/Svg/Logo";
import { dismissToast, subscribe, ToastItem } from "./toastStore";
import styles from "./ToastHost.module.css";

// Renderiza os toasts publicados via ToastMessage. Monte uma única vez, no
// nível raiz (Providers), para funcionar em qualquer tela.

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const router = useRouter();

  useEffect(() => subscribe(setItems), []);

  useEffect(() => {
    const timers = items.map((item) =>
      setTimeout(() => dismissToast(item.id), item.duration),
    );
    return () => timers.forEach(clearTimeout);
  }, [items]);

  if (items.length === 0) return null;

  function openToast(item: ToastItem) {
    dismissToast(item.id);
    if (item.url) router.push(item.url);
  }

  return (
    <div className={styles.host}>
      {items.map((item) =>
        item.type === "notification" ? (
          <div
            key={item.id}
            role={item.url ? "link" : undefined}
            tabIndex={item.url ? 0 : undefined}
            onClick={item.url ? () => openToast(item) : undefined}
            onKeyDown={
              item.url
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      openToast(item);
                    }
                  }
                : undefined
            }
            className={[
              styles.toast,
              styles.notification,
              item.url ? styles.clickable : "",
            ].join(" ")}
          >
            <span className={styles.icon}>
              <LogoResgatar size={50} color="var(--color-primary)" />
            </span>
            <span className={styles.text}>
              <p className={styles.title}>{item.title}</p>
              {item.message && <p className={styles.message}>{item.message}</p>}
            </span>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Fechar notificação"
              onClick={(event) => {
                event.stopPropagation();
                dismissToast(item.id);
              }}
            >
              <X size={16} color="var(--color-text-muted)" />
            </button>
          </div>
        ) : (
          <div
            key={item.id}
            className={[styles.toast, styles[item.type]].join(" ")}
          >
            <p className={styles.title}>{item.title}</p>
            {item.message && <p className={styles.message}>{item.message}</p>}
          </div>
        ),
      )}
    </div>
  );
}
