import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchAuthSession } = vi.hoisted(() => ({ fetchAuthSession: vi.fn() }));

vi.mock("aws-amplify/auth", () => ({ fetchAuthSession }));

import { api, publicApi } from "@/services/api";

type Interceptor = (config: {
  headers: Record<string, string>;
}) => Promise<{ headers: Record<string, string> }>;

function interceptorDeRequisicao(): Interceptor {
  const handlers = (
    api.interceptors.request as unknown as {
      handlers: { fulfilled: Interceptor }[];
    }
  ).handlers;

  return handlers[0].fulfilled;
}

function sessaoCom(token?: string) {
  return {
    tokens: token ? { idToken: { toString: () => token } } : undefined,
  };
}

beforeEach(() => {
  fetchAuthSession.mockReset();
});

describe("instâncias axios", () => {
  it("api e publicApi apontam para a mesma base", () => {
    expect(api.defaults.baseURL).toBe(publicApi.defaults.baseURL);
  });

  it("publicApi tem timeout próprio", () => {
    expect(publicApi.defaults.timeout).toBe(15000);
  });

  it("api registra um interceptor de requisição", () => {
    expect(typeof interceptorDeRequisicao()).toBe("function");
  });
});

describe("interceptor de autenticação", () => {
  it("injeta o token do Cognito no header", async () => {
    fetchAuthSession.mockResolvedValueOnce(sessaoCom("jwt-123"));

    const config = await interceptorDeRequisicao()({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer jwt-123");
  });

  it("não injeta header quando não há sessão", async () => {
    fetchAuthSession.mockResolvedValueOnce(sessaoCom());

    const config = await interceptorDeRequisicao()({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("preserva os headers já definidos", async () => {
    fetchAuthSession.mockResolvedValueOnce(sessaoCom("jwt-123"));

    const config = await interceptorDeRequisicao()({
      headers: { "Content-Type": "application/json" },
    });

    expect(config.headers["Content-Type"]).toBe("application/json");
    expect(config.headers.Authorization).toBe("Bearer jwt-123");
  });
});
