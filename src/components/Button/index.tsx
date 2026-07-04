"use client";

import React, { ButtonHTMLAttributes, useCallback, useState } from "react";
import styles from "./Button.module.css";

// Portado de resgatar_app/src/components/Button. TouchableOpacity + ActivityIndicator
// viram <button> + spinner CSS. Mesma API: variant, loading controlado/automático
// (quando onPress retorna uma Promise), leftIcon/rightIcon.

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  title: string;
  variant?: "primary" | "secondary";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  onPress?: () => Promise<void> | void;
};

export function Button({
  title,
  variant = "primary",
  className,
  disabled,
  onPress,
  leftIcon,
  rightIcon,
  loading: externalLoading,
  ...rest
}: Props) {
  const [internalLoading, setInternalLoading] = useState(false);

  const isControlled = typeof externalLoading === "boolean";
  const loading = isControlled ? externalLoading : internalLoading;

  const handlePress = useCallback(async () => {
    if (!onPress || loading) return;

    const result = onPress();

    if (!isControlled && result instanceof Promise) {
      try {
        setInternalLoading(true);
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  }, [onPress, loading, isControlled]);

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handlePress}
      className={[
        styles.button,
        styles[variant],
        disabled || loading ? styles.disabled : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-label="Carregando" />
      ) : (
        <span className={styles.content}>
          {leftIcon}
          <span
            className={[
              styles.text,
              variant === "primary" ? styles.textOnPrimary : styles.textOnSecondary,
            ].join(" ")}
          >
            {title}
          </span>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
