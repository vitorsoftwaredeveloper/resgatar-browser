import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replace, isDesktopRef } = vi.hoisted(() => ({
  replace: vi.fn(),
  isDesktopRef: { current: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => ({ isDesktop: isDesktopRef.current }),
}));

import { useAdminHubRedirect } from "@/hooks/useAdminHubRedirect";

beforeEach(() => {
  replace.mockReset();
  isDesktopRef.current = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAdminHubRedirect", () => {
  it("não redireciona no mobile", () => {
    const { result } = renderHook(() => useAdminHubRedirect("expenses"));

    expect(result.current).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("manda para o hub no desktop", () => {
    isDesktopRef.current = true;

    const { result } = renderHook(() => useAdminHubRedirect("expenses"));

    expect(result.current).toBe(true);
    expect(replace).toHaveBeenCalledWith("/settings?open=expenses");
  });

  it("usa a chave recebida na query", () => {
    isDesktopRef.current = true;

    renderHook(() => useAdminHubRedirect("balanco-anual"));

    expect(replace).toHaveBeenCalledWith("/settings?open=balanco-anual");
  });
});
