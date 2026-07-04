"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";
import styles from "./Input.module.css";

// Portado de resgatar_app/src/components/Input. TextInput vira <input>; mesma
// API de props (label, highlighted, leftIcon/rightIcon, error).

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: string;
  value?: string;
  highlighted?: boolean;
  onChangeText?: (text: string) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string | false;
};

export const Input = ({
  label,
  value,
  onChangeText,
  highlighted,
  leftIcon,
  rightIcon,
  error,
  className,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={[
          styles.container,
          (highlighted || isFocused) && styles.highlighted,
          hasError && styles.error,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}

        <input
          value={value}
          onChange={(e) => onChangeText?.(e.target.value)}
          className={styles.input}
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />

        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </div>

      {hasError && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};
