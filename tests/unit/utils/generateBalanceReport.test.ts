import { afterEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

const { writeFileMock } = vi.hoisted(() => ({ writeFileMock: vi.fn() }));

vi.mock("xlsx", async (importOriginal) => {
  const original = await importOriginal<typeof import("xlsx")>();
  return { ...original, writeFile: writeFileMock };
});
import {
  generateBalanceReportHTML,
  generateBalanceReportWorkbook,
  shareBalanceReportExcel,
  shareBalanceReportPDF,
} from "@/utils/generateBalanceReport";
import type { IAnnualBalance } from "@/types/Balance";

const BALANCO: IAnnualBalance = {
  year: 2026,
  asOfMonth: 6,
  totals: {
    entradas: 1200,
    doacoes: 300,
    saidas: 500,
    saldoFinal: 1000,
  },
  byMonth: [
    {
      month: 1,
      entradas: 200,
      doacoes: 50,
      saidas: 100,
      resultado: 150,
      saldoAcumulado: 150,
    },
    {
      month: 2,
      entradas: 200,
      doacoes: 0,
      saidas: 400,
      resultado: -200,
      saldoAcumulado: -50,
    },
  ],
  expensesByCategory: { material: 300, food: 200 },
} as unknown as IAnnualBalance;

function janelaFalsa() {
  return {
    document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
    focus: vi.fn(),
    print: vi.fn(),
    onload: null as (() => void) | null,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateBalanceReportHTML", () => {
  it("monta um documento HTML com o ano no título", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: true,
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("2026");
  });

  it("marca o corte como acumulado no ano corrente", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: true,
    });

    expect(html).toContain("Acumulado até Junho");
  });

  it("marca o corte como ano fechado quando não é o ano corrente", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
    });

    expect(html).toContain("Ano fechado");
  });

  it("lista os meses com os nomes em português", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
    });

    expect(html).toContain("Janeiro");
    expect(html).toContain("Fevereiro");
  });

  it("traduz as categorias de despesa", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
    });

    expect(html).toContain("Material");
    expect(html).toContain("Alimentação");
  });

  it("avisa quando não há despesa no período", () => {
    const html = generateBalanceReportHTML({
      balance: { ...BALANCO, expensesByCategory: {} } as IAnnualBalance,
      isCurrentYear: false,
    });

    expect(html).toContain("Nenhuma despesa registrada no período.");
  });

  it("usa a paleta escura quando pedido", () => {
    const claro = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
      themeMode: "light",
    });
    const escuro = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
      themeMode: "dark",
    });

    expect(claro).toContain("#FAFAFA");
    expect(escuro).toContain("#1A1812");
    expect(escuro).not.toBe(claro);
  });

  it("mostra o sinal do resultado de cada mês", () => {
    const html = generateBalanceReportHTML({
      balance: BALANCO,
      isCurrentYear: false,
    });

    expect(html).toContain("+");
    expect(html).toContain("−");
  });
});

describe("shareBalanceReportPDF", () => {
  it("escreve o relatório na janela de impressão", async () => {
    const janela = janelaFalsa();
    vi.stubGlobal("open", vi.fn().mockReturnValue(janela));

    await shareBalanceReportPDF({ balance: BALANCO, isCurrentYear: true });

    expect(janela.document.open).toHaveBeenCalled();
    expect(janela.document.write).toHaveBeenCalledWith(
      expect.stringContaining("2026"),
    );
    expect(janela.document.close).toHaveBeenCalled();
  });

  it("imprime quando a janela termina de carregar", async () => {
    const janela = janelaFalsa();
    vi.stubGlobal("open", vi.fn().mockReturnValue(janela));

    await shareBalanceReportPDF({ balance: BALANCO, isCurrentYear: true });
    janela.onload?.();

    expect(janela.focus).toHaveBeenCalled();
    expect(janela.print).toHaveBeenCalled();
  });

  it("explica quando o pop-up é bloqueado", async () => {
    vi.stubGlobal("open", vi.fn().mockReturnValue(null));

    await expect(
      shareBalanceReportPDF({ balance: BALANCO, isCurrentYear: true }),
    ).rejects.toThrow("pop-up bloqueado");
  });
});

describe("generateBalanceReportWorkbook", () => {
  it("cria as três abas do relatório", () => {
    const wb = generateBalanceReportWorkbook({
      balance: BALANCO,
      isCurrentYear: true,
    });

    expect(wb.SheetNames).toEqual([
      "Resumo",
      "Por mês",
      "Despesas por categoria",
    ]);
  });

  it("preenche o resumo com os totais", () => {
    const wb = generateBalanceReportWorkbook({
      balance: BALANCO,
      isCurrentYear: true,
    });
    const linhas = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets.Resumo,
      { header: 1 },
    );

    expect(linhas[0][0]).toBe("Balanço Anual 2026");
    expect(linhas).toContainEqual(["Entradas", 1200]);
    expect(linhas).toContainEqual(["Doações", 300]);
    expect(linhas).toContainEqual(["Saídas", 500]);
    expect(linhas).toContainEqual(["Saldo", 1000]);
  });

  it("lista os meses com cabeçalho e valores numéricos", () => {
    const wb = generateBalanceReportWorkbook({
      balance: BALANCO,
      isCurrentYear: true,
    });
    const linhas = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Por mês"],
      { header: 1 },
    );

    expect(linhas[0]).toEqual([
      "Mês",
      "Entradas",
      "Doações",
      "Saídas",
      "Resultado",
      "Saldo acumulado",
    ]);
    expect(linhas[1]).toEqual(["Janeiro", 200, 50, 100, 150, 150]);
    expect(linhas[2]).toEqual(["Fevereiro", 200, 0, 400, -200, -50]);
  });

  it("ordena as categorias da maior para a menor", () => {
    const wb = generateBalanceReportWorkbook({
      balance: BALANCO,
      isCurrentYear: true,
    });
    const linhas = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Despesas por categoria"],
      { header: 1 },
    );

    expect(linhas[1][0]).toBe("Material");
    expect(linhas[2][0]).toBe("Alimentação");
  });

  it("avisa na planilha quando não há despesa", () => {
    const wb = generateBalanceReportWorkbook({
      balance: { ...BALANCO, expensesByCategory: {} } as IAnnualBalance,
      isCurrentYear: true,
    });
    const linhas = XLSX.utils.sheet_to_json<(string | number)[]>(
      wb.Sheets["Despesas por categoria"],
      { header: 1 },
    );

    expect(linhas[1][0]).toBe("Nenhuma despesa registrada no período.");
  });

  it("aplica o formato de moeda nas células numéricas", () => {
    const wb = generateBalanceReportWorkbook({
      balance: BALANCO,
      isCurrentYear: true,
    });

    expect(wb.Sheets.Resumo.B4.z).toBe('"R$" #,##0.00');
  });
});

describe("shareBalanceReportExcel", () => {
  it("dispara o download com o nome do ano", async () => {
    writeFileMock.mockReset();

    await shareBalanceReportExcel({ balance: BALANCO, isCurrentYear: true });

    expect(writeFileMock).toHaveBeenCalledWith(
      expect.objectContaining({ SheetNames: expect.any(Array) }),
      "balanco-2026.xlsx",
    );
  });
});
