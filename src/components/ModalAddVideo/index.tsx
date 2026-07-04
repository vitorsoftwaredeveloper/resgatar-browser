"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { VideoService } from "@/services/VideoService";
import { getApiErrorMessage } from "@/utils/apiError";
import { useEffect, useRef, useState } from "react";
import styles from "./ModalAddVideo.module.css";

// Portado de resgatar_app/src/screens/VideosScreen/ModalAddVideo.

interface IModalAddVideo {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface IVideoInfo {
  title: string;
  author: string;
  thumbnailUrl: string;
}

function extractVideoId(url: string): string | null {
  const watch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/);
  if (watch) return watch[1];
  const short = url.match(/youtu\.be\/([\w-]{11})/);
  if (short) return short[1];
  const shorts = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (shorts) return shorts[1];
  return null;
}

export function ModalAddVideo({ visible, onClose, onSuccess }: IModalAddVideo) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | false>(false);
  const [videoInfo, setVideoInfo] = useState<IVideoInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoId = extractVideoId(url.trim());

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!videoId) {
      setVideoInfo(null);
      setInfoLoading(false);
      return;
    }

    setInfoLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
        const res = await fetch(`https://www.youtube.com/oembed?url=${encoded}&format=json`);
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setVideoInfo({
          title: data.title,
          author: data.author_name,
          thumbnailUrl: data.thumbnail_url,
        });
      } catch {
        setVideoInfo(null);
      } finally {
        setInfoLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [videoId]);

  const handleClose = () => {
    setUrl("");
    setUrlError(false);
    onClose();
  };

  const handleSave = async () => {
    const trimmed = url.trim();

    if (!trimmed) {
      setUrlError("Informe a URL do vídeo");
      return;
    }

    if (!videoId) {
      setUrlError("URL do YouTube inválida");
      return;
    }

    setUrlError(false);

    try {
      await VideoService.createVideo(trimmed, videoInfo?.title);
      ToastMessage.success("Vídeo cadastrado!", "Seu vídeo foi publicado.");
      setUrl("");
      setTimeout(onSuccess, 1000);
    } catch (error) {
      const message = getApiErrorMessage(error, "Falha ao cadastrar vídeo.");
      ToastMessage.error("Erro", message);
    }
  };

  return (
    <ModalBase visible={visible} onClose={handleClose} title="Cadastrar vídeo">
      <div className={styles.container}>
        <div className={styles.scroll}>
          <Card title="URL do YouTube" description="Cole o link de um vídeo público do YouTube para publicá-lo.">
            <Input
              label="Link do vídeo"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChangeText={(v) => {
                setUrl(v);
                if (urlError) setUrlError(false);
              }}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              error={urlError}
            />

            {(infoLoading || videoInfo) && (
              <>
                <p className={styles.previewLabel}>Pré-visualização</p>

                {infoLoading ? (
                  <div className={styles.previewLoading}>
                    <span className={styles.spinner} />
                  </div>
                ) : videoInfo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className={styles.previewCard}>
                    <img src={videoInfo.thumbnailUrl} alt={videoInfo.title} className={styles.thumbnail} />
                    <div className={styles.previewInfo}>
                      <p className={styles.videoTitle}>{videoInfo.title}</p>
                      <p className={styles.videoAuthor}>{videoInfo.author}</p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Card>
        </div>

        <div className={styles.footer}>
          <Button title="Salvar" onPress={handleSave} disabled={!url.trim()} />
        </div>
      </div>
    </ModalBase>
  );
}
