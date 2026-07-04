import { ToastMessage } from "@/components/Toast";
import { useState } from "react";

// Adaptação web de resgatar_app/src/hooks/useImagePicker.ts. expo-image-picker
// vira um <input type="file"> temporário; "câmera" usa capture="environment"
// (abre a câmera em navegadores mobile; em desktop cai no seletor de arquivos
// normal, já que não há câmera dedicada). Sem allowsEditing/aspect (não há
// crop nativo no browser) — a validação de tamanho máximo permanece a mesma.

interface UseImagePickerResult {
  loading: boolean;
  pickFromLibrary: () => Promise<string | null>;
  takePhoto: () => Promise<string | null>;
}

// Espelha MAX_PROFILE_IMAGE_LENGTH da API: ~700.000 chars de base64 ≈ 500 KB.
const MAX_BASE64_LENGTH = 700_000;

function pickFile(capture?: "environment"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (capture) input.capture = capture;
    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function useImagePicker(): UseImagePickerResult {
  const [loading, setLoading] = useState(false);

  async function pick(capture?: "environment"): Promise<string | null> {
    setLoading(true);
    try {
      const file = await pickFile(capture);
      if (!file) return null;

      const base64 = await fileToBase64(file);
      if (base64.length > MAX_BASE64_LENGTH) {
        ToastMessage.error("Imagem muito grande", "Escolha uma foto menor (até ~500 KB).");
        return null;
      }

      return base64;
    } catch {
      ToastMessage.error("Erro", "Não foi possível selecionar a imagem.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    pickFromLibrary: () => pick(),
    takePhoto: () => pick("environment"),
  };
}
