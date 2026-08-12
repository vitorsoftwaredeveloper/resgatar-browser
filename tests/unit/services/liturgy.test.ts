import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));

vi.mock("axios", () => ({
  default: { get: axiosGet },
}));

import { LiturgyService } from "@/services/LiturgyService";

const RAW = {
  data: "04/06/2026",
  liturgia: "Quinta-feira da 9ª Semana do Tempo Comum",
  cor: "Verde",
  leituras: {
    primeiraLeitura: [
      {
        referencia: "2Tm 2,8-15",
        titulo: "<b>Leitura</b>",
        texto: "linha um<br>linha dois",
      },
    ],
    salmo: [
      {
        referencia: "Sl 24",
        refrao: "&quot;Ensinai-me&quot;",
        texto: "texto&nbsp;do salmo",
      },
    ],
    evangelho: [
      { referencia: "Mc 12,28-34", titulo: "Evangelho", texto: "<p>texto</p>" },
    ],
  },
  oracoes: {
    coleta: "<p>coleta</p>",
    oferendas: "oferendas",
    comunhao: "comunhao",
  },
};

beforeEach(() => {
  window.localStorage.clear();
  axiosGet.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getToday", () => {
  it("busca na API e normaliza o HTML das leituras", async () => {
    axiosGet.mockResolvedValueOnce({ data: RAW });

    const liturgia = await LiturgyService.getToday();

    expect(liturgia.liturgia).toBe(RAW.liturgia);
    expect(liturgia.leituras.primeiraLeitura.texto).toBe(
      "linha um\nlinha dois",
    );
    expect(liturgia.leituras.primeiraLeitura.titulo).toBe("Leitura");
    expect(liturgia.leituras.salmo.texto).toBe("texto do salmo");
    expect(liturgia.leituras.salmo.refrao).toBe('"Ensinai-me"');
    expect(liturgia.leituras.evangelho.texto).toBe("texto");
    expect(liturgia.oracoes?.coleta).toBe("coleta");
  });

  it("guarda no cache e não bate na API de novo", async () => {
    axiosGet.mockResolvedValueOnce({ data: RAW });

    await LiturgyService.getToday();
    await LiturgyService.getToday();

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it("force ignora o cache", async () => {
    axiosGet.mockResolvedValue({ data: RAW });

    await LiturgyService.getToday();
    await LiturgyService.getToday(true);

    expect(axiosGet).toHaveBeenCalledTimes(2);
  });

  it("trata segundaLeitura ausente", async () => {
    axiosGet.mockResolvedValueOnce({ data: RAW });

    const liturgia = await LiturgyService.getToday();

    expect(liturgia.leituras.segundaLeitura).toBeUndefined();
  });

  it("trata leituras que vêm como objeto em vez de array", async () => {
    axiosGet.mockResolvedValueOnce({
      data: {
        ...RAW,
        leituras: {
          primeiraLeitura: { referencia: "1", texto: "a" },
          salmo: { referencia: "Sl", texto: "b" },
          evangelho: { referencia: "Ev", texto: "c" },
        },
      },
    });

    const liturgia = await LiturgyService.getToday();

    expect(liturgia.leituras.primeiraLeitura.referencia).toBe("1");
    expect(liturgia.leituras.evangelho.referencia).toBe("Ev");
  });

  it("trata orações ausentes", async () => {
    axiosGet.mockResolvedValueOnce({ data: { ...RAW, oracoes: undefined } });

    const liturgia = await LiturgyService.getToday();

    expect(liturgia.oracoes).toBeUndefined();
  });

  it("propaga o erro da API", async () => {
    axiosGet.mockRejectedValueOnce(new Error("offline"));

    await expect(LiturgyService.getToday()).rejects.toThrow("offline");
  });
});

describe("getByDate", () => {
  it("monta a query com dia, mês e ano preenchidos com zero", async () => {
    axiosGet.mockResolvedValueOnce({ data: RAW });

    await LiturgyService.getByDate(new Date(2026, 0, 5));

    expect(axiosGet).toHaveBeenCalledWith(
      "https://liturgia.up.railway.app/v2/?dia=05&mes=01&ano=2026",
    );
  });

  it("não usa nem grava cache", async () => {
    axiosGet.mockResolvedValue({ data: RAW });

    await LiturgyService.getByDate(new Date(2026, 5, 4));
    await LiturgyService.getByDate(new Date(2026, 5, 4));

    expect(axiosGet).toHaveBeenCalledTimes(2);
  });
});
