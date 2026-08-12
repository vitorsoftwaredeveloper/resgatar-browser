import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { ToastHost } from "@/components/Toast/ToastHost";
import { ToastMessage } from "@/components/Toast";
import { dismissToast, pushToast, subscribe } from "@/components/Toast/toastStore";

function toastsNaTela() {
  return document.querySelectorAll("[data-toast]");
}

function limparToasts() {
  let atuais: { id: number }[] = [];
  const cancelar = subscribe((items) => {
    atuais = items;
  });
  cancelar();
  atuais.forEach((item) => dismissToast(item.id));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  push.mockReset();
  limparToasts();
});

afterEach(() => {
  act(() => {
    limparToasts();
  });
  vi.useRealTimers();
});

describe("toastStore", () => {
  it("entrega os itens atuais ao assinar", () => {
    const listener = vi.fn();

    const cancelar = subscribe(listener);

    expect(listener).toHaveBeenCalledWith([]);
    cancelar();
  });

  it("avisa os assinantes ao publicar e ao dispensar", () => {
    const listener = vi.fn();
    const cancelar = subscribe(listener);

    const id = pushToast("success", "Salvo", undefined, 3000);
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ id, type: "success", title: "Salvo" }),
    ]);

    dismissToast(id);
    expect(listener).toHaveBeenLastCalledWith([]);

    cancelar();
  });

  it("gera ids crescentes", () => {
    const primeiro = pushToast("success", "A", undefined, 1000);
    const segundo = pushToast("success", "B", undefined, 1000);

    expect(segundo).toBeGreaterThan(primeiro);
  });

  it("para de avisar depois de cancelar", () => {
    const listener = vi.fn();
    const cancelar = subscribe(listener);
    listener.mockReset();

    cancelar();
    pushToast("error", "Erro", undefined, 1000);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("ToastMessage", () => {
  it("publica cada tipo com sua duração", () => {
    const listener = vi.fn();
    const cancelar = subscribe(listener);

    ToastMessage.success("Salvo");
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ type: "success", duration: 3000 }),
    ]);

    ToastMessage.error("Erro", "detalhe");
    expect(listener).toHaveBeenLastCalledWith([
      expect.anything(),
      expect.objectContaining({
        type: "error",
        duration: 4000,
        message: "detalhe",
      }),
    ]);

    ToastMessage.warning("Atenção");
    expect(listener).toHaveBeenLastCalledWith([
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ type: "warning", duration: 3500 }),
    ]);

    ToastMessage.notification("Aviso", "corpo", "/dashboard");
    expect(listener).toHaveBeenLastCalledWith([
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        type: "notification",
        duration: 6000,
        url: "/dashboard",
      }),
    ]);

    cancelar();
  });
});

describe("ToastHost", () => {
  it("não renderiza nada sem toasts", () => {
    const { container } = render(<ToastHost />);

    expect(container.firstChild).toBeNull();
  });

  it("mostra título e mensagem do toast publicado", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.success("Salvo", "Tudo certo");
    });

    expect(screen.getByText("Salvo")).toBeTruthy();
    expect(screen.getByText("Tudo certo")).toBeTruthy();
    expect(toastsNaTela()[0].getAttribute("data-toast")).toBe("success");
  });

  it("dispensa sozinho quando a duração expira", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.success("Salvo");
    });
    expect(toastsNaTela()).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(toastsNaTela()).toHaveLength(0);
  });

  it("empilha vários toasts ao mesmo tempo", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.success("Um");
      ToastMessage.error("Dois");
    });

    expect(toastsNaTela()).toHaveLength(2);
  });

  it("navega ao clicar na notificação com url", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.notification("Pagamento", "confirmado", "/bills");
    });

    fireEvent.click(screen.getByRole("link"));

    expect(push).toHaveBeenCalledWith("/bills");
    expect(toastsNaTela()).toHaveLength(0);
  });

  it("navega pelo teclado na notificação", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.notification("Pagamento", "confirmado", "/bills");
    });

    fireEvent.keyDown(screen.getByRole("link"), { key: "Enter" });

    expect(push).toHaveBeenCalledWith("/bills");
  });

  it("notificação sem url não vira link", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.notification("Aviso", "sem destino");
    });

    expect(screen.queryByRole("link")).toBeNull();
    expect(toastsNaTela()[0].getAttribute("data-toast")).toBe("notification");
  });

  it("fecha a notificação pelo botão sem navegar", () => {
    render(<ToastHost />);

    act(() => {
      ToastMessage.notification("Pagamento", "confirmado", "/bills");
    });

    fireEvent.click(screen.getByLabelText("Fechar notificação"));

    expect(push).not.toHaveBeenCalled();
    expect(toastsNaTela()).toHaveLength(0);
  });
});
