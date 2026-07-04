"use client";

import { Avatar } from "@/components/Avatar";
import { Dialog } from "@/components/Dialog";
import { ToastMessage } from "@/components/Toast";
import { VideoService } from "@/services/VideoService";
import { IVideoFeedItem } from "@/types/Video";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./ModalVideoFeed.module.css";

// Portado de resgatar_app/src/screens/VideosScreen/ModalVideoFeed. O feed
// vertical com swipe (FlatList paginado + react-native-youtube-iframe) vira um
// player em tela cheia com navegação anterior/próximo — o iframe do YouTube
// já cuida da reprodução no browser, sem lib nativa equivalente.

interface IModalVideoFeed {
  visible: boolean;
  videos: IVideoFeedItem[];
  startIndex?: number;
  currentMemberId?: string;
  onClose: () => void;
  onVideoRemoved?: (videoId: string) => void;
}

export function ModalVideoFeed({
  visible,
  videos,
  startIndex = 0,
  currentMemberId,
  onClose,
  onVideoRemoved,
}: IModalVideoFeed) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [deleteDialogVideoId, setDeleteDialogVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(startIndex);
  }, [visible, startIndex]);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(i + 1, videos.length - 1));
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose, videos.length]);

  if (!visible) return null;

  const item = videos[currentIndex];

  const confirmDelete = async () => {
    if (!deleteDialogVideoId) return;
    const videoId = deleteDialogVideoId;
    setDeleteDialogVideoId(null);
    try {
      await VideoService.removeVideo(videoId);
      onVideoRemoved?.(videoId);
      if (videos.length <= 1) {
        onClose();
      } else {
        setCurrentIndex((idx) => Math.max(0, Math.min(idx, videos.length - 2)));
      }
    } catch {
      ToastMessage.error("Erro", "Não foi possível remover o vídeo.");
    }
  };

  const isOwner = item && currentMemberId === item.memberId;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button type="button" onClick={onClose} className={styles.backButton} aria-label="Fechar">
          <X color="#fff" size={20} />
        </button>
        <p className={styles.topTitle}>Feed de Vídeos</p>
      </div>

      {videos.length === 0 || !item ? (
        <div className={styles.centered}>
          <p className={styles.emptyText}>Nenhum vídeo encontrado.</p>
        </div>
      ) : (
        <>
          <div className={styles.playerWrapper}>
            <iframe
              key={item._id}
              className={styles.player}
              src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={item.title || "Vídeo"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {currentIndex > 0 && (
            <button
              type="button"
              className={[styles.navArrow, styles.navArrowLeft].join(" ")}
              onClick={() => setCurrentIndex((i) => i - 1)}
              aria-label="Vídeo anterior"
            >
              <ChevronLeft color="#fff" size={24} />
            </button>
          )}

          {currentIndex < videos.length - 1 && (
            <button
              type="button"
              className={[styles.navArrow, styles.navArrowRight].join(" ")}
              onClick={() => setCurrentIndex((i) => i + 1)}
              aria-label="Próximo vídeo"
            >
              <ChevronRight color="#fff" size={24} />
            </button>
          )}

          <div className={styles.videoOverlay}>
            <Avatar photo={item.profileImage} size={40} />
            <div className={styles.overlayInfo}>
              <p className={styles.memberName}>
                {item.firstName} {item.lastName}
              </p>
              <p className={styles.pageIndicator}>
                {currentIndex + 1} de {videos.length}
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setDeleteDialogVideoId(item._id)}
                aria-label="Remover vídeo"
              >
                <Trash2 color="#fff" size={20} />
              </button>
            )}
          </div>
        </>
      )}

      <Dialog
        visible={!!deleteDialogVideoId}
        title="Remover vídeo"
        description="Tem certeza que deseja remover este vídeo?"
        onClose={() => setDeleteDialogVideoId(null)}
        actions={[
          { label: "Cancelar", onPress: () => setDeleteDialogVideoId(null), variant: "secondary" },
          { label: "Remover", onPress: confirmDelete, variant: "primary" },
        ]}
      />
    </div>
  );
}
