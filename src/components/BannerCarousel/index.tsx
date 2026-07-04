"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { BANNER_SCREEN_PATHS, BannerScreen, IBanner } from "@/types/Banner";
import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModalBannerManager } from "./ModalBannerManager";
import styles from "./BannerCarousel.module.css";

// Portado de resgatar_app/src/components/BannerCarousel. ScrollView paginado
// vira scroll-snap CSS; auto-scroll via scrollTo({behavior:"smooth"}). A
// gestão de admin (ModalBannerManager) abre o gerenciador de campanhas. Os
// banners vêm do DashboardDataContext (buscados uma única vez por sessão),
// não de um fetch próprio — evita refazer a requisição toda vez que a
// Dashboard remonta ao voltar de outra aba.

const AUTO_SCROLL_INTERVAL = 4500;

function useBannerTap(banner: IBanner) {
  const router = useRouter();

  return useCallback(() => {
    if (banner.action.type === "external" && banner.action.value) {
      window.open(banner.action.value, "_blank", "noopener,noreferrer");
    } else if (banner.action.type === "internal" && banner.action.value) {
      const path = BANNER_SCREEN_PATHS[banner.action.value as BannerScreen];
      if (path) router.push(path);
    }
  }, [banner, router]);
}

function BannerSlide({ banner }: { banner: IBanner }) {
  const handleTap = useBannerTap(banner);
  const tappable = banner.action.type !== "none";

  return (
    <button type="button" className={styles.slide} onClick={tappable ? handleTap : undefined} disabled={!tappable}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.banner} alt={banner.title} className={styles.image} />
    </button>
  );
}

export function BannerCarousel() {
  const { member } = useAuth();
  const isAdmin = member?.role === "admin";
  const { banners, bannersLoading: loading } = useDashboardData();
  const [activeIndex, setActiveIndex] = useState(0);
  const [managerVisible, setManagerVisible] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      const next = (currentIndex.current + 1) % banners.length;
      const node = trackRef.current;
      if (node) node.scrollTo({ left: next * node.clientWidth, behavior: "smooth" });
      currentIndex.current = next;
      setActiveIndex(next);
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  const handleScroll = useCallback(() => {
    const node = trackRef.current;
    if (!node) return;
    const idx = Math.round(node.scrollLeft / node.clientWidth);
    if (idx !== currentIndex.current) {
      currentIndex.current = idx;
      setActiveIndex(idx);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (banners.length === 0) {
    if (!isAdmin) return null;
    return (
      <div className={styles.wrapper}>
        <button
          type="button"
          className={styles.empty}
          onClick={() => setManagerVisible(true)}
          aria-label="Cadastrar primeiro banner"
        >
          <Settings2 size={20} color="var(--color-text-muted)" />
          <span className={styles.emptyText}>Adicionar banner de campanha</span>
        </button>

        <ModalBannerManager visible={managerVisible} onClose={() => setManagerVisible(false)} />
      </div>
    );
  }

  return (
    <CoachTarget id="banner-carousel" className={styles.wrapper}>
      <div className={styles.scroll}>
        <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
          {banners.map((banner) => (
            <BannerSlide key={banner.id} banner={banner} />
          ))}
        </div>

        {isAdmin && (
          <button
            type="button"
            className={styles.manageButton}
            onClick={() => setManagerVisible(true)}
            aria-label="Gerenciar banners"
          >
            <Settings2 size={12} color="#FFFFFF" />
            <span className={styles.manageButtonText}>Gerenciar</span>
          </button>
        )}
      </div>

      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <div key={i} className={[styles.dot, i === activeIndex && styles.dotActive].filter(Boolean).join(" ")} />
          ))}
        </div>
      )}

      <ModalBannerManager visible={managerVisible} onClose={() => setManagerVisible(false)} />
    </CoachTarget>
  );
}
