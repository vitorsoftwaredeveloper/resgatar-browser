"use client";

import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { ModalAddVideo } from "@/components/ModalAddVideo";
import { ModalVideoFeed } from "@/components/ModalVideoFeed";
import { VideoCardSkeleton } from "@/components/Skeleton/VideoCardSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { VideoService } from "@/services/VideoService";
import { IVideoFeedItem } from "@/types/Video";
import { ChevronLeft, ChevronRight, Clapperboard, Play, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./videos.module.css";

// Portado de resgatar_app/src/screens/VideosScreen.

const PAGE_SIZE = 10;

type MemberOption = {
  memberId: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
};

export default function VideosPage() {
  const { member } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [items, setItems] = useState<IVideoFeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [addVideoVisible, setAddVideoVisible] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState<number | null>(null);

  const memberScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateMemberArrows = useCallback(() => {
    const node = memberScrollRef.current;
    if (!node) return;
    setCanScrollLeft(node.scrollLeft > 4);
    setCanScrollRight(node.scrollWidth - node.clientWidth - node.scrollLeft > 4);
  }, []);

  const scrollMembersBy = useCallback((delta: number) => {
    memberScrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const load = useCallback(
    async (pageToLoad: number) => {
      if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const data = await VideoService.listAllVideos(pageToLoad, PAGE_SIZE, {
          title: committedSearch || undefined,
          memberId: selectedMemberId || undefined,
        });
        setItems((prev) => (pageToLoad === 1 ? data.items : [...prev, ...data.items]));
        setPage(data.page);
        setTotalPages(Math.max(1, data.totalPages));

        // Deriva os chips de filtro por membro do próprio feed já buscado —
        // evita uma segunda requisição (era listAllVideos(1, 50) à parte).
        // Só acumula quando a busca está sem filtro, senão o resultado
        // filtrado faria a lista de chips encolher para um único membro.
        if (!committedSearch && !selectedMemberId) {
          setMemberOptions((prev) => {
            const seen = new Set(prev.map((m) => m.memberId));
            const next = [...prev];
            data.items.forEach((v) => {
              if (!seen.has(v.memberId)) {
                seen.add(v.memberId);
                next.push({
                  memberId: v.memberId,
                  firstName: v.firstName,
                  lastName: v.lastName,
                  profileImage: v.profileImage,
                });
              }
            });
            return next;
          });
        }
      } catch {
        if (pageToLoad === 1) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [committedSearch, selectedMemberId],
  );

  const handleSearch = useCallback(() => {
    setCommittedSearch(search.trim());
  }, [search]);

  // Um único efeito cobre o mount (committedSearch/selectedMemberId partem do
  // valor inicial) e qualquer mudança de filtro depois. O padrão anterior
  // (3 efeitos + refs "isFirstRender" pra pular a primeira execução) não
  // sobrevive ao Strict Mode do React 18 (dev): ele invoca cada efeito duas
  // vezes, e a segunda invocação já via a ref virada pra false — cada efeito
  // "guardado" acabava disparando um load(1) extra, resultando em 4 chamadas.
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedSearch, selectedMemberId]);

  const handleVideoRemoved = useCallback((videoId: string) => {
    setItems((prev) => prev.filter((v) => v._id !== videoId));
  }, []);

  const isFiltering = Boolean(committedSearch || selectedMemberId);

  return (
    <div className={`app-shell ${styles.container}`}>
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />

      <div className={styles.content}>
        <div className={styles.searchBar}>
          <Input
            placeholder="Buscar vídeos..."
            value={search}
            onChangeText={setSearch}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            rightIcon={
              <button type="button" onClick={handleSearch} className={styles.searchButton} aria-label="Buscar">
                <Search size={14} color={colors.white} strokeWidth={2.5} />
              </button>
            }
            autoCorrect="off"
            autoCapitalize="none"
          />
        </div>

        {memberOptions.length >= 1 && (
          <div className={styles.memberFilterWrapper}>
            <div ref={memberScrollRef} className={styles.memberFilterRow} onScroll={updateMemberArrows}>
              {memberOptions.map((m) => {
                const active = selectedMemberId === m.memberId;
                return (
                  <button
                    key={m.memberId}
                    type="button"
                    className={styles.memberItem}
                    onClick={() => setSelectedMemberId(active ? null : m.memberId)}
                  >
                    <span className={[styles.memberName, active && styles.memberNameActive].filter(Boolean).join(" ")}>
                      {m.firstName}
                    </span>
                    <div className={[styles.memberRing, active && styles.memberRingActive].filter(Boolean).join(" ")}>
                      <div className={styles.memberRingInner}>
                        <Avatar photo={m.profileImage} size={48} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {canScrollLeft && (
              <button
                type="button"
                className={[styles.memberArrow, styles.memberArrowLeft].join(" ")}
                onClick={() => scrollMembersBy(-160)}
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft size={20} color={colors.text} />
              </button>
            )}

            {canScrollRight && (
              <button
                type="button"
                className={[styles.memberArrow, styles.memberArrowRight].join(" ")}
                onClick={() => scrollMembersBy(160)}
                aria-label="Rolar para a direita"
              >
                <ChevronRight size={20} color={colors.text} />
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>
          {loading ? (
            <div className={styles.list}>
              {Array.from({ length: 4 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.centered}>
              <div className={styles.emptyIconWrap}>
                {isFiltering ? <Search size={26} color={colors.primary} /> : <Clapperboard size={26} color={colors.primary} />}
              </div>
              <p className={styles.emptyTitle}>{isFiltering ? "Nenhum vídeo encontrado" : "Nenhum vídeo por aqui ainda"}</p>
              <p className={styles.emptyText}>
                {isFiltering
                  ? "Tente outro termo de busca ou remova o filtro por membro."
                  : "Toque no + para publicar o primeiro vídeo da comunidade."}
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCommittedSearch("");
                    setSelectedMemberId(null);
                  }}
                  className={styles.clearFiltersButton}
                >
                  <span className={styles.clearFiltersText}>Limpar busca</span>
                </button>
              )}
            </div>
          ) : (
            <div className={styles.list}>
              {items.map((item, index) => (
                <button key={item._id} type="button" className={styles.videoCard} onClick={() => setPlayerStartIndex(index)}>
                  <div className={styles.thumbWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.thumbnail} alt={item.title || ""} className={styles.thumb} />
                    <div className={styles.playIcon}>
                      <Play size={22} color="#fff" fill="#fff" />
                    </div>
                  </div>
                  <div className={styles.videoCardInfo}>
                    <Avatar photo={item.profileImage} size={36} />
                    <div className={styles.videoCardText}>
                      {item.title ? <p className={styles.videoTitle}>{item.title}</p> : null}
                      <p className={styles.videoAuthor}>
                        {item.firstName} {item.lastName}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {page < totalPages && (
                <button
                  type="button"
                  className={styles.clearFiltersButton}
                  disabled={loadingMore}
                  onClick={() => load(page + 1)}
                  style={{ alignSelf: "center" }}
                >
                  <span className={styles.clearFiltersText}>{loadingMore ? "Carregando..." : "Carregar mais"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <button type="button" className={styles.fab} onClick={() => setAddVideoVisible(true)} aria-label="Cadastrar vídeo">
          <Plus size={28} color={colors.white} strokeWidth={2.5} />
        </button>
      </div>

      {addVideoVisible && (
        <ModalAddVideo
          visible={addVideoVisible}
          onClose={() => setAddVideoVisible(false)}
          onSuccess={() => {
            setAddVideoVisible(false);
            load(1);
          }}
        />
      )}

      {playerStartIndex !== null && (
        <ModalVideoFeed
          visible={playerStartIndex !== null}
          videos={items}
          startIndex={playerStartIndex}
          currentMemberId={member?._id}
          onClose={() => setPlayerStartIndex(null)}
          onVideoRemoved={handleVideoRemoved}
        />
      )}
    </div>
  );
}
