import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "@/utils/apiError";

const FALLBACK = "Não foi possível concluir a operação.";

describe("getApiErrorMessage", () => {
  it("usa a mensagem devolvida pela API", () => {
    const error = { response: { data: { message: "E-mail já cadastrado" } } };
    expect(getApiErrorMessage(error, FALLBACK)).toBe("E-mail já cadastrado");
  });

  it("cai no fallback quando a mensagem é vazia ou só espaços", () => {
    expect(getApiErrorMessage({ response: { data: { message: "" } } }, FALLBACK)).toBe(
      FALLBACK,
    );
    expect(
      getApiErrorMessage({ response: { data: { message: "   " } } }, FALLBACK),
    ).toBe(FALLBACK);
  });

  it("cai no fallback quando não há response, data ou message", () => {
    expect(getApiErrorMessage({}, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage({ response: {} }, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage({ response: { data: {} } }, FALLBACK)).toBe(
      FALLBACK,
    );
  });

  it("cai no fallback para erros que não são do axios", () => {
    expect(getApiErrorMessage(new Error("erro de rede"), FALLBACK)).toBe(
      FALLBACK,
    );
    expect(getApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage("string solta", FALLBACK)).toBe(FALLBACK);
  });
});
