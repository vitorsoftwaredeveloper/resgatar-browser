import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pickFromLibrary, takePhoto } = vi.hoisted(() => ({
  pickFromLibrary: vi.fn(),
  takePhoto: vi.fn(),
}));

vi.mock("@/hooks/useImagePicker", () => ({
  useImagePicker: () => ({ loading: false, pickFromLibrary, takePhoto }),
}));

import { ModalBase } from "@/components/ModalBase";
import { ModalPhotoPicker } from "@/components/ModalPhotoPicker";

beforeEach(() => {
  pickFromLibrary.mockReset().mockResolvedValue("base64-galeria");
  takePhoto.mockReset().mockResolvedValue("base64-camera");
});

afterEach(() => {
  document.body.style.overflow = "";
});

describe("ModalBase", () => {
  it("não renderiza quando invisível", () => {
    render(
      <ModalBase visible={false} title="Comprovante" onClose={vi.fn()}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("expõe título e conteúdo", () => {
    render(
      <ModalBase visible title="Comprovante" onClose={vi.fn()}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Comprovante",
    );
    expect(screen.getByText("conteúdo")).toBeTruthy();
  });

  it("fecha pelo botão", () => {
    const onClose = vi.fn();
    render(
      <ModalBase visible title="Comprovante" onClose={onClose}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    fireEvent.click(screen.getByLabelText("Fechar"));

    expect(onClose).toHaveBeenCalled();
  });

  it("fecha pela tecla Esc", () => {
    const onClose = vi.fn();
    render(
      <ModalBase visible title="Comprovante" onClose={onClose}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("ignora outras teclas", () => {
    const onClose = vi.fn();
    render(
      <ModalBase visible title="Comprovante" onClose={onClose}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha ao clicar no backdrop, não no conteúdo", () => {
    const onClose = vi.fn();
    render(
      <ModalBase visible title="Comprovante" onClose={onClose}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    fireEvent.click(screen.getByText("conteúdo"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("trava e devolve o scroll do body", () => {
    const { unmount } = render(
      <ModalBase visible title="Comprovante" onClose={vi.fn()}>
        <p>conteúdo</p>
      </ModalBase>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("ModalPhotoPicker", () => {
  function montar(props: Partial<Parameters<typeof ModalPhotoPicker>[0]> = {}) {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalPhotoPicker
        visible
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />,
    );
    return { onConfirm, onClose };
  }

  it("avisa quando ainda não há foto", () => {
    montar();

    expect(screen.getByText("Você ainda não tem foto")).toBeTruthy();
  });

  it("reconhece a foto atual", () => {
    montar({ currentPhoto: "base64-atual" });

    expect(screen.getByText("Sua foto de perfil")).toBeTruthy();
  });

  it("mantém o confirmar desabilitado sem mudanças", () => {
    montar({ currentPhoto: "base64-atual", confirmLabel: "Salvar" });

    expect(
      screen.getByRole("button", { name: /Salvar/ }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("escolhe da galeria e libera o confirmar", async () => {
    const { onConfirm } = montar();

    fireEvent.click(screen.getByText("Escolher da galeria"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Salvar/ }).hasAttribute("disabled"),
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("base64-galeria");
    });
  });

  it("tira foto pela câmera", async () => {
    const { onConfirm } = montar();

    fireEvent.click(screen.getByText("Tirar foto"));

    await waitFor(() => {
      expect(takePhoto).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("base64-camera");
    });
  });

  it("não confirma quando o usuário cancela a escolha", async () => {
    pickFromLibrary.mockResolvedValueOnce(null);
    montar();

    fireEvent.click(screen.getByText("Escolher da galeria"));

    await waitFor(() => {
      expect(pickFromLibrary).toHaveBeenCalled();
    });

    expect(
      screen.getByRole("button", { name: /Salvar/ }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("remove a foto atual marcando string vazia", async () => {
    const { onConfirm } = montar({ currentPhoto: "base64-atual" });

    fireEvent.click(screen.getByText("Remover foto atual"));

    await waitFor(() => {
      expect(screen.getByText("Você ainda não tem foto")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("");
    });
  });

  it("usa título e rótulo customizados", () => {
    montar({ title: "Trocar foto", confirmLabel: "Atualizar" });

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Trocar foto",
    );
    expect(screen.getByRole("button", { name: /Atualizar/ })).toBeTruthy();
  });

  it("não deixa confirmar duas vezes enquanto salva", async () => {
    let liberar!: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>((resolve) => (liberar = resolve)),
    );
    render(<ModalPhotoPicker visible onClose={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText("Escolher da galeria"));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Salvar/ }).hasAttribute("disabled"),
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() => {
      expect(screen.getByLabelText("Carregando")).toBeTruthy();
    });

    await act(async () => {
      liberar();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
