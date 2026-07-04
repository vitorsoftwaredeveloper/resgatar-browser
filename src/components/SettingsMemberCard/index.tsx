"use client";

import { Avatar } from "@/components/Avatar";
import { useAppTheme } from "@/context/ThemeContext";
import { IMember } from "@/types/Member";
import { ReactNode } from "react";
import styles from "./SettingsMemberCard.module.css";

// Portado de resgatar_app/src/components/SettingsMemberCard.

type Props = {
  member: IMember;
  onAction: (member: IMember) => void;
  iconAction: ReactNode;
  variant?: "delete" | "edit";
  loading?: boolean;
};

export function SettingsMemberCard({ member, onAction, iconAction, variant = "edit", loading = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <div className={styles.card}>
      <div className={styles.userInfo}>
        <Avatar photo={member.profileImage} size={40} />

        <div>
          <p className={styles.userName}>{member?.firstName}</p>
          <p className={styles.userEmail}>{member?.email}</p>
        </div>
      </div>
      <button
        type="button"
        className={styles[variant]}
        onClick={() => !loading && onAction(member)}
        disabled={loading}
      >
        {loading ? <span className={styles.spinner} style={{ borderTopColor: colors.primary }} /> : iconAction}
      </button>
    </div>
  );
}
