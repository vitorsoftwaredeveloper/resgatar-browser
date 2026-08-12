import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  criar,
  atualizar,
  enviarComprovante,
  verComprovante,
  escolherComprovante,
  toastSuccess,
  toastError,
} = vi.hoisted(() => ({
  criar: vi.fn(),
  atualizar: vi.fn(),
  enviarComprovante: vi.fn(),
  verComprovante: vi.fn(),
  escolherComprovante: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/ExpenseService", () => ({
  ExpenseServices: {
    create: criar,
    update: atualizar,
    uploadReceipt: enviarComprovante,
    getReceiptViewUrl: verComprovante,
  },
}));

vi.mock("@/hooks/useReceiptPicker", () => ({
  useReceiptPicker: () => ({
    loading: false,
    pickFromLibrary: escolherComprovante,
    takePhoto: vi.fn(),
  }),
}));

vi.mock("@/components/Toast", () => ({
  ToastMessage: { success: toastSuccess, error: toastError, warning: vi.fn() },
}));

import { ModalExpenseForm } from "@/components/ModalExpenseForm";

const DESPESA = {
  _id: "d1",
  description: "Conta de luz",
  amount: "250,50",
  category: "utilities" as const,
  referenceMonth: 5,
  referenceYear: 2026,
  date: new Date(2026, 5, 10).getTime(),
  note: "vencimento dia 10",
  adminId: "a1",
};

const COMPROVANTE = {
  file: new File(["x"], "nota.png", { type: "image/png" }),
  previewUrl: "blob:preview",
  contentType: "image/png",
  fileName: "nota.png",
};

function campo(label: string) {
  return document.querySelector(
    `[data-field="${label}"] input`,
  ) as HTMLInputElement;
}

function montar(props: Partial<Parameters<typeof ModalExpenseForm>[0]> = {}) {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(
    <ModalExpenseForm
      visible
      onClose={onClose}
      onSaved={onSaved}
      referenceMonth={5}
      referenceYear={2026}
      {...props}
    />,
  );
  return { onSaved, onClose };
}

function preencher() {
  fireEvent.change(campo("Descrição"), { target: { value: "Conta de luz" } });
  fireEvent.change(campo("Valor"), { target: { value: "25050" } });
  fireEvent.click(screen.getByText("Contas/Utilidades"));
}

beforeEach(() => {
  criar.mockReset().mockResolvedValue("d1");
  atualizar.mockReset().mockResolvedValue(undefined);
  enviarComprovante.mockReset().mockResolvedValue("chave-s3");
  verComprovante.mockReset().mockResolvedValue("https://s3/ver");
  escolherComprovante.mockReset().mockResolvedValue(COMPROVANTE);
  toastSuccess.mockReset();
  toastError.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ModalExpenseForm · criação", () => {
  it("abre como nova despesa com a data de hoje preenchida", () => {
    montar();

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Nova despesa",
    );
    expect(campo("Data").value).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("exige descrição, valor e categoria", async () => {
    montar();

    fireEvent.click(screen.getByText("Cadastrar despesa"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Campos inválidos",
        "Revise os campos destacados.",
      );
    });
    expect(criar).not.toHaveBeenCalled();
  });

  it("aplica a máscara de moeda no valor", () => {
    montar();

    fireEvent.change(campo("Valor"), { target: { value: "25050" } });

    expect(campo("Valor").value).toMatch(/250,50$/);
  });

  it("cadastra a despesa com mês e ano de referência", async () => {
    const { onSaved } = montar();
    preencher();

    fireEvent.click(screen.getByText("Cadastrar despesa"));

    await waitFor(() => {
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Conta de luz",
          category: "utilities",
          referenceMonth: 5,
          referenceYear: 2026,
        }),
      );
    });
    expect(toastSuccess).toHaveBeenCalledWith("Despesa cadastrada");
    expect(onSaved).toHaveBeenCalled();
  });

  it("avisa quando a API recusa o cadastro", async () => {
    criar.mockRejectedValueOnce(new Error("500"));
    montar();
    preencher();

    fireEvent.click(screen.getByText("Cadastrar despesa"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Erro",
        "Não foi possível cadastrar a despesa.",
      );
    });
  });
});

describe("ModalExpenseForm · comprovante", () => {
  it("anexa o comprovante escolhido e envia junto", async () => {
    montar();
    preencher();

    fireEvent.click(screen.getByText("Galeria"));
    await waitFor(() => expect(screen.getByText("Trocar")).toBeTruthy());

    fireEvent.click(screen.getByText("Cadastrar despesa"));

    await waitFor(() => {
      expect(enviarComprovante).toHaveBeenCalledWith(
        COMPROVANTE.file,
        "image/png",
      );
    });
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({ receiptKey: "chave-s3" }),
    );
  });

  it("avisa e não cadastra quando o upload falha", async () => {
    enviarComprovante.mockRejectedValueOnce(new Error("s3 fora"));
    montar();
    preencher();

    fireEvent.click(screen.getByText("Galeria"));
    await waitFor(() => expect(screen.getByText("Trocar")).toBeTruthy());

    fireEvent.click(screen.getByText("Cadastrar despesa"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Erro",
        "Não foi possível enviar o comprovante. Tente novamente.",
      );
    });
    expect(criar).not.toHaveBeenCalled();
  });

  it("ignora o cancelamento da escolha do comprovante", async () => {
    escolherComprovante.mockResolvedValueOnce(null);
    montar();

    fireEvent.click(screen.getByText("Galeria"));

    await waitFor(() => expect(escolherComprovante).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
  });
});

describe("ModalExpenseForm · edição", () => {
  it("pré-preenche os campos da despesa", () => {
    montar({ expense: DESPESA });

    expect(screen.getByRole("dialog").getAttribute("data-modal")).toBe(
      "Editar despesa",
    );
    expect(campo("Descrição").value).toBe("Conta de luz");
    expect(campo("Valor").value).toMatch(/250,50$/);
    expect(screen.getByText("Salvar alterações")).toBeTruthy();
  });

  it("salva as alterações pelo id", async () => {
    const { onSaved } = montar({ expense: DESPESA });

    fireEvent.change(campo("Descrição"), { target: { value: "Conta de água" } });
    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => {
      expect(atualizar).toHaveBeenCalledWith(
        "d1",
        expect.objectContaining({ description: "Conta de água" }),
      );
    });
    expect(toastSuccess).toHaveBeenCalledWith("Despesa atualizada");
    expect(onSaved).toHaveBeenCalled();
  });

  it("avisa quando a atualização falha", async () => {
    atualizar.mockRejectedValueOnce(new Error("500"));
    montar({ expense: DESPESA });

    fireEvent.click(screen.getByText("Salvar alterações"));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Erro",
        "Não foi possível atualizar a despesa.",
      );
    });
  });
});
