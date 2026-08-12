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

import { BannerService } from "@/services/BannerService";
import { ChargeServices } from "@/services/ChargeService";
import { CommitmentService } from "@/services/CommitmentService";
import { DashboardVisibilityServices } from "@/services/DashboardVisibilityService";
import { DonationServices } from "@/services/DonationService";
import { ExpenseServices } from "@/services/ExpenseService";
import { MemberServices } from "@/services/MemberService";
import { NotificationServices } from "@/services/NotificationService";
import { VideoService } from "@/services/VideoService";

const BOOM = new Error("500");

type Chamada = [string, () => Promise<unknown>, "get" | "post" | "put" | "delete"];

const CHAMADAS: Chamada[] = [
  ["MemberServices.editMember", () => MemberServices.editMember({ _id: "1" } as never), "put"],
  ["MemberServices.getMemberById", () => MemberServices.getMemberById("1"), "get"],
  ["MemberServices.listMembers", () => MemberServices.listMembers(), "get"],
  ["MemberServices.listBirthdayMembers", () => MemberServices.listBirthdayMembers(), "get"],
  ["MemberServices.removeMember", () => MemberServices.removeMember("1"), "delete"],
  ["MemberServices.updatePhoto", () => MemberServices.updatePhoto("1", "foto"), "put"],
  ["MemberServices.updatePassword", () => MemberServices.updatePassword("1", "s"), "put"],
  ["ChargeServices.registerCashPayment", () => ChargeServices.registerCashPayment("1", 0), "post"],
  ["ChargeServices.getSummary", () => ChargeServices.getSummary(2026, 6), "get"],
  ["ChargeServices.getAnnualSummary", () => ChargeServices.getAnnualSummary(2026), "get"],
  ["ExpenseServices.create", () => ExpenseServices.create({} as never), "post"],
  ["ExpenseServices.list", () => ExpenseServices.list(2026, 6), "get"],
  ["ExpenseServices.getSummary", () => ExpenseServices.getSummary(2026, 6), "get"],
  ["ExpenseServices.update", () => ExpenseServices.update("1", {} as never), "put"],
  ["DonationServices.registerCash", () => DonationServices.registerCash("10,00"), "post"],
  ["DonationServices.consult", () => DonationServices.consult("1"), "get"],
  ["DonationServices.listMine", () => DonationServices.listMine(), "get"],
  ["VideoService.listAllVideos", () => VideoService.listAllVideos(1, 10), "get"],
  ["VideoService.removeVideo", () => VideoService.removeVideo("1"), "delete"],
  ["NotificationServices.listNotifications", () => NotificationServices.listNotifications(), "get"],
  ["DashboardVisibilityServices.update", () => DashboardVisibilityServices.update({}), "put"],
  ["BannerService.list", () => BannerService.list(), "get"],
  ["BannerService.create", () => BannerService.create({} as never), "post"],
  ["BannerService.update", () => BannerService.update("1", {} as never), "put"],
  ["BannerService.saveOrder", () => BannerService.saveOrder([]), "put"],
  ["BannerService.remove", () => BannerService.remove("1"), "delete"],
  ["CommitmentService.list", () => CommitmentService.list(), "get"],
  ["CommitmentService.create", () => CommitmentService.create({} as never), "post"],
  ["CommitmentService.update", () => CommitmentService.update("1", {} as never), "put"],
  ["CommitmentService.saveOrder", () => CommitmentService.saveOrder([]), "put"],
  ["CommitmentService.remove", () => CommitmentService.remove("1"), "delete"],
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("todo service propaga o erro da API", () => {
  CHAMADAS.forEach(([nome, chamar, verbo]) => {
    it(`${nome} rejeita e registra no console`, async () => {
      api[verbo].mockRejectedValueOnce(BOOM);

      await expect(chamar()).rejects.toThrow("500");
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("MemberServices.register rejeita quando a api pública falha", async () => {
    publicApi.post.mockRejectedValueOnce(BOOM);

    await expect(MemberServices.register({} as never)).rejects.toThrow("500");
    expect(console.error).toHaveBeenCalled();
  });
});
