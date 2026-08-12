import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/context/AuthContext", () => ({ useAuth: useAuthMock }));

import { useClientValue } from "@/hooks/useClientValue";
import { useMaskedField } from "@/hooks/useMaskedField";
import { usePermissions } from "@/hooks/usePermissions";
import { maskPhoneBR } from "@/utils/mask";

afterEach(() => {
  vi.clearAllMocks();
});

describe("usePermissions", () => {
  it("reconhece o administrador", () => {
    useAuthMock.mockReturnValue({ member: { role: "admin" } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      role: "admin",
      isAdmin: true,
      isInternal: true,
      isGuest: false,
    });
  });

  it("reconhece o membro interno", () => {
    useAuthMock.mockReturnValue({ member: { role: "user" } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      role: "user",
      isAdmin: false,
      isInternal: true,
      isGuest: false,
    });
  });

  it("reconhece o convidado", () => {
    useAuthMock.mockReturnValue({ member: { role: "guest" } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      role: "guest",
      isAdmin: false,
      isInternal: false,
      isGuest: true,
    });
  });

  it("trata membro sem papel como convidado", () => {
    useAuthMock.mockReturnValue({ member: { role: undefined } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.role).toBe("guest");
    expect(result.current.isGuest).toBe(true);
  });

  it("trata sessão ausente como convidado", () => {
    useAuthMock.mockReturnValue({ member: null });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isGuest).toBe(true);
    expect(result.current.isInternal).toBe(false);
  });
});

describe("useMaskedField", () => {
  function formFalso(valorAtual: string) {
    const setValue = vi.fn();
    const watch = vi.fn().mockReturnValue(valorAtual);
    return { setValue, watch, form: { watch, setValue } };
  }

  it("lê o valor atual do formulário", () => {
    const { form } = formFalso("(11) 99999-8888");

    const { result } = renderHook(() =>
      useMaskedField("phoneNumber" as never, maskPhoneBR, form as never),
    );

    expect(result.current.value).toBe("(11) 99999-8888");
  });

  it("devolve string vazia quando o campo está indefinido", () => {
    const { form } = formFalso(undefined as never);

    const { result } = renderHook(() =>
      useMaskedField("phoneNumber" as never, maskPhoneBR, form as never),
    );

    expect(result.current.value).toBe("");
  });

  it("aplica a máscara ao digitar e marca o campo como sujo", () => {
    const { form, setValue } = formFalso("");

    const { result } = renderHook(() =>
      useMaskedField("phoneNumber" as never, maskPhoneBR, form as never),
    );

    act(() => {
      result.current.onChangeText("11999998888");
    });

    expect(setValue).toHaveBeenCalledWith("phoneNumber", "(11) 99999-8888", {
      shouldValidate: true,
      shouldDirty: true,
    });
  });

  it("usa a máscara identidade sem alterar o texto", () => {
    const { form, setValue } = formFalso("");
    const identidade = (v: string) => v;

    const { result } = renderHook(() =>
      useMaskedField("firstName" as never, identidade, form as never),
    );

    act(() => {
      result.current.onChangeText("Vitor");
    });

    expect(setValue).toHaveBeenCalledWith(
      "firstName",
      "Vitor",
      expect.anything(),
    );
  });
});

describe("useClientValue", () => {
  it("devolve o valor lido no cliente", () => {
    const { result } = renderHook(() => useClientValue(() => "cliente", "servidor"));

    expect(result.current).toBe("cliente");
  });

  it("chama o leitor a cada render sem assinar mudanças", () => {
    const read = vi.fn().mockReturnValue(42);

    const { rerender, result } = renderHook(() => useClientValue(read, 0));

    expect(result.current).toBe(42);
    rerender();
    expect(result.current).toBe(42);
    expect(read).toHaveBeenCalled();
  });

  it("aceita valores booleanos", () => {
    const { result } = renderHook(() => useClientValue(() => true, false));

    expect(result.current).toBe(true);
  });
});
