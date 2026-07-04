"use client";

import { TextareaHTMLAttributes, useState } from "react";
import styles from "./TextArea.module.css";

// Portado de resgatar_app/src/components/TextArea.

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "rows"> & {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string | false;
  numberOfLines?: number;
};

export const TextArea = ({
  label,
  value,
  onChangeText,
  error,
  numberOfLines = 4,
  className,
  ...props
}: TextAreaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={[
          styles.container,
          isFocused && styles.containerFocused,
          hasError && styles.containerError,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <textarea
          value={value}
          onChange={(e) => onChangeText?.(e.target.value)}
          rows={numberOfLines}
          className={[styles.input, className].filter(Boolean).join(" ")}
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
      </div>

      {hasError && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};
