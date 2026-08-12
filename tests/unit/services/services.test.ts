import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { api, publicApi } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  publicApi: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@/services/api", () => ({ api, publicApi }));

import { BalanceServices } from "@/services/BalanceService";
import { BannerService } from "@/services/BannerService";
import { ChargeServices } from "@/services/ChargeService";
import { CommitmentService } from "@/services/CommitmentService";
import { DashboardVisibilityServices } from "@/services/DashboardVisibilityService";
import { DeviceServices } from "@/services/DeviceService";
import { DonationServices } from "@/services/DonationService";
import { ExpenseServices } from "@/services/ExpenseService";
import { MemberServices } from "@/services/MemberService";
import { NotificationServices } from "@/services/NotificationService";
import { ReadingStreakService } from "@/services/ReadingStreakService";
import { VideoService } from "@/services/VideoService";

const BOOM = new Error("500");

function envelope<T>(data: T) {
  return { data: { data } };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("MemberServices", () => {
  it("getMember desembrulha o envelope data.data", async () => {
    api.get.mockResolvedValueOnce(envelope({ _id: "1", email: "a@b.com" }));

    await expect(MemberServices.getMember()).resolves.toEqual({
      _id: "1",
      email: "a@b.com",
    });
    expect(api.get).toHaveBeenCalledWith("/members");
  });

  it("editMember faz PUT no id do membro", async () => {
    api.put.mockResolvedValueOnce(envelope({ ok: true }));
    const member = { _id: "abc", firstName: "Vitor" } as never;

    await MemberServices.editMember(member);

    expect(api.put).toHaveBeenCalledWith("/members/abc", member);
  });

  it("getMemberById monta a URL com o id", async () => {
    api.get.mockResolvedValueOnce(envelope({ _id: "xyz" }));

    await MemberServices.getMemberById("xyz");

    expect(api.get).toHaveBeenCalledWith("/members/xyz");
  });

  it("listMembers usa o endpoint de listagem", async () => {
    api.get.mockResolvedValueOnce(envelope([{ _id: "1" }]));

    await expect(MemberServices.listMembers()).resolves.toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith("/members/list");
  });

  it("listBirthdayMembers usa o endpoint de aniversariantes", async () => {
    api.get.mockResolvedValueOnce(envelope([]));

    await MemberServices.listBirthdayMembers();

    expect(api.get).toHaveBeenCalledWith("/members/birthdays");
  });

  it("removeMember faz DELETE", async () => {
    api.delete.mockResolvedValueOnce(envelope(null));

    await MemberServices.removeMember("abc");

    expect(api.delete).toHaveBeenCalledWith("/members/abc");
  });

  it("register usa a api pública", async () => {
    publicApi.post.mockResolvedValueOnce(envelope({ _id: "novo" }));
    const payload = { email: "novo@b.com", password: "x" } as never;

    await MemberServices.register(payload);

    expect(publicApi.post).toHaveBeenCalledWith("/members", payload);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("updatePhoto manda só a foto", async () => {
    api.put.mockResolvedValueOnce(envelope({}));

    await MemberServices.updatePhoto("abc", "data:image/png;base64,zzz");

    expect(api.put).toHaveBeenCalledWith("/members/abc", {
      profileImage: "data:image/png;base64,zzz",
    });
  });

  it("updatePassword manda só a senha", async () => {
    api.put.mockResolvedValueOnce(envelope({}));

    await MemberServices.updatePassword("abc", "NovaSenha1@");

    expect(api.put).toHaveBeenCalledWith("/members/abc/password", {
      password: "NovaSenha1@",
    });
  });

  it("propaga o erro e registra no console", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(MemberServices.getMember()).rejects.toThrow("500");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("ChargeServices", () => {
  it("createCharge manda o mês de referência", async () => {
    api.post.mockResolvedValueOnce(envelope({ transactionId: "1" }));

    await ChargeServices.createCharge(5);

    expect(api.post).toHaveBeenCalledWith("/charges", { referenceMonth: 5 });
  });

  it("registerCashPayment aceita valor opcional", async () => {
    api.post.mockResolvedValue(envelope(null));

    await ChargeServices.registerCashPayment("m1", 3);
    expect(api.post).toHaveBeenCalledWith("/charges/cash", {
      memberId: "m1",
      referenceMonth: 3,
      value: undefined,
    });

    await ChargeServices.registerCashPayment("m1", 3, "10,00");
    expect(api.post).toHaveBeenLastCalledWith("/charges/cash", {
      memberId: "m1",
      referenceMonth: 3,
      value: "10,00",
    });
  });

  it("getSummary manda ano e mês como params", async () => {
    api.get.mockResolvedValueOnce(envelope({ goal: 0 }));

    await ChargeServices.getSummary(2026, 6);

    expect(api.get).toHaveBeenCalledWith("/charges/summary", {
      params: { year: 2026, month: 6 },
    });
  });

  it("getAnnualSummary manda o ano", async () => {
    api.get.mockResolvedValueOnce(envelope({ year: 2026 }));

    await ChargeServices.getAnnualSummary(2026);

    expect(api.get).toHaveBeenCalledWith("/charges/annual-summary", {
      params: { year: 2026 },
    });
  });

  it("propaga erro na criação da cobrança", async () => {
    api.post.mockRejectedValueOnce(BOOM);

    await expect(ChargeServices.createCharge(0)).rejects.toThrow("500");
  });
});

describe("ExpenseServices", () => {
  it("create devolve o id da despesa criada", async () => {
    api.post.mockResolvedValueOnce(envelope({ _id: "desp1" }));

    await expect(
      ExpenseServices.create({ description: "Luz" } as never),
    ).resolves.toBe("desp1");
  });

  it("list manda ano e mês", async () => {
    api.get.mockResolvedValueOnce(envelope([]));

    await ExpenseServices.list(2026, 6);

    expect(api.get).toHaveBeenCalledWith("/expenses", {
      params: { year: 2026, month: 6 },
    });
  });

  it("getSummary usa o endpoint de resumo", async () => {
    api.get.mockResolvedValueOnce(envelope({ total: 0 }));

    await ExpenseServices.getSummary(2026, 6);

    expect(api.get).toHaveBeenCalledWith("/expenses/summary", {
      params: { year: 2026, month: 6 },
    });
  });

  it("update e remove usam o id na URL", async () => {
    api.put.mockResolvedValueOnce({});
    api.delete.mockResolvedValueOnce({});

    await ExpenseServices.update("d1", { description: "x" } as never);
    await ExpenseServices.remove("d1");

    expect(api.put).toHaveBeenCalledWith("/expenses/d1", { description: "x" });
    expect(api.delete).toHaveBeenCalledWith("/expenses/d1");
  });

  it("propaga erro ao remover", async () => {
    api.delete.mockRejectedValueOnce(BOOM);

    await expect(ExpenseServices.remove("d1")).rejects.toThrow("500");
  });
});

describe("DonationServices", () => {
  it("createPix omite o nome do doador quando vazio", async () => {
    api.post.mockResolvedValue(envelope({ transactionId: "1" }));

    await DonationServices.createPix("10,00");
    expect(api.post).toHaveBeenCalledWith("/donations", { amount: "10,00" });

    await DonationServices.createPix("10,00", "Maria");
    expect(api.post).toHaveBeenLastCalledWith("/donations", {
      amount: "10,00",
      donorName: "Maria",
    });
  });

  it("registerCash inclui mês de referência quando informado", async () => {
    api.post.mockResolvedValue(envelope({ transactionId: "1" }));

    await DonationServices.registerCash("10,00", "Maria", 4);

    expect(api.post).toHaveBeenCalledWith("/donations/cash", {
      amount: "10,00",
      donorName: "Maria",
      referenceMonth: 4,
    });
  });

  it("registerCash aceita mês zero", async () => {
    api.post.mockResolvedValue(envelope({ transactionId: "1" }));

    await DonationServices.registerCash("10,00", undefined, 0);

    expect(api.post).toHaveBeenCalledWith("/donations/cash", {
      amount: "10,00",
      referenceMonth: 0,
    });
  });

  it("consult monta a URL com o transactionId", async () => {
    api.get.mockResolvedValueOnce(envelope({ status: "approved" }));

    await DonationServices.consult("161662466549");

    expect(api.get).toHaveBeenCalledWith("/donations/161662466549");
  });

  it("listMine usa o endpoint próprio", async () => {
    api.get.mockResolvedValueOnce(envelope([]));

    await DonationServices.listMine();

    expect(api.get).toHaveBeenCalledWith("/donations/mine");
  });

  it("propaga erro do PIX", async () => {
    api.post.mockRejectedValueOnce(BOOM);

    await expect(DonationServices.createPix("10,00")).rejects.toThrow("500");
  });
});

describe("BalanceServices", () => {
  it("getAnnual manda o ano", async () => {
    api.get.mockResolvedValueOnce(envelope({ totals: {} }));

    await BalanceServices.getAnnual(2026);

    expect(api.get).toHaveBeenCalledWith("/balance/annual", {
      params: { year: 2026 },
    });
  });

  it("propaga erro", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(BalanceServices.getAnnual(2026)).rejects.toThrow("500");
  });
});

describe("VideoService", () => {
  it("listAllVideos repassa paginação e filtros", async () => {
    api.get.mockResolvedValueOnce(envelope({ items: [] }));

    await VideoService.listAllVideos(2, 10, { title: "missa", memberId: "m1" });

    expect(api.get).toHaveBeenCalledWith("/videos", {
      params: { page: 2, limit: 10, title: "missa", memberId: "m1" },
    });
  });

  it("listAllVideos manda filtros indefinidos quando ausentes", async () => {
    api.get.mockResolvedValueOnce(envelope({ items: [] }));

    await VideoService.listAllVideos(1, 10);

    expect(api.get).toHaveBeenCalledWith("/videos", {
      params: { page: 1, limit: 10, title: undefined, memberId: undefined },
    });
  });

  it("createVideo e removeVideo", async () => {
    api.post.mockResolvedValueOnce({});
    api.delete.mockResolvedValueOnce({});

    await VideoService.createVideo("https://youtu.be/x", "Título");
    await VideoService.removeVideo("v1");

    expect(api.post).toHaveBeenCalledWith("/videos", {
      url: "https://youtu.be/x",
      title: "Título",
    });
    expect(api.delete).toHaveBeenCalledWith("/videos/v1");
  });

  it("propaga erro ao cadastrar", async () => {
    api.post.mockRejectedValueOnce(BOOM);

    await expect(VideoService.createVideo("url")).rejects.toThrow("500");
  });
});

describe("NotificationServices", () => {
  it("createNotification manda título e descrição", async () => {
    api.post.mockResolvedValueOnce(envelope({}));

    await NotificationServices.createNotification({
      title: "Aviso",
      description: "Detalhe",
    } as never);

    expect(api.post).toHaveBeenCalledWith("/notifications", {
      title: "Aviso",
      description: "Detalhe",
    });
  });

  it("listNotifications lê a lista", async () => {
    api.get.mockResolvedValueOnce(envelope([{ title: "a" }]));

    await expect(NotificationServices.listNotifications()).resolves.toHaveLength(
      1,
    );
  });

  it("propaga erro no envio", async () => {
    api.post.mockRejectedValueOnce(BOOM);

    await expect(
      NotificationServices.createNotification({} as never),
    ).rejects.toThrow("500");
  });
});

describe("DeviceServices", () => {
  it("register manda token, plataforma e flag de instalado", async () => {
    api.post.mockResolvedValueOnce({});

    await DeviceServices.register("tok", "ios", true);

    expect(api.post).toHaveBeenCalledWith("/devices", {
      token: "tok",
      platform: "ios",
      installed: true,
    });
  });

  it("remove escapa o token na URL", async () => {
    api.delete.mockResolvedValueOnce({});

    await DeviceServices.remove("tok/com barra");

    expect(api.delete).toHaveBeenCalledWith("/devices/tok%2Fcom%20barra");
  });
});

describe("DashboardVisibilityServices", () => {
  it("get lê a configuração do convidado", async () => {
    api.get.mockResolvedValueOnce(envelope({ videos: true }));

    await expect(DashboardVisibilityServices.get()).resolves.toEqual({
      videos: true,
    });
    expect(api.get).toHaveBeenCalledWith(
      "/dashboard-settings/guest-visibility",
    );
  });

  it("update manda o payload parcial", async () => {
    api.put.mockResolvedValueOnce({});

    await DashboardVisibilityServices.update({ videos: false });

    expect(api.put).toHaveBeenCalledWith(
      "/dashboard-settings/guest-visibility",
      { videos: false },
    );
  });

  it("propaga erro na leitura", async () => {
    api.get.mockRejectedValueOnce(BOOM);

    await expect(DashboardVisibilityServices.get()).rejects.toThrow("500");
  });
});

describe("ReadingStreakService", () => {
  it("markToday usa PATCH e desembrulha o envelope", async () => {
    api.patch.mockResolvedValueOnce(envelope({ currentStreak: 3 }));

    await expect(ReadingStreakService.markToday()).resolves.toEqual({
      currentStreak: 3,
    });
    expect(api.patch).toHaveBeenCalledWith("/members/reading-streak");
  });
});

describe("BannerService", () => {
  it("list devolve array vazio quando a API não manda data", async () => {
    api.get.mockResolvedValueOnce({ data: {} });

    await expect(BannerService.list()).resolves.toEqual([]);
  });

  it("create, update e remove batem em /campaigns", async () => {
    api.post.mockResolvedValueOnce(envelope({ id: "b1" }));
    api.put.mockResolvedValueOnce(envelope({ id: "b1" }));
    api.delete.mockResolvedValueOnce({});

    await BannerService.create({ title: "Campanha" } as never);
    await BannerService.update("b1", { title: "Campanha 2" } as never);
    await BannerService.remove("b1");

    expect(api.post).toHaveBeenCalledWith("/campaigns", {
      title: "Campanha",
    });
    expect(api.put).toHaveBeenCalledWith("/campaigns/b1", {
      title: "Campanha 2",
    });
    expect(api.delete).toHaveBeenCalledWith("/campaigns/b1");
  });

  it("saveOrder manda só os ids na ordem", async () => {
    api.put.mockResolvedValueOnce({});

    await BannerService.saveOrder([{ id: "b2" }, { id: "b1" }] as never);

    expect(api.put).toHaveBeenCalledWith("/campaigns/order", {
      ids: ["b2", "b1"],
    });
  });
});

describe("CommitmentService", () => {
  it("list devolve array vazio quando a API não manda data", async () => {
    api.get.mockResolvedValueOnce({ data: {} });

    await expect(CommitmentService.list()).resolves.toEqual([]);
  });

  it("create, update e remove batem em /commitments", async () => {
    api.post.mockResolvedValueOnce(envelope({ id: "c1" }));
    api.put.mockResolvedValueOnce(envelope({ id: "c1" }));
    api.delete.mockResolvedValueOnce({});

    await CommitmentService.create({ title: "Terço" } as never);
    await CommitmentService.update("c1", { title: "Terço 2" } as never);
    await CommitmentService.remove("c1");

    expect(api.post).toHaveBeenCalledWith("/commitments", { title: "Terço" });
    expect(api.put).toHaveBeenCalledWith("/commitments/c1", {
      title: "Terço 2",
    });
    expect(api.delete).toHaveBeenCalledWith("/commitments/c1");
  });

  it("saveOrder manda só os ids na ordem", async () => {
    api.put.mockResolvedValueOnce({});

    await CommitmentService.saveOrder([{ id: "c2" }, { id: "c1" }] as never);

    expect(api.put).toHaveBeenCalledWith("/commitments/order", {
      ids: ["c2", "c1"],
    });
  });
});
