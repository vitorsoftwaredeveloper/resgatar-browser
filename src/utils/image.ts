// Portado de resgatar_app/src/utils/image.ts (idêntico — JS puro).

const BASE64_REGEX = /^[A-Za-z0-9+/\r\n]+={0,2}$/;

/**
 * Resolve o campo de foto do membro para uma URI utilizável em <img src>.
 *
 * - Já é um data URI (`data:image/...`) → retorna como está.
 * - É base64 "cru" → monta o data URI com prefixo jpeg.
 * - Vazio, espaços ou conteúdo que não é base64 → retorna null (cai no
 *   placeholder genérico no front).
 */
export function resolveAvatarUri(photo?: string | null): string | null {
  if (!photo) return null;

  const value = photo.trim();
  if (value.length === 0) return null;

  if (value.startsWith("data:image")) return value;

  if (value.length >= 8 && BASE64_REGEX.test(value)) {
    return `data:image/jpeg;base64,${value}`;
  }

  return null;
}
