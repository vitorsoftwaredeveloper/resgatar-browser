"use client";

import { CoachTarget } from "@/components/CoachTarget";
import { BannerService } from "@/services/BannerService";
import { BannerScreen, IBanner } from "@/types/Banner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BannerCarousel.module.css";

// Portado de resgatar_app/src/components/BannerCarousel. ScrollView paginado
// vira scroll-snap CSS; auto-scroll via scrollTo({behavior:"smooth"}). A
// gestão de admin (ModalBannerManager) ainda não foi portada — só a exibição
// para membros comuns (mesmo tratamento dado ao NoticesCard).

const AUTO_SCROLL_INTERVAL = 4500;

function useBannerTap(banner: IBanner) {
  const router = useRouter();

  return useCallback(() => {
    if (banner.action.type === "external" && banner.action.value) {
      window.open(banner.action.value, "_blank", "noopener,noreferrer");
    } else if (banner.action.type === "internal" && banner.action.value) {
      router.push(banner.action.value as BannerScreen);
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
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndex = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await BannerService.list();
      setBanners(data);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  // Estado vazio: sem gestão de admin portada ainda, então não exibimos CTA
  // de "adicionar banner" mesmo para admin (defer até ModalBannerManager).
  if (banners.length === 0) {
    return null;
  }

  return (
    <CoachTarget id="banner-carousel" className={styles.wrapper}>
      <div className={styles.scroll}>
        <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
          {banners.map((banner) => (
            <BannerSlide key={banner.id} banner={banner} />
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <div className={styles.dots}>
          {banners.map((_, i) => (
            <div key={i} className={[styles.dot, i === activeIndex && styles.dotActive].filter(Boolean).join(" ")} />
          ))}
        </div>
      )}
    </CoachTarget>
  );
}
