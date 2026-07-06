"use client";

import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/context/DashboardDataContext";
import { useDragReorder } from "@/hooks/useDragReorder";
import { CommitmentService } from "@/services/CommitmentService";
import { ICommitment } from "@/types/Commitment";
import { commitmentScheduleLabel, isCommitmentToday } from "@/utils/commitment";
import { GripVertical, MoveVertical, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ModalCommitmentForm } from "./ModalCommitmentForm";
import styles from "./NoticeBoardModal.module.css";

// Portado de resgatar_app/src/screens/NoticeBoardScreen. ReorderableList (drag
// via onLongPress) vira reorder por Pointer Events (useDragReorder) — o HTML5
// native drag-and-drop não dispara de forma confiável em touch. Os itens vêm
// do DashboardDataContext (fonte única de verdade); o reorder trabalha numa
// cópia local enquanto o admin arrasta, e refetchCommitments() resincroniza
// tudo (inclusive o NoticesCard) após salvar.

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NoticeBoardModal({ visible, onClose }: Props) {
  const { member } = useAuth();
  const isAdmin = member?.role === "admin";
  const { commitments, commitmentsLoading: loading, refetchCommitments } = useDashboardData();

  const [items, setItems] = useState<ICommitment[]>(commitments);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formTarget, setFormTarget] = useState<ICommitment | null>(null);

  useEffect(() => {
    if (visible) setEditing(false);
  }, [visible]);

  useEffect(() => {
    if (!editing) setItems(commitments);
  }, [commitments, editing]);

  const { draggingIndex, setRowRef, dragHandleProps } = useDragReorder<ICommitment>(items, {
    onReorder: setItems,
    onDrop: async (next) => {
      setSaving(true);
      try {
        await CommitmentService.saveOrder(next);
        ToastMessage.success("Ordem salva", "A nova sequência foi publicada.");
        await refetchCommitments();
      } catch {
        ToastMessage.error("Erro", "Não foi possível salvar a nova ordem.");
        setItems(commitments);
      } finally {
        setSaving(false);
      }
    },
  });

  function openEdit(item: ICommitment) {
    setFormTarget(item);
    setFormVisible(true);
  }

  function openCreate() {
    setFormTarget(null);
    setFormVisible(true);
  }

  function handleFormSuccess() {
    setFormVisible(false);
    refetchCommitments();
  }

  const subtitle = loading ? "Carregando..." : `${items.length} ${items.length === 1 ? "compromisso" : "compromissos"}`;

  return (
    <ModalBase visible={visible} title="Quadro de avisos" onClose={onClose}>
      <div className={styles.container}>
        {!loading && (items.length > 0 || isAdmin) && (
          <div className={styles.intro}>
            <div className={styles.introText}>
              <p className={styles.eyebrow}>Quadro de avisos</p>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>

            {isAdmin && items.length > 0 && (
              <button
                type="button"
                className={[styles.editToggle, editing && styles.editToggleActive].filter(Boolean).join(" ")}
                onClick={() => setEditing((e) => !e)}
                aria-label={editing ? "Concluir edição" : "Editar compromissos"}
              >
                <Pencil size={15} color={editing ? "var(--color-white)" : "var(--color-text)"} />
                <span
                  className={[styles.editToggleText, editing && styles.editToggleTextActive].filter(Boolean).join(" ")}
                >
                  {editing ? "Concluir" : "Editar"}
                </span>
              </button>
            )}
          </div>
        )}

        {editing && (
          <div className={styles.hint}>
            <MoveVertical size={14} color="var(--color-text-muted)" />
            <p className={styles.hintText}>Toque em um compromisso para editar · arraste pela alça para reordenar.</p>
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
            <p className={styles.emptyTitle}>Mural vazio</p>
            <p className={styles.emptyText}>
              {isAdmin
                ? "Toque em + para publicar o primeiro compromisso da comunidade."
                : "Nenhum compromisso publicado ainda."}
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((item, index) => {
              const today = isCommitmentToday(item);
              return (
                <div
                  key={item.id}
                  ref={setRowRef(index)}
                  className={[styles.row, editing && styles.rowEditable].filter(Boolean).join(" ")}
                  onClick={editing ? () => openEdit(item) : undefined}
                >
                  <div className={styles.rail}>
                    <div className={styles.threadDashed} />
                    <div className={[styles.nodeEdit, today && styles.nodeEditToday].filter(Boolean).join(" ")}>
                      <span className={styles.nodeNumber}>{index + 1}</span>
                    </div>
                  </div>

                  <div
                    className={[
                      styles.card,
                      editing && styles.cardEditing,
                      today && styles.cardToday,
                      draggingIndex === index && styles.cardDragging,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className={styles.cardTopRow}>
                      <span className={styles.cardTitle}>{item.title}</span>
                      {today && (
                        <span className={styles.todayTag}>
                          <span className={styles.todayTagText}>HOJE</span>
                        </span>
                      )}
                      <span className={styles.timePill}>
                        <span className={styles.timeText}>{item.time}</span>
                      </span>
                    </div>
                    <div className={styles.cardMetaRow}>
                      <span className={styles.cardMeta}>
                        {commitmentScheduleLabel(item)} · {item.location}
                      </span>
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
              );
            })}
          </div>
        )}

        {isAdmin && !editing && (
          <button type="button" className={styles.fab} onClick={openCreate} aria-label="Publicar compromisso">
            <Plus size={28} color="var(--color-white)" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {formVisible && (
        <ModalCommitmentForm
          key={formTarget?.id ?? "new"}
          visible={formVisible}
          commitment={formTarget}
          onClose={() => setFormVisible(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </ModalBase>
  );
}
