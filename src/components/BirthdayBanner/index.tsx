"use client";

import { Avatar } from "@/components/Avatar";
import { useBirthday } from "@/context/BirthdayContext";
import { useAppTheme } from "@/context/ThemeContext";
import { IMember } from "@/types/Member";
import { Cake } from "lucide-react";
import { useMemo } from "react";
import styles from "./BirthdayBanner.module.css";

// Portado de resgatar_app/src/components/BirthdayBanner. FlatList horizontal
// vira uma div com display:flex + overflow-x:auto.

interface BirthdayMember {
  _id: string;
  firstName: string;
  profileImage?: string;
  day: number;
  isToday: boolean;
}

function getBirthdaysThisMonth(members: IMember[]): BirthdayMember[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  return members
    .filter((m) => m.dateOfBirth && new Date(m.dateOfBirth).getMonth() === currentMonth)
    .map((m) => {
      const day = new Date(m.dateOfBirth).getDate();
      return {
        _id: m._id,
        firstName: m.firstName,
        profileImage: m.profileImage,
        day,
        isToday: day === currentDay,
      };
    })
    .sort((a, b) => {
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
      return a.day - b.day;
    });
}

export function BirthdayBanner() {
  const { colors } = useAppTheme();
  const { members: birthdayMembers } = useBirthday();
  const members = useMemo(() => getBirthdaysThisMonth(birthdayMembers), [birthdayMembers]);

  if (members.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Cake size={14} color={colors.textMuted} />
        <span className={styles.label}>ANIVERSARIANTES DO MÊS</span>
      </div>

      <div className={styles.list}>
        {members.map((item) => (
          <div key={item._id} className={styles.item}>
            <div style={{ position: "relative" }} className={item.isToday ? styles.avatarRing : undefined}>
              <Avatar photo={item.profileImage} size={44} />
              {item.isToday && (
                <div className={styles.todayBadge}>
                  <span className={styles.todayBadgeText}>🎂</span>
                </div>
              )}
            </div>
            <span className={[styles.name, item.isToday && styles.nameToday].filter(Boolean).join(" ")}>
              {item.firstName}
            </span>
            <span className={[styles.day, item.isToday && styles.dayToday].filter(Boolean).join(" ")}>
              {item.isToday ? "hoje!" : `dia ${item.day}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
