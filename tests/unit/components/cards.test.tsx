import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { membrosDeAniversario } = vi.hoisted(() => ({
  membrosDeAniversario: { current: [] as unknown[] },
}));

vi.mock("@/context/BirthdayContext", () => ({
  useBirthday: () => ({ members: membrosDeAniversario.current }),
}));

import { BirthdayBanner } from "@/components/BirthdayBanner";
import { SelectField } from "@/components/SelectField";
import { ContributionItem } from "@/components/ContributionItem";

const HOJE = new Date(Date.UTC(2026, 5, 15, 12, 0, 0));

function membro(id: string, nome: string, dataNascimento: number | string) {
  return { _id: id, firstName: nome, dateOfBirth: dataNascimento };
}

function nascidoEm(mes: number, dia: number) {
  return Date.UTC(1990, mes, dia);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOJE);
  membrosDeAniversario.current = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BirthdayBanner", () => {
  it("avisa quando não há aniversariante no mês", () => {
    render(<BirthdayBanner />);

    expect(screen.getByText("Nenhum aniversariante este mês")).toBeTruthy();
  });

  it("lista só quem faz aniversário no mês corrente", () => {
    membrosDeAniversario.current = [
      membro("1", "Ana", nascidoEm(5, 20)),
      membro("2", "Bruno", nascidoEm(2, 10)),
    ];

    render(<BirthdayBanner />);

    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.queryByText("Bruno")).toBeNull();
  });

  it("põe quem faz hoje na frente e marca com o bolo", () => {
    membrosDeAniversario.current = [
      membro("1", "Ana", nascidoEm(5, 20)),
      membro("2", "Bruno", nascidoEm(5, 15)),
    ];

    render(<BirthdayBanner />);

    const nomes = screen
      .getAllByText(/Ana|Bruno/)
      .map((el) => el.textContent);
    expect(nomes[0]).toBe("Bruno");
    expect(screen.getByText("🎂")).toBeTruthy();
  });

  it("ordena por dia quando ninguém faz hoje", () => {
    membrosDeAniversario.current = [
      membro("1", "Ana", nascidoEm(5, 28)),
      membro("2", "Bruno", nascidoEm(5, 3)),
    ];

    render(<BirthdayBanner />);

    const nomes = screen.getAllByText(/Ana|Bruno/).map((el) => el.textContent);
    expect(nomes).toEqual(["Bruno", "Ana"]);
  });

  it("aceita data de nascimento como string numérica", () => {
    membrosDeAniversario.current = [
      membro("1", "Ana", String(nascidoEm(5, 20))),
    ];

    render(<BirthdayBanner />);

    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("ignora data ausente ou inválida", () => {
    membrosDeAniversario.current = [
      membro("1", "Ana", 0),
      membro("2", "Bruno", "não é data"),
    ];

    render(<BirthdayBanner />);

    expect(screen.getByText("Nenhum aniversariante este mês")).toBeTruthy();
  });
});

describe("SelectField", () => {
  const OPCOES = [
    { label: "Convidado", value: "guest" },
    { label: "Membro", value: "user" },
  ];

  it("mostra o placeholder sem valor escolhido", () => {
    render(
      <SelectField
        placeholder="Selecionar"
        value={null}
        options={OPCOES}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Selecionar")).toBeTruthy();
  });

  it("mostra o rótulo da opção escolhida", () => {
    render(
      <SelectField value="user" options={OPCOES} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("Membro")).toBeTruthy();
  });

  it("abre a lista e devolve o valor escolhido", () => {
    const onSelect = vi.fn();
    render(<SelectField value={null} options={OPCOES} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Convidado"));

    expect(onSelect).toHaveBeenCalledWith("guest");
  });

  it("fecha a lista com Esc", () => {
    render(<SelectField value={null} options={OPCOES} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Convidado")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Convidado")).toBeNull();
  });

  it("mostra label e erro", () => {
    render(
      <SelectField
        label="Papel"
        value={null}
        options={OPCOES}
        onSelect={vi.fn()}
        error="Escolha um papel"
      />,
    );

    expect(screen.getByText("Papel")).toBeTruthy();
    expect(screen.getByText("Escolha um papel")).toBeTruthy();
  });
});

describe("ContributionItem", () => {
  const PENDENTE = {
    id: "0",
    month: "Janeiro",
    value: "R$ 10,00",
    status: "pending",
    description: "Pagamento a ser realizado",
  };

  it("oferece pagar quando está pendente", () => {
    const onPay = vi.fn().mockResolvedValue(undefined);
    render(<ContributionItem data={PENDENTE} onPay={onPay} />);

    expect(screen.getByText("Pendente")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));

    expect(onPay).toHaveBeenCalled();
  });

  it("oferece comprovante quando está pago", () => {
    const onShare = vi.fn();
    render(
      <ContributionItem
        data={{ ...PENDENTE, status: "approved" }}
        onPay={vi.fn()}
        onShare={onShare}
      />,
    );

    expect(screen.getByText("Pago")).toBeTruthy();
    fireEvent.click(screen.getByRole("button"));

    expect(onShare).toHaveBeenCalled();
  });

  it("expõe mês e status como data attributes", () => {
    const { container } = render(
      <ContributionItem data={PENDENTE} onPay={vi.fn()} />,
    );

    const card = container.querySelector("[data-contribution-month]");
    expect(card?.getAttribute("data-contribution-month")).toBe("Janeiro");
    expect(card?.getAttribute("data-contribution-status")).toBe("pending");
  });
});
