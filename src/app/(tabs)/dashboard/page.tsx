"use client";

import { BannerCarousel } from "@/components/BannerCarousel";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { CommunityGoalCard } from "@/components/CommunityGoalCard";
import { Header } from "@/components/Header";
import { NoticesCard } from "@/components/NoticesCard";
import { RecentDonationsCard } from "@/components/RecentDonationsCard";
import { RecentVideosCard } from "@/components/RecentVideosCard";
import { StreakCard } from "@/components/StreakCard";
import { useAuth } from "@/context/AuthContext";
import { getDashboardOrder, setDashboardOrder } from "@/storage/localStorage";
import { ComponentType, DragEvent, useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";

// Portado de resgatar_app/src/screens/DashboardScreen. O drag-to-reorder da
// react-native-reorderable-list vira drag-and-drop nativo do HTML5 (draggable
// + dragstart/dragover/drop) — dispensa biblioteca extra e funciona com mouse
// e touch nos browsers mobile modernos.

type CardId = "banners" | "birthdays" | "streak" | "communityGoal" | "notices" | "recentVideos" | "recentDonations";

const CARD_REGISTRY: Record<CardId, ComponentType> = {
  banners: BannerCarousel,
  birthdays: BirthdayBanner,
  streak: StreakCard,
  communityGoal: CommunityGoalCard,
  notices: NoticesCard,
  recentVideos: RecentVideosCard,
  recentDonations: RecentDonationsCard,
};

// Os dois cards de largura cheia (banners, notices) ficam adjacentes no topo
// — assim o grid desktop (2 colunas) não precisa contar só com
// grid-auto-flow: dense pra evitar buraco quando um card de coluna única é
// seguido por um de span completo.
const DEFAULT_ORDER: CardId[] = [
  "banners",
  "notices",
  "birthdays",
  "streak",
  "communityGoal",
  "recentVideos",
  "recentDonations",
];

export default function DashboardPage() {
  const { member } = useAuth();
  const [order, setOrder] = useState<CardId[]>(DEFAULT_ORDER);
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!member?._id) return;
    getDashboardOrder(member._id).then((saved) => {
      if (!saved) return;
      const merged = [
        ...saved.filter((id): id is CardId => DEFAULT_ORDER.includes(id as CardId)),
        ...DEFAULT_ORDER.filter((id) => !saved.includes(id)),
      ];
      setOrder(merged);
    });
  }, [member?._id]);

  function reorder(from: number, to: number) {
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      if (member?._id) setDashboardOrder(member._id, next);
      return next;
    });
  }

  function handleDragStart(index: number) {
    return (e: DragEvent<HTMLDivElement>) => {
      dragIndex.current = index;
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = "move";
    };
  }

  function handleDragOver(index: number) {
    return (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (dragIndex.current === null || dragIndex.current === index) return;
      reorder(dragIndex.current, index);
      dragIndex.current = index;
    };
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDraggingIndex(null);
  }

  return (
    <div className={styles.container}>
      <Header name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`} photo={member?.profileImage} />

      <div className={styles.content}>
        {order.map((id, index) => {
          const Component = CARD_REGISTRY[id];
          return (
            <div
              key={id}
              data-card={id}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragEnd={handleDragEnd}
              className={[styles.cardWrapper, draggingIndex === index && styles.cardWrapperDragging]
                .filter(Boolean)
                .join(" ")}
            >
              <Component />
            </div>
          );
        })}
      </div>
    </div>
  );
}
