import { describe, expect, it } from "vitest";
import { resolveAvatarUri } from "@/utils/image";

const BASE64 = "iVBORw0KGgoAAAANSUhEUg";

describe("resolveAvatarUri", () => {
  it("devolve null para valor ausente", () => {
    expect(resolveAvatarUri()).toBeNull();
    expect(resolveAvatarUri(null)).toBeNull();
    expect(resolveAvatarUri("")).toBeNull();
  });

  it("devolve null para string só de espaços", () => {
    expect(resolveAvatarUri("   ")).toBeNull();
  });

  it("mantém data URI intacto", () => {
    const uri = "data:image/png;base64,zzz";
    expect(resolveAvatarUri(uri)).toBe(uri);
  });

  it("monta data URI jpeg a partir de base64 cru", () => {
    expect(resolveAvatarUri(BASE64)).toBe(`data:image/jpeg;base64,${BASE64}`);
  });

  it("apara espaços antes de decidir", () => {
    expect(resolveAvatarUri(`  ${BASE64}  `)).toBe(
      `data:image/jpeg;base64,${BASE64}`,
    );
  });

  it("aceita base64 com padding", () => {
    expect(resolveAvatarUri("aGVsbG8gbXVuZG8=")).toBe(
      "data:image/jpeg;base64,aGVsbG8gbXVuZG8=",
    );
  });

  it("recusa conteúdo curto demais para ser imagem", () => {
    expect(resolveAvatarUri("abc")).toBeNull();
  });

  it("recusa conteúdo que não é base64", () => {
    expect(resolveAvatarUri("https://exemplo.com/foto.jpg")).toBeNull();
    expect(resolveAvatarUri("nome do arquivo.png")).toBeNull();
  });
});
