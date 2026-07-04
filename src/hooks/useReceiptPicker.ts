import { ToastMessage } from "@/components/Toast";
import { useState } from "react";

// Adaptação web de resgatar_app/src/hooks/useReceiptPicker.ts. expo-image-picker
// vira um <input type="file">; o comprovante mantém o `File` original (para
// upload direto via ExpenseServices.uploadReceipt) e uma `previewUrl` (via
// URL.createObjectURL) só para exibir a prévia na tela.

export interface ReceiptAsset {
  file: File;
  previewUrl: string;
  contentType: string;
  fileName: string;
}

interface UseReceiptPickerResult {
  loading: boolean;
  pickFromLibrary: () => Promise<ReceiptAsset | null>;
  takePhoto: () => Promise<ReceiptAsset | null>;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

function pickFile(capture?: "environment"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (capture) input.capture = capture;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function toReceiptAsset(file: File): ReceiptAsset | null {
  if (file.size > MAX_RECEIPT_BYTES) {
    ToastMessage.error("Arquivo muito grande", "Escolha um comprovante de até 5 MB.");
    return null;
  }

  const contentType = ALLOWED_IMAGE_TYPES.includes(file.type) ? file.type : "image/jpeg";

  return {
    file,
    previewUrl: URL.createObjectURL(file),
    contentType,
    fileName: file.name || "comprovante",
  };
}

export function useReceiptPicker(): UseReceiptPickerResult {
  const [loading, setLoading] = useState(false);

  async function pick(capture?: "environment"): Promise<ReceiptAsset | null> {
    setLoading(true);
    try {
      const file = await pickFile(capture);
      if (!file) return null;
      return toReceiptAsset(file);
    } catch {
      ToastMessage.error("Erro", "Não foi possível selecionar o comprovante.");
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
