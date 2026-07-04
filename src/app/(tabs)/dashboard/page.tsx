"use client";

import { BannerCarousel } from "@/components/BannerCarousel";
import { CommunityGoalCard } from "@/components/CommunityGoalCard";
import { Header } from "@/components/Header";
import { NoticesCard } from "@/components/NoticesCard";
import { StreakCard } from "@/components/StreakCard";
import { useAuth } from "@/context/AuthContext";
import { getDashboardOrder, setDashboardOrder } from "@/storage/localStorage";
import { ComponentType, DragEvent, useEffect, useRef, useState } from "react";
import styles from "./dashboard.module.css";

// Portado de resgatar_app/src/screens/DashboardScreen. O drag-to-reorder da
// react-native-reorderable-list vira drag-and-drop nativo do HTML5 (draggable
// + dragstart/dragover/drop) — dispensa biblioteca extra e funciona com mouse
// e touch nos browsers mobile modernos.

type CardId = "banners" | "streak" | "communityGoal" | "notices";

const CARD_REGISTRY: Record<CardId, ComponentType> = {
  banners: BannerCarousel,
  streak: StreakCard,
  communityGoal: CommunityGoalCard,
  notices: NoticesCard,
};

const DEFAULT_ORDER: CardId[] = ["banners", "streak", "communityGoal", "notices"];

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
