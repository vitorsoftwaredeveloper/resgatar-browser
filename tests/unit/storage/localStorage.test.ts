import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOnboardingSeen,
  getLiturgyCache,
  getOnboardingSeen,
  getStoredMember,
  removeMember,
  saveMember,
  setLiturgyCache,
  setOnboardingSeen,
} from "@/storage/localStorage";

const MEMBRO = {
  _id: "m1",
  email: "membro@resgatar.test",
  firstName: "E2eMembro",
} as never;

beforeEach(() => {
  window.localStorage.clear();
});

describe("membro autenticado", () => {
  it("grava e lê o membro", async () => {
    await saveMember(MEMBRO);

    await expect(getStoredMember()).resolves.toEqual(MEMBRO);
  });

  it("devolve null quando não há membro gravado", async () => {
    await expect(getStoredMember()).resolves.toBeNull();
  });

  it("devolve null quando o JSON está corrompido", async () => {
    window.localStorage.setItem("@auth:member", "{isso não é json");

    await expect(getStoredMember()).resolves.toBeNull();
  });

  it("remove o membro", async () => {
    await saveMember(MEMBRO);
    await removeMember();

    await expect(getStoredMember()).resolves.toBeNull();
  });
});

describe("onboarding", () => {
  it("começa como não visto", async () => {
    await expect(getOnboardingSeen("m1")).resolves.toBe(false);
  });

  it("marca como visto por membro", async () => {
    await setOnboardingSeen("m1");

    await expect(getOnboardingSeen("m1")).resolves.toBe(true);
    await expect(getOnboardingSeen("m2")).resolves.toBe(false);
  });

  it("limpa a marcação", async () => {
    await setOnboardingSeen("m1");
    await clearOnboardingSeen("m1");

    await expect(getOnboardingSeen("m1")).resolves.toBe(false);
  });
});

describe("cache da liturgia", () => {
  it("grava e lê por data", async () => {
    await setLiturgyCache("2026-06-04", { liturgia: "Tempo Comum" });

    await expect(getLiturgyCache("2026-06-04")).resolves.toEqual({
      liturgia: "Tempo Comum",
    });
  });

  it("não mistura datas diferentes", async () => {
    await setLiturgyCache("2026-06-04", { liturgia: "A" });

    await expect(getLiturgyCache("2026-06-05")).resolves.toBeNull();
  });

  it("devolve null quando o cache está corrompido", async () => {
    window.localStorage.setItem("@liturgy:2026-06-04", "{quebrado");

    await expect(getLiturgyCache("2026-06-04")).resolves.toBeNull();
  });
});
