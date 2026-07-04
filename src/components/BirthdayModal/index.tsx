"use client";

import { Avatar } from "@/components/Avatar";
import { useAppTheme } from "@/context/ThemeContext";
import { MemberServices } from "@/services/MemberService";
import { IMember } from "@/types/Member";
import { Cake } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./BirthdayModal.module.css";

// Portado de resgatar_app/src/components/BirthdayModal. Bottom sheet no mesmo
// padrão do ModalBase (overlay + slide-up), fecha ao clicar fora.

interface BirthdayMember {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  day: number;
  month: number;
  isToday: boolean;
}

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function parseBirthDate(dateOfBirth: string | number): { day: number; month: number } | null {
  if (!dateOfBirth) return null;
  const numeric = Number(dateOfBirth);
  const ts = !isNaN(numeric) ? numeric : Date.parse(dateOfBirth as string);
  if (isNaN(ts)) return null;
  const d = new Date(ts);
  return { day: d.getUTCDate(), month: d.getUTCMonth() };
}

function getBirthdaysThisMonth(members: IMember[]): BirthdayMember[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  return members
    .filter((m) => {
      const parsed = parseBirthDate(m.dateOfBirth);
      return parsed !== null && parsed.month === currentMonth;
    })
    .map((m) => {
      const { day, month } = parseBirthDate(m.dateOfBirth)!;
      return {
        _id: m._id,
        firstName: m.firstName,
        lastName: m.lastName,
        profileImage: m.profileImage,
        day,
        month,
        isToday: day === currentDay && month === currentMonth,
      };
    })
    .sort((a, b) => {
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
      return a.day - b.day;
    });
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BirthdayModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    MemberServices.listBirthdayMembers()
      .then((data: IMember[]) => setMembers(getBirthdaysThisMonth(data)))
      .catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <Cake size={16} color={colors.textMuted} />
          <span className={styles.title}>Aniversariantes do mês</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className={styles.scroll}>
          {members.length === 0 && <p className={styles.emptyText}>Nenhum aniversariante neste mês</p>}
          {members.map((item) => (
            <div key={item._id} className={[styles.listItem, item.isToday && styles.listItemToday].filter(Boolean).join(" ")}>
              <div style={{ position: "relative" }} className={item.isToday ? styles.avatarRing : undefined}>
                <Avatar photo={item.profileImage} size={48} />
                {item.isToday && (
                  <div className={styles.todayBadge}>
                    <span className={styles.todayBadgeText}>🎂</span>
                  </div>
                )}
              </div>

              <div className={styles.listItemInfo}>
                <p className={[styles.listItemName, item.isToday && styles.listItemNameToday].filter(Boolean).join(" ")}>
                  {item.firstName} {item.lastName}
                </p>
                <p className={[styles.listItemDate, item.isToday && styles.listItemDateToday].filter(Boolean).join(" ")}>
                  {item.isToday ? "🎉 Hoje!" : `${item.day} de ${MONTHS_PT[item.month]}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
