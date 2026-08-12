import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { criar, atualizar, remover, toastSuccess, toastError } = vi.hoisted(
  () => ({
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
);

vi.mock("@/services/CommitmentService", () => ({
  CommitmentService: { create: criar, update: atualizar, remove: remover },
}));

vi.mock("@/components/Toast", () => ({
  ToastMessage: {
    success: toastSuccess,
    error: toastError,
    warning: vi.fn(),
  },
}));

import { ModalCommitmentForm } from "@/components/NoticesCard/NoticeBoardModal/ModalCommitmentForm";

const COMPROMISSO = {
  id: "c1",
  title: "Terço",
  time: "19h30",
  location: "Igreja Matriz",
  repeat: "weekly" as const,
  weekday: 3,
  ordinal: null,
  day: "Quarta",
  date: null,
};

function campo(label: string) {
  return document.querySelector(`[data-field="${label}"] input`) as HTMLInputElement;
}

function preencherBasico() {
  fireEvent.change(campo("Nome"), { target: { value: "Terço" } });
  fireEvent.change(campo("Local"), { target: { value: "Igreja Matriz" } });

  const seletores = document.querySelectorAll("[data-select]");
  fireEvent.click(seletores[0]);
  fireEvent.click(screen.getByText("19h"));
}

function escolherDiaDaSemana() {
  const seletorDia = screen.getByText("Selecione o dia");
  fireEvent.click(seletorDia);
  fireEvent.click(screen.getByText("Quarta"));
}

function montar(props: Partial<Parameters<typeof ModalCommitmentForm>[0]> = {}) {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  render(
    <ModalCommitmentForm
      visible
      onClose={onClose}
      onSuccess={onSuccess}
      {...props}
    />,
  );
  return { onSuccess, onClose };
}

beforeEach(() => {
  criar.mockReset().mockResolvedValue({});
  atualizar.mockReset().mockResolvedValue({});
  remover.mockReset().mockResolvedValue(undefined);
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ModalCommitmentForm · criação", () => {
  it("abre com o título de novo compromisso", () => {
    montar();

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Novo compromisso",
    );
    expect(screen.getByText("Publicar")).toBeTruthy();
  });

  it("exige nome, horário e local", () => {
    montar();

    fireEvent.click(screen.getByText("Publicar"));

    expect(screen.getByText("Informe o nome do compromisso")).toBeTruthy();
    expect(screen.getByText("Informe o horário")).toBeTruthy();
    expect(screen.getByText("Informe o local")).toBeTruthy();
    expect(criar).not.toHaveBeenCalled();
  });

  it("limpa o erro do campo ao digitar", () => {
    montar();

    fireEvent.click(screen.getByText("Publicar"));
    expect(screen.getByText("Informe o nome do compromisso")).toBeTruthy();

    fireEvent.change(campo("Nome"), { target: { value: "Terço" } });

    expect(screen.queryByText("Informe o nome do compromisso")).toBeNull();
  });

  it("exige o dia da semana na recorrência semanal", () => {
    montar();
    preencherBasico();

    fireEvent.click(screen.getByText("Publicar"));

    expect(screen.getByText("Escolha o dia")).toBeTruthy();
    expect(criar).not.toHaveBeenCalled();
  });

  it("publica um compromisso semanal", async () => {
    const { onSuccess } = montar();
    preencherBasico();
    escolherDiaDaSemana();

    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith({
        title: "Terço",
        time: "19h",
        location: "Igreja Matriz",
        repeat: "weekly",
        weekday: 3,
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Compromisso publicado!",
      "Ele já aparece no mural.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("exige a ocorrência na recorrência mensal", () => {
    montar();
    preencherBasico();
    fireEvent.click(screen.getByText("Mensal"));
    escolherDiaDaSemana();

    fireEvent.click(screen.getByText("Publicar"));

    expect(screen.getByText("Escolha qual ocorrência")).toBeTruthy();
  });

  it("publica um compromisso mensal com ordinal", async () => {
    montar();
    preencherBasico();
    fireEvent.click(screen.getByText("Mensal"));
    escolherDiaDaSemana();

    fireEvent.click(screen.getByText("2º"));

    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ repeat: "monthly", weekday: 3, ordinal: 2 }),
      );
    });
  });

  it("recusa data inválida no evento único", () => {
    montar();
    preencherBasico();
    fireEvent.click(screen.getByText("Data"));

    fireEvent.change(campo("Data"), { target: { value: "31/02/2026" } });
    fireEvent.click(screen.getByText("Publicar"));

    expect(screen.getByText("Data inválida (use DD/MM/AAAA)")).toBeTruthy();
    expect(criar).not.toHaveBeenCalled();
  });

  it("publica um evento único com a data em ISO", async () => {
    montar();
    preencherBasico();
    fireEvent.click(screen.getByText("Data"));

    fireEvent.change(campo("Data"), { target: { value: "03062026" } });
    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ repeat: "once", date: "2026-06-03" }),
      );
    });
  });

  it("avisa quando a API recusa a criação", async () => {
    criar.mockRejectedValueOnce({
      response: { data: { message: "Limite atingido" } },
    });
    const { onSuccess } = montar();
    preencherBasico();
    escolherDiaDaSemana();

    fireEvent.click(screen.getByText("Publicar"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Erro", "Limite atingido");
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("ModalCommitmentForm · edição", () => {
  it("pré-preenche os campos do compromisso", () => {
    montar({ commitment: COMPROMISSO });

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Editar compromisso",
    );
    expect(campo("Nome").value).toBe("Terço");
    expect(campo("Local").value).toBe("Igreja Matriz");
    expect(screen.getByText("Salvar")).toBeTruthy();
  });

  it("pré-preenche a data no formato brasileiro", () => {
    montar({
      commitment: {
        ...COMPROMISSO,
        repeat: "once" as const,
        date: "2026-06-03T12:00:00",
      },
    });

    expect(campo("Data").value).toBe("03/06/2026");
  });

  it("salva as alterações pelo id", async () => {
    const { onSuccess } = montar({ commitment: COMPROMISSO });

    fireEvent.change(campo("Nome"), { target: { value: "Terço mariano" } });
    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({ title: "Terço mariano" }),
      );
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Compromisso atualizado!",
      "As mudanças já estão no mural.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("pede confirmação antes de excluir e permite cancelar", () => {
    montar({ commitment: COMPROMISSO });

    fireEvent.click(screen.getByText("Excluir"));
    expect(screen.getByText("Excluir compromisso?")).toBeTruthy();

    fireEvent.click(screen.getByText("cancelar"));

    expect(remover).not.toHaveBeenCalled();
  });

  it("exclui o compromisso confirmado", async () => {
    const { onSuccess } = montar({ commitment: COMPROMISSO });

    fireEvent.click(screen.getByText("Excluir"));
    fireEvent.click(screen.getByText("excluir"));

    await waitFor(() => {
      expect(remover).toHaveBeenCalledWith("c1");
    });
    expect(toastSuccess).toHaveBeenCalledWith(
      "Compromisso removido",
      "Ele saiu do mural.",
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("avisa quando a exclusão falha", async () => {
    remover.mockRejectedValueOnce(new Error("500"));
    montar({ commitment: COMPROMISSO });

    fireEvent.click(screen.getByText("Excluir"));
    fireEvent.click(screen.getByText("excluir"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Erro",
        "Falha ao remover compromisso.",
      );
    });
  });
});
