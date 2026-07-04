"use client";

import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useDashboardData } from "@/context/DashboardDataContext";
import { useDragReorder } from "@/hooks/useDragReorder";
import { BannerService } from "@/services/BannerService";
import { IBanner } from "@/types/Banner";
import { GripVertical, MoveVertical, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ModalBannerForm } from "../ModalBannerForm";
import styles from "./ModalBannerManager.module.css";

// Portado de resgatar_app/src/components/BannerCarousel/ModalBannerManager.
// ReorderableList vira reorder por Pointer Events (useDragReorder) — o HTML5
// native drag-and-drop não dispara de forma confiável em touch, e a <img> do
// banner é arrastável por padrão no browser, o que atrapalharia o gesto
// nativo. Os banners vêm do DashboardDataContext; refetchBanners()
// resincroniza o carrossel da home após qualquer alteração.

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ModalBannerManager({ visible, onClose }: Props) {
  const { banners, bannersLoading: loading, refetchBanners } = useDashboardData();

  const [items, setItems] = useState<IBanner[]>(banners);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formTarget, setFormTarget] = useState<IBanner | null>(null);

  useEffect(() => {
    if (visible) setEditing(false);
  }, [visible]);

  useEffect(() => {
    if (!editing) setItems(banners);
  }, [banners, editing]);

  const { draggingIndex, setRowRef, dragHandleProps } = useDragReorder<IBanner>(items, {
    onReorder: setItems,
    onDrop: async (next) => {
      setSaving(true);
      try {
        await BannerService.saveOrder(next);
        ToastMessage.success("Ordem salva", "A nova sequência foi publicada.");
        await refetchBanners();
      } catch {
        ToastMessage.error("Erro", "Não foi possível salvar a nova ordem.");
        setItems(banners);
      } finally {
        setSaving(false);
      }
    },
  });

  function openCreate() {
    setFormTarget(null);
    setFormVisible(true);
  }

  function openEdit(banner: IBanner) {
    setFormTarget(banner);
    setFormVisible(true);
  }

  function handleFormSuccess() {
    setFormVisible(false);
    refetchBanners();
  }

  const subtitle = loading ? "Carregando..." : `${items.length} ${items.length === 1 ? "banner" : "banners"}`;

  return (
    <ModalBase visible={visible} title="Campanhas" onClose={onClose}>
      <div className={styles.container}>
        {!loading && items.length > 0 && (
          <div className={styles.intro}>
            <div className={styles.introText}>
              <p className={styles.eyebrow}>Carrossel da home</p>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            <button
              type="button"
              className={[styles.editToggle, editing && styles.editToggleActive].filter(Boolean).join(" ")}
              onClick={() => setEditing((e) => !e)}
              aria-label={editing ? "Concluir edição" : "Editar ordem dos banners"}
            >
              <Pencil size={15} color={editing ? "var(--color-white)" : "var(--color-text)"} />
              <span className={[styles.editToggleText, editing && styles.editToggleTextActive].filter(Boolean).join(" ")}>
                {editing ? "Concluir" : "Editar"}
              </span>
            </button>
          </div>
        )}

        {editing && (
          <div className={styles.hint}>
            <MoveVertical size={14} color="var(--color-text-muted)" />
            <p className={styles.hintText}>Toque em um banner para editar · arraste pela alça para reordenar.</p>
          </div>
        )}

        {saving && (
          <div className={styles.savingBanner}>
            <span className={styles.spinner} />
            <p className={styles.savingText}>Salvando ordem…</p>
          </div>
        )}

        {loading ? (
          <div className={styles.centered}>
            <span className={styles.spinner} />
          </div>
        ) : items.length === 0 ? (
          <div className={styles.centered}>
            <p className={styles.emptyTitle}>Nenhum banner</p>
            <p className={styles.emptyText}>Toque em + para publicar o primeiro banner no carrossel da tela inicial.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={setRowRef(index)}
                className={[styles.row, editing && styles.rowEditable].filter(Boolean).join(" ")}
                onClick={editing ? () => openEdit(item) : undefined}
              >
                <div className={styles.rail}>
                  <div className={styles.threadDashed} />
                  <div className={styles.nodeEdit}>
                    <span className={styles.nodeNumber}>{index + 1}</span>
                  </div>
                </div>

                <div
                  className={[styles.card, draggingIndex === index && styles.cardDragging].filter(Boolean).join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.banner} alt={item.title} className={styles.thumb} draggable={false} />

                  <div className={styles.cardBody}>
                    <p className={styles.cardTitle}>{item.title}</p>
                    <p className={styles.cardMeta}>
                      {item.action.type === "none"
                        ? "Sem ação ao tocar"
                        : item.action.type === "external"
                          ? "Abre URL externa"
                          : `Navega para ${item.action.value}`}
                    </p>
                  </div>

                  {editing && (
                    <div
                      className={styles.grip}
                      aria-label={`Arrastar ${item.title} para reordenar`}
                      {...dragHandleProps(index)}
                    >
                      <GripVertical size={20} color="var(--color-text-muted)" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!editing && (
          <button type="button" className={styles.fab} onClick={openCreate} aria-label="Adicionar banner">
            <Plus size={28} color="var(--color-white)" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {formVisible && (
        <ModalBannerForm
          key={formTarget?.id ?? "new"}
          visible={formVisible}
          banner={formTarget}
          onClose={() => setFormVisible(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </ModalBase>
  );
}
