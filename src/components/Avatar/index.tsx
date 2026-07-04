"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { resolveAvatarUri } from "@/utils/image";
import { Camera, UserRound } from "lucide-react";
import styles from "./Avatar.module.css";

// Portado de resgatar_app/src/components/Avatar.

interface AvatarProps {
  photo?: string | null;
  size?: number;
  onPress?: () => void;
  editable?: boolean;
}

export function Avatar({ photo, size = 56, onPress, editable }: AvatarProps) {
  const { colors } = useAppTheme();
  const uri = resolveAvatarUri(photo);

  const content = (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div
        className={styles.circle}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      >
        {uri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uri}
            alt=""
            className={styles.image}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <UserRound size={size * 0.45} color={colors.primary} />
        )}
      </div>

      {editable && (
        <div className={styles.badge}>
          <Camera size={14} color={colors.white} />
        </div>
      )}
    </div>
  );

  if (!onPress) return content;

  return (
    <button type="button" onClick={onPress} className={styles.pressable}>
      {content}
    </button>
  );
}
