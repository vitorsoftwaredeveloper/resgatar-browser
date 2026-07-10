"use client";

import { Avatar } from "@/components/Avatar";
import { CoachTarget } from "@/components/CoachTarget";
import { useBirthday } from "@/context/BirthdayContext";
import { IMember } from "@/types/Member";
import { PartyPopper } from "lucide-react";
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

// dateOfBirth vem como epoch (number) ou, às vezes, como string numérica —
// new Date(string) tenta interpretar como data por extenso e cai em Invalid
// Date. Mesmo parsing "número ou string" já usado em BirthdayContext.
function parseBirthDate(dateOfBirth: string | number): Date | null {
  if (!dateOfBirth) return null;
  const numeric = Number(dateOfBirth);
  const ts = !isNaN(numeric) ? numeric : Date.parse(String(dateOfBirth));
  if (isNaN(ts)) return null;
  return new Date(ts);
}

function getBirthdaysThisMonth(members: IMember[]): BirthdayMember[] {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  return members
    .map((m): BirthdayMember | null => {
      const date = parseBirthDate(m.dateOfBirth);
      if (!date || date.getUTCMonth() !== currentMonth) return null;
      const day = date.getUTCDate();
      return {
        _id: m._id,
        firstName: m.firstName,
        profileImage: m.profileImage,
        day,
        isToday: day === currentDay,
      };
    })
    .filter((m): m is BirthdayMember => m !== null)
    .sort((a, b) => {
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
      return a.day - b.day;
    });
}

export function BirthdayBanner() {
  const { members: birthdayMembers } = useBirthday();
  const members = useMemo(
    () => getBirthdaysThisMonth(birthdayMembers),
    [birthdayMembers],
  );

  return (
    <CoachTarget id="birthdays-card">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.label}>ANIVERSARIANTES DO MÊS</span>
        </div>

        {members.length === 0 ? (
          <div className={styles.emptyState}>
            <PartyPopper size={22} color="var(--color-text-muted)" />
            <p className={styles.emptyText}>Nenhum aniversariante este mês</p>
          </div>
        ) : (
          <div className={styles.list}>
            {members.map((item) => (
              <div key={item._id} className={styles.item}>
                <div
                  style={{ position: "relative" }}
                  className={item.isToday ? styles.avatarRing : undefined}
                >
                  <Avatar photo={item.profileImage} size={44} />
                  {item.isToday && (
                    <div className={styles.todayBadge}>
                      <span className={styles.todayBadgeText}>🎂</span>
                    </div>
                  )}
                </div>
                <span
                  className={[styles.name, item.isToday && styles.nameToday]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.firstName}
                </span>
                <span
                  className={[styles.day, item.isToday && styles.dayToday]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.isToday ? "hoje!" : `dia ${item.day}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </CoachTarget>
  );
}
