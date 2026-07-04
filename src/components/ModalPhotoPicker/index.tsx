"use client";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { ItemActionList } from "@/components/ItemActionList";
import { ModalBase } from "@/components/ModalBase";
import { useAppTheme } from "@/context/ThemeContext";
import { useImagePicker } from "@/hooks/useImagePicker";
import { Camera, ImageIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import styles from "./ModalPhotoPicker.module.css";

// Portado de resgatar_app/src/components/ModalPhotoPicker.

interface ModalPhotoPickerProps {
  visible: boolean;
  onClose: () => void;
  currentPhoto?: string | null;
  onConfirm: (photo: string) => void | Promise<void>;
  title?: string;
  confirmLabel?: string;
}

export const ModalPhotoPicker = ({
  visible,
  onClose,
  currentPhoto,
  onConfirm,
  title = "Foto de perfil",
  confirmLabel = "Salvar",
}: ModalPhotoPickerProps) => {
  const { colors } = useAppTheme();
  const { loading: picking, pickFromLibrary, takePhoto } = useImagePicker();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewPhoto = selectedPhoto !== null ? selectedPhoto : (currentPhoto ?? "");
  const hasChanges = selectedPhoto !== null;
  const busy = picking || saving;

  const handlePick = async (source: "library" | "camera") => {
    if (busy) return;
    const base64 = source === "library" ? await pickFromLibrary() : await takePhoto();
    if (base64) setSelectedPhoto(base64);
  };

  const handleConfirm = async () => {
    if (selectedPhoto === null) return;
    setSaving(true);
    try {
      await onConfirm(selectedPhoto);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase visible={visible} onClose={onClose} title={title}>
      <div className={styles.container}>
        <div className={styles.scroll}>
          <div className={styles.preview}>
            <div className={styles.avatarRing}>
              <Avatar photo={previewPhoto} size={132} />
            </div>
            <p className={styles.previewHint}>{previewPhoto ? "Sua foto de perfil" : "Você ainda não tem foto"}</p>
          </div>

          <div className={styles.card}>
            <ItemActionList
              title="Tirar foto"
              description="Use a câmera do dispositivo"
              onPress={() => handlePick("camera")}
              icon={<Camera size={20} color={colors.primary} />}
            />
            <ItemActionList
              title="Escolher da galeria"
              description="Selecione uma foto existente"
              onPress={() => handlePick("library")}
              icon={<ImageIcon size={20} color={colors.primary} />}
              isLast
            />
          </div>

          {previewPhoto ? (
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => !busy && setSelectedPhoto("")}
            >
              <Trash2 size={18} color={colors.error} />
              <span className={styles.removeText}>Remover foto atual</span>
            </button>
          ) : null}
        </div>

        <div className={styles.footer}>
          <Button title={confirmLabel} onPress={handleConfirm} loading={saving} disabled={!hasChanges || busy} />
        </div>
      </div>
    </ModalBase>
  );
};
