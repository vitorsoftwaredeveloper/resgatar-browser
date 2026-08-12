import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { criar, atualizar, remover, escolherImagem, toastSuccess, toastError } =
  vi.hoisted(() => ({
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
    escolherImagem: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }));

vi.mock("@/services/BannerService", () => ({
  BannerService: { create: criar, update: atualizar, remove: remover },
}));

vi.mock("@/hooks/useImagePicker", () => ({
  useImagePicker: () => ({
    loading: false,
    pickFromLibrary: escolherImagem,
    takePhoto: vi.fn(),
  }),
}));

vi.mock("@/components/Toast", () => ({
  ToastMessage: { success: toastSuccess, error: toastError, warning: vi.fn() },
}));

import { ModalBannerForm } from "@/components/BannerCarousel/ModalBannerForm";

const BANNER = {
  id: "b1",
  title: "Campanha do Dízimo",
  banner: "data:image/jpeg;base64,zzz",
  action: { type: "none" as const, value: "" },
  active: true,
  order: 0,
};

function campo(label: string) {
  return document.querySelector(
    `[data-field="${label}"] input`,
  ) as HTMLInputElement;
}

function montar(props: Partial<Parameters<typeof ModalBannerForm>[0]> = {}) {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(
    <ModalBannerForm
      visible
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />,
  );
  return { onSuccess, onClose };
}

function selecionarImagem() {
  fireEvent.click(screen.getByLabelText("Selecionar imagem da galeria"));
}

beforeEach(() => {
  criar.mockReset().mockResolvedValue({});
  atualizar.mockReset().mockResolvedValue({});
  remover.mockReset().mockResolvedValue(undefined);
  escolherImagem.mockReset().mockResolvedValue("base64-curto");
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ModalBannerForm · criação", () => {
  it("abre com o título de novo banner", () => {
    montar();

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Novo banner",
    );
    expect(screen.getByText("Publicar")).toBeTruthy();
  });

  it("exige imagem e título", () => {
    montar();

    fireEvent.click(screen.getByText("Publicar"));

    expect(screen.getByText("Selecione uma imagem para o banner.")).toBeTruthy();
    expect(screen.getByText("O título é obrigatório.")).toBeTruthy();
    expect(criar).not.toHaveBeenCalled();
  });

  it("limpa o erro do título ao digitar", () => {
    montar();

    fireEvent.click(screen.getByText("Publicar"));
    fireEvent.change(campo("Título *"), { target: { value: "Campanha" } });

    expect(screen.queryByText("O título é obrigatório.")).toBeNull();
  });

  it("aceita a imagem escolhida da galeria", async () => {
    montar();

    selecionarImagem();

    await waitFor(() => {
      expect(escolherImagem).toHaveBeenCalled();
    });
    expect(
      screen.queryByText("Selecione uma imagem para o banner."),
    ).toBeNull();
  });

  it("recusa imagem acima do limite do backend", async () => {
    escolherImagem.mockResolvedValueOnce("x".repeat(800_000));
    montar();

    selecionarImagem();

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Imagem muito grande",
        "Escolha uma imagem menor ou reduza a qualidade. Limite: 500 KB.",
      );
    });
  });

  it("ignora o cancelamento da escolha de imagem", async () => {
    escolherImagem.mockResolvedValueOnce(null);
    montar();

    selecionarImagem();

    await waitFor(() => {
      expect(escolherImagem).toHaveBeenCalled();
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("publica um banner sem ação", async () => {
    const { onSuccess } = montar();

    selecionarImagem();
    await waitFor(() => expect(escolherImagem).toHaveBeenCalled());
    fireEvent.change(campo("Título *"), { target: { value: "Campanha" } });

    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith({
        banner: "data:image/jpeg;base64,base64-curto",
        title: "Campanha",
        action: { type: "none", value: "" },
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Publicado",
      "Banner adicionado ao carrossel.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("exige URL quando a ação é externa", async () => {
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("URL externa"));
    fireEvent.click(screen.getByText("Salvar"));

    expect(screen.getByText("Informe a URL de destino.")).toBeTruthy();
  });

  it("recusa URL sem http", async () => {
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("URL externa"));
    fireEvent.change(campo("URL de destino"), {
      target: { value: "resgatar.com" },
    });
    fireEvent.click(screen.getByText("Salvar"));

    expect(
      screen.getByText("URL inválida (deve começar com http:// ou https://)."),
    ).toBeTruthy();
  });

  it("aceita URL externa válida", async () => {
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("URL externa"));
    fireEvent.change(campo("URL de destino"), {
      target: { value: "https://resgatar.com/campanha" },
    });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith(
        "b1",
        expect.objectContaining({
          action: {
            type: "external",
            value: "https://resgatar.com/campanha",
          },
        }),
      );
    });
  });

  it("exige a tela quando a ação é interna", () => {
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("Tela do app"));
    fireEvent.click(screen.getByText("Salvar"));

    expect(screen.getByText("Selecione uma tela de destino.")).toBeTruthy();
  });

  it("aceita a tela interna escolhida", async () => {
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("Tela do app"));
    fireEvent.click(screen.getByText("Leituras"));
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith(
        "b1",
        expect.objectContaining({
          action: { type: "internal", value: "Readings" },
        }),
      );
    });
  });

  it("avisa quando a API recusa a publicação", async () => {
    criar.mockRejectedValueOnce({
      response: { data: { message: "Campanha duplicada" } },
    });
    montar();

    selecionarImagem();
    await waitFor(() => expect(escolherImagem).toHaveBeenCalled());
    fireEvent.change(campo("Título *"), { target: { value: "Campanha" } });
    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Erro", "Campanha duplicada");
    });
  });
});

describe("ModalBannerForm · edição", () => {
  it("pré-preenche título e imagem", () => {
    montar({ banner: BANNER });

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Editar banner",
    );
    expect(campo("Título *").value).toBe("Campanha do Dízimo");
  });

  it("salva as alterações pelo id", async () => {
    const { onSuccess } = montar({ banner: BANNER });

    fireEvent.change(campo("Título *"), { target: { value: "Nova campanha" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith(
        "b1",
        expect.objectContaining({ title: "Nova campanha" }),
      );
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Salvo",
      "Banner atualizado com sucesso.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("remove o banner confirmado", async () => {
    const { onSuccess } = montar({ banner: BANNER });

    fireEvent.click(screen.getByText("Remover"));
    fireEvent.click(screen.getByText("remover"));

    await waitFor(() => {
      expect(remover).toHaveBeenCalledWith("b1");
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Removido",
      "Banner excluído do carrossel.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("avisa quando a remoção falha", async () => {
    remover.mockRejectedValueOnce(new Error("500"));
    montar({ banner: BANNER });

    fireEvent.click(screen.getByText("Remover"));
    fireEvent.click(screen.getByText("remover"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Erro",
        "Não foi possível remover o banner.",
      );
    });
  });
});
