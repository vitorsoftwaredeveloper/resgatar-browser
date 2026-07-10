"use client";

import { Avatar } from "@/components/Avatar";
import { CoachTarget } from "@/components/CoachTarget";
import { ModalVideoFeed } from "@/components/ModalVideoFeed";
import { VideoCardSkeleton } from "@/components/Skeleton/VideoCardSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { ChevronRight, Clapperboard, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./RecentVideosCard.module.css";

// Prévia dos últimos vídeos publicados pela comunidade — reaproveita
// ModalVideoFeed (mesmo player usado em /videos) pra tocar direto a partir do
// card, sem sair da Dashboard. Os dados vêm do DashboardDataContext (buscados
// uma única vez por sessão), igual aos demais cards.

export function RecentVideosCard() {
  const router = useRouter();
  const { member } = useAuth();
  const { videos, videosLoading: loading, refetchVideos } = useDashboardData();
  const [playerStartIndex, setPlayerStartIndex] = useState<number | null>(null);

  return (
    <CoachTarget id="recent-videos-card">
      <div className={styles.container}>
        <button
          type="button"
          className={styles.header}
          onClick={() => router.push("/videos")}
          aria-label="Ver todos os vídeos"
        >
          <span className={styles.headerTitle}>Vídeos recentes</span>
          <ChevronRight size={16} color="var(--color-text-muted)" />
        </button>

        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.item}>
                <VideoCardSkeleton />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className={styles.emptyState}>
            <Clapperboard size={22} color="var(--color-text-muted)" />
            <p className={styles.emptyText}>Nenhum vídeo publicado ainda</p>
          </div>
        ) : (
          <div className={styles.list}>
            {videos.map((item, index) => (
              <button
                key={item._id}
                type="button"
                className={styles.item}
                onClick={() => setPlayerStartIndex(index)}
              >
                <div className={styles.thumbWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnail} alt={item.title || ""} className={styles.thumb} />
                  <div className={styles.playIcon}>
                    <Play size={16} color="#fff" fill="#fff" />
                  </div>
                </div>
                <div className={styles.itemInfo}>
                  <Avatar photo={item.profileImage} size={22} />
                  <div className={styles.itemTexts}>
                    {item.title && <p className={styles.itemTitle}>{item.title}</p>}
                    <p className={styles.itemAuthor}>{item.firstName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {playerStartIndex !== null && (
        <ModalVideoFeed
          visible={playerStartIndex !== null}
          videos={videos}
          startIndex={playerStartIndex}
          currentMemberId={member?._id}
          onClose={() => setPlayerStartIndex(null)}
          onVideoRemoved={() => refetchVideos()}
        />
      )}
    </CoachTarget>
  );
}
