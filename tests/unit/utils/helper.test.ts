import { describe, expect, it } from "vitest";
import {
  formatDateFromTimestamp,
  formatLiturgicalDate,
  formatMoneyBRL,
  normalizeText,
  parseDateBRToTimestamp,
} from "@/utils/helper";

describe("formatDateFromTimestamp", () => {
  it("formata em pt-BR", () => {
    const timestamp = new Date(1990, 0, 15).getTime();
    expect(formatDateFromTimestamp(timestamp)).toBe("15/01/1990");
  });

  it("devolve vazio para timestamp ausente ou zero", () => {
    expect(formatDateFromTimestamp()).toBe("");
    expect(formatDateFromTimestamp(0)).toBe("");
    expect(formatDateFromTimestamp(undefined)).toBe("");
  });
});

describe("parseDateBRToTimestamp", () => {
  it("converte dd/mm/aaaa para timestamp local", () => {
    expect(parseDateBRToTimestamp("15/01/1990")).toBe(
      new Date(1990, 0, 15).getTime(),
    );
  });

  it("faz o round-trip com formatDateFromTimestamp", () => {
    const original = "29/02/2024";
    expect(formatDateFromTimestamp(parseDateBRToTimestamp(original))).toBe(
      original,
    );
  });

  it("devolve NaN para entrada inválida", () => {
    expect(Number.isNaN(parseDateBRToTimestamp("nao-e-data"))).toBe(true);
  });
});

describe("normalizeText", () => {
  it("troca <br> por quebra de linha", () => {
    expect(normalizeText("linha um<br>linha dois")).toBe("linha um\nlinha dois");
    expect(normalizeText("linha um<br />linha dois")).toBe(
      "linha um\nlinha dois",
    );
  });

  it("remove as demais tags", () => {
    expect(normalizeText("<p>texto <b>forte</b></p>")).toBe("texto forte");
  });

  it("decodifica as entidades HTML tratadas", () => {
    expect(normalizeText("a&nbsp;b")).toBe("a b");
    expect(normalizeText("Tiago&amp;João")).toBe("Tiago&João");
    expect(normalizeText("&lt;tag&gt;")).toBe("<tag>");
    expect(normalizeText("&quot;citação&quot;")).toBe('"citação"');
  });

  it("colapsa três ou mais quebras em duas", () => {
    expect(normalizeText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("apara espaços nas pontas", () => {
    expect(normalizeText("   texto   ")).toBe("texto");
  });
});

describe("formatLiturgicalDate", () => {
  it("escreve a data por extenso com inicial maiúscula", () => {
    expect(formatLiturgicalDate("15/01/1990")).toBe(
      "Segunda-feira, 15 de janeiro de 1990",
    );
  });
});

describe("formatMoneyBRL", () => {
  it("formata número", () => {
    expect(formatMoneyBRL(1234.5)).toBe("R$ 1.234,50");
    expect(formatMoneyBRL(0)).toBe("R$ 0,00");
  });

  it("formata string numérica", () => {
    expect(formatMoneyBRL("10")).toBe("R$ 10,00");
    expect(formatMoneyBRL("1234.56")).toBe("R$ 1.234,56");
  });

  it("cai para zero quando não é número", () => {
    expect(formatMoneyBRL("abc")).toBe("R$ 0,00");
    expect(formatMoneyBRL(NaN)).toBe("R$ 0,00");
  });

  it("sempre usa duas casas decimais", () => {
    expect(formatMoneyBRL(1.005)).toBe("R$ 1,01");
    expect(formatMoneyBRL(1.1)).toBe("R$ 1,10");
  });

  it("formata valores negativos", () => {
    expect(formatMoneyBRL(-50)).toBe("R$ -50,00");
  });
});
