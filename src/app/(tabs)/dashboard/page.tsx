"use client";

import { BannerCarousel } from "@/components/BannerCarousel";
import { BirthdayBanner } from "@/components/BirthdayBanner";
import { CommunityGoalCard } from "@/components/CommunityGoalCard";
import { GuestHomeCard } from "@/components/GuestHomeCard";
import { Header } from "@/components/Header";
import { NoticesCard } from "@/components/NoticesCard";
import { RecentDonationsCard } from "@/components/RecentDonationsCard";
import { RecentVideosCard } from "@/components/RecentVideosCard";
import { StreakCard } from "@/components/StreakCard";
import { useAuth } from "@/context/AuthContext";
import { useDashboardVisibility } from "@/context/DashboardVisibilityContext";
import { IDashboardVisibilitySettings } from "@/types/DashboardVisibility";
import { usePermissions } from "@/hooks/usePermissions";
import { ComponentType, useMemo } from "react";
import styles from "./dashboard.module.css";

type CardId =
  | "banners"
  | "birthdays"
  | "streak"
  | "communityGoal"
  | "notices"
  | "recentVideos"
  | "recentDonations"
  | "guestHome";

const CARD_REGISTRY: Record<CardId, ComponentType> = {
  banners: BannerCarousel,
  birthdays: BirthdayBanner,
  streak: StreakCard,
  communityGoal: CommunityGoalCard,
  notices: NoticesCard,
  recentVideos: RecentVideosCard,
  recentDonations: RecentDonationsCard,
  guestHome: GuestHomeCard,
};

const INTERNAL_ONLY_CARDS: CardId[] = ["recentDonations"];

const GUEST_CONFIGURABLE_CARDS: Partial<Record<CardId, keyof IDashboardVisibilitySettings>> = {
  banners: "banners",
  notices: "notices",
  communityGoal: "communityGoal",
  birthdays: "birthdays",
  recentVideos: "videos",
};

const FULL_WIDTH_CARDS: CardId[] = ["banners"];

const CARD_ORDER: CardId[] = [
  "guestHome",
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
  const { isInternal } = usePermissions();
  const { settings: guestVisibility } = useDashboardVisibility();

  const visibleCards = useMemo(
    () =>
      CARD_ORDER.filter((id) => {
        if (id === "guestHome") return !isInternal;
        if (INTERNAL_ONLY_CARDS.includes(id)) return isInternal;
        const settingKey = GUEST_CONFIGURABLE_CARDS[id];
        if (settingKey) return isInternal || guestVisibility?.[settingKey] === true;
        return true;
      }),
    [isInternal, guestVisibility],
  );

  const fullWidthCards = visibleCards.filter((id) => FULL_WIDTH_CARDS.includes(id));
  const columnCards = visibleCards.filter((id) => !FULL_WIDTH_CARDS.includes(id));

  function renderCard(id: CardId) {
    const Component = CARD_REGISTRY[id];
    return (
      <div key={id} data-card={id} className={styles.cardWrapper}>
        <Component />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        crumbs={[{ label: "Início" }]}
      />

      <div className={styles.content}>
        {fullWidthCards.map(renderCard)}

        <div className={styles.columns}>{columnCards.map(renderCard)}</div>
      </div>
    </div>
  );
}
