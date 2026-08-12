import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { api } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/services/api", () => ({ api, publicApi: { post: vi.fn() } }));

import { ChargeServices } from "@/services/ChargeService";
import { DonationServices } from "@/services/DonationService";
import { ExpenseServices } from "@/services/ExpenseService";
import { fetchTTSAudio } from "@/services/GoogleTTSService";

const BOOM = new Error("500");

function envelope<T>(data: T) {
  return { data: { data } };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ChargeServices.getGoalProgress", () => {
  it("lê o progresso da meta", async () => {
    api.get.mockResolvedValueOnce(envelope({ achievedPercent: 40 }));

    await expect(ChargeServices.getGoalProgress()).resolves.toEqual({
      achievedPercent: 40,
    });
    expect(api.get).toHaveBeenCalledWith("/charges/goal-progress");
  });

  it("propaga erro", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(ChargeServices.getGoalProgress()).rejects.toThrow("500");
  });
});

describe("ChargeServices.setMonthlyGoal", () => {
  it("grava ano, mês e valor", async () => {
    api.put.mockResolvedValueOnce({});

    await ChargeServices.setMonthlyGoal(2026, 6, "2000,00");

    expect(api.put).toHaveBeenCalledWith("/charges/monthly-goal", {
      year: 2026,
      month: 6,
      amount: "2000,00",
    });
  });

  it("propaga erro", async () => {
    api.put.mockRejectedValueOnce(BOOM);

    await expect(
      ChargeServices.setMonthlyGoal(2026, 6, "2000,00"),
    ).rejects.toThrow("500");
  });
});

describe("ChargeServices.consultCharge", () => {
  it("consulta pelo transactionId", async () => {
    api.get.mockResolvedValueOnce(envelope({ status: "approved" }));

    await expect(
      ChargeServices.consultCharge("161662466549"),
    ).resolves.toEqual({ status: "approved" });
    expect(api.get).toHaveBeenCalledWith("/charges/161662466549");
  });

  it("propaga erro", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(ChargeServices.consultCharge("1")).rejects.toThrow("500");
  });
});

describe("DonationServices.list", () => {
  it("lista as doações do ano", async () => {
    api.get.mockResolvedValueOnce(envelope([{ transactionId: "1" }]));

    await expect(DonationServices.list(2026)).resolves.toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/donations", {
      params: { year: 2026 },
    });
  });

  it("propaga erro", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(DonationServices.list(2026)).rejects.toThrow("500");
  });
});

describe("ExpenseServices.uploadReceipt", () => {
  const arquivo = new File(["conteudo"], "comprovante.png", {
    type: "image/png",
  });

  function stubUploadUrl() {
    api.get.mockResolvedValueOnce({
      data: { data: { uploadUrl: "https://s3.exemplo/put", key: "chave-123" } },
    });
  }

  it("pede a URL assinada com o content-type", async () => {
    stubUploadUrl();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    await ExpenseServices.uploadReceipt(arquivo, "image/png");

    expect(api.get).toHaveBeenCalledWith("/expenses/receipt-upload-url", {
      params: { contentType: "image/png" },
    });
  });

  it("envia o arquivo por PUT e devolve a chave", async () => {
    stubUploadUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      ExpenseServices.uploadReceipt(arquivo, "image/png"),
    ).resolves.toBe("chave-123");

    expect(fetchMock).toHaveBeenCalledWith("https://s3.exemplo/put", {
      method: "PUT",
      body: arquivo,
      headers: { "Content-Type": "image/png" },
    });
  });

  it("falha quando o S3 recusa o upload", async () => {
    stubUploadUrl();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );

    await expect(
      ExpenseServices.uploadReceipt(arquivo, "image/png"),
    ).rejects.toThrow("S3 upload failed with status 403");
  });

  it("propaga erro ao pedir a URL assinada", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(
      ExpenseServices.uploadReceipt(arquivo, "image/png"),
    ).rejects.toThrow("500");
  });
});

describe("ExpenseServices.getReceiptViewUrl", () => {
  it("devolve a URL de visualização", async () => {
    api.get.mockResolvedValueOnce({
      data: { data: { viewUrl: "https://s3.exemplo/ver" } },
    });

    await expect(ExpenseServices.getReceiptViewUrl("d1")).resolves.toBe(
      "https://s3.exemplo/ver",
    );
    expect(api.get).toHaveBeenCalledWith("/expenses/d1/receipt");
  });

  it("propaga erro", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(ExpenseServices.getReceiptViewUrl("d1")).rejects.toThrow(
      "500",
    );
  });
});

describe("fetchTTSAudio", () => {
  it("transforma o base64 do backend em data URI de mp3", async () => {
    api.post.mockResolvedValueOnce({ data: { audioContent: "QUJD" } });

    await expect(fetchTTSAudio("texto da leitura")).resolves.toBe(
      "data:audio/mp3;base64,QUJD",
    );
    expect(api.post).toHaveBeenCalledWith("/tts", { text: "texto da leitura" });
  });

  it("propaga erro do backend", async () => {
    api.post.mockRejectedValueOnce(BOOM);

    await expect(fetchTTSAudio("texto")).rejects.toThrow("500");
  });
});
