"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useImagePicker } from "@/hooks/useImagePicker";
import { BannerService } from "@/services/BannerService";
import { BANNER_SCREEN_OPTIONS, BannerActionType, IBanner, IBannerInput, MAX_BANNER_SIZE_BYTES } from "@/types/Banner";
import { getApiErrorMessage } from "@/utils/apiError";
import { Camera, ExternalLink, ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import styles from "./ModalBannerForm.module.css";

// Portado de resgatar_app/src/components/BannerCarousel/ModalBannerForm.
// expo-image-picker vira useImagePicker (input file); a validação de tamanho
// máximo do data URI (500 KB, espelhando o backend) permanece a mesma.

interface Props {
  visible: boolean;
  banner?: IBanner | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ACTION_TYPE_OPTIONS: { label: string; value: BannerActionType }[] = [
  { label: "Nenhum", value: "none" },
  { label: "URL externa", value: "external" },
  { label: "Tela do app", value: "internal" },
];

export function ModalBannerForm({ visible, banner, onClose, onSuccess }: Props) {
  const isEdit = Boolean(banner);
  const { loading: pickingImage, pickFromLibrary } = useImagePicker();

  const [imageData, setImageData] = useState<string | null>(banner?.banner ?? null);
  const [title, setTitle] = useState(banner?.title ?? "");
  const [actionType, setActionType] = useState<BannerActionType>(banner?.action.type ?? "none");
  const [actionValue, setActionValue] = useState(banner?.action.value ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  async function handlePickImage() {
    const base64 = await pickFromLibrary();
    if (!base64) return;

    const dataUri = `data:image/jpeg;base64,${base64}`;

    // Valida tamanho antes de aceitar (limite do backend: 500 KB).
    if (dataUri.length > MAX_BANNER_SIZE_BYTES) {
      ToastMessage.error("Imagem muito grande", "Escolha uma imagem menor ou reduza a qualidade. Limite: 500 KB.");
      return;
    }

    setImageData(dataUri);
    clearError("image");
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!imageData) next.image = "Selecione uma imagem para o banner.";
    if (!title.trim()) next.title = "O título é obrigatório.";
    if (actionType === "external") {
      if (!actionValue.trim()) next.actionValue = "Informe a URL de destino.";
      else if (!/^https?:\/\/.+/.test(actionValue.trim()))
        next.actionValue = "URL inválida (deve começar com http:// ou https://).";
    }
    if (actionType === "internal" && !actionValue) {
      next.actionValue = "Selecione uma tela de destino.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const input: IBannerInput = {
        banner: imageData!,
        title: title.trim(),
        action: {
          type: actionType,
          value: actionType === "none" ? "" : actionValue.trim(),
        },
      };
      if (isEdit && banner) {
        await BannerService.update(banner.id, input);
        ToastMessage.success("Salvo", "Banner atualizado com sucesso.");
      } else {
        await BannerService.create(input);
        ToastMessage.success("Publicado", "Banner adicionado ao carrossel.");
      }
      onSuccess();
    } catch (err) {
      ToastMessage.error("Erro", getApiErrorMessage(err, "Não foi possível salvar o banner."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!banner) return;
    setDeleting(true);
    try {
      await BannerService.remove(banner.id);
      ToastMessage.success("Removido", "Banner excluído do carrossel.");
      onSuccess();
    } catch (err) {
      ToastMessage.error("Erro", getApiErrorMessage(err, "Não foi possível remover o banner."));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <ModalBase visible={visible} title={isEdit ? "Editar banner" : "Novo banner"} onClose={onClose}>
      <div className={styles.container}>
        <Card title="Imagem" description="Proporção recomendada: 16:9. Tamanho máximo: 500 KB.">
          <button
            type="button"
            className={styles.previewWrapper}
            onClick={handlePickImage}
            disabled={pickingImage}
            aria-label="Selecionar imagem da galeria"
          >
            {pickingImage ? (
              <div className={styles.previewPlaceholder}>
                <span className={styles.spinner} />
              </div>
            ) : imageData ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageData} alt="Prévia do banner" className={styles.previewImage} />
                <div className={styles.previewEditBadge}>
                  <Camera size={14} color="#FFFFFF" />
                  <span className={styles.previewEditText}>Trocar</span>
                </div>
              </>
            ) : (
              <div className={styles.previewPlaceholder}>
                <ImageIcon size={28} color="var(--color-text-muted)" />
                <span className={styles.previewPlaceholderText}>Toque para escolher uma imagem</span>
              </div>
            )}
          </button>

          {errors.image && <p className={styles.errorText}>{errors.image}</p>}
        </Card>

        <Card title="Configurações">
          <Input
            label="Título *"
            placeholder="Ex: Campanha do Dízimo"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              clearError("title");
            }}
            maxLength={80}
            error={errors.title}
          />

          <div>
            <p className={styles.fieldLabel}>Ao tocar no banner</p>
            <div className={styles.segment}>
              {ACTION_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={[styles.segmentItem, actionType === opt.value && styles.segmentItemActive]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setActionType(opt.value);
                    setActionValue("");
                    clearError("actionValue");
                  }}
                >
                  <span
                    className={[styles.segmentText, actionType === opt.value && styles.segmentTextActive]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {actionType === "external" && (
            <Input
              label="URL de destino"
              placeholder="https://..."
              value={actionValue}
              onChangeText={(t) => {
                setActionValue(t);
                clearError("actionValue");
              }}
              autoCapitalize="none"
              inputMode="url"
              leftIcon={<ExternalLink size={16} color="var(--color-text-muted)" />}
              error={errors.actionValue}
            />
          )}

          {actionType === "internal" && (
            <div>
              <p className={styles.fieldLabel}>Tela de destino</p>
              <div className={styles.chipsRow}>
                {BANNER_SCREEN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={[styles.chip, actionValue === opt.value && styles.chipActive].filter(Boolean).join(" ")}
                    onClick={() => {
                      setActionValue(opt.value);
                      clearError("actionValue");
                    }}
                  >
                    <span
                      className={[styles.chipText, actionValue === opt.value && styles.chipTextActive]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.actionValue && <p className={styles.errorText}>{errors.actionValue}</p>}
            </div>
          )}
        </Card>

        <div className={styles.footer}>
          <div className={styles.footerRow}>
            {isEdit && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                <Trash2 size={16} color="var(--color-error)" />
                <span className={styles.deleteText}>Remover</span>
              </button>
            )}
            <div className={styles.saveFlex}>
              <Button title={isEdit ? "Salvar" : "Publicar"} onPress={handleSave} loading={saving} />
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Dialog
          visible={confirmDelete}
          title="Remover banner?"
          description="Esta ação não pode ser desfeita. O banner será excluído permanentemente do carrossel."
          onClose={() => (deleting ? undefined : setConfirmDelete(false))}
          actions={[
            { label: "cancelar", onPress: () => setConfirmDelete(false), variant: "secondary" },
            { label: deleting ? "removendo..." : "remover", onPress: handleDelete, variant: "primary" },
          ]}
        />
      )}
    </ModalBase>
  );
}
