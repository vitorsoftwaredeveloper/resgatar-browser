import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { Dialog } from "@/components/Dialog";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ItemActionList } from "@/components/ItemActionList";
import { TimePickerField } from "@/components/TimePickerField";

describe("Button", () => {
  it("mostra o título e expõe o data-button", () => {
    render(<Button title="Salvar" />);

    expect(screen.getByRole("button")).toHaveProperty("dataset.button", "Salvar");
    expect(screen.getByText("Salvar")).toBeTruthy();
  });

  it("dispara onPress ao clicar", () => {
    const onPress = vi.fn();
    render(<Button title="Salvar" onPress={onPress} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara quando desabilitado", () => {
    const onPress = vi.fn();
    render(<Button title="Salvar" onPress={onPress} disabled />);

    fireEvent.click(screen.getByRole("button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("entra em loading sozinho enquanto a promessa não resolve", async () => {
    let liberar!: () => void;
    const onPress = () => new Promise<void>((resolve) => (liberar = resolve));
    render(<Button title="Salvar" onPress={onPress} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByLabelText("Carregando")).toBeTruthy();
    });

    liberar();

    await waitFor(() => {
      expect(screen.queryByLabelText("Carregando")).toBeNull();
    });
  });

  it("respeita o loading controlado", () => {
    render(<Button title="Salvar" loading />);

    expect(screen.getByLabelText("Carregando")).toBeTruthy();
    expect(screen.queryByText("Salvar")).toBeNull();
  });

  it("ignora cliques enquanto carrega", () => {
    const onPress = vi.fn();
    render(<Button title="Salvar" onPress={onPress} loading />);

    fireEvent.click(screen.getByRole("button"));

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("Input", () => {
  it("mostra label e propaga o texto digitado", () => {
    const onChangeText = vi.fn();
    render(<Input label="Email" value="" onChangeText={onChangeText} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "a@b.com" },
    });

    expect(screen.getByText("Email")).toBeTruthy();
    expect(onChangeText).toHaveBeenCalledWith("a@b.com");
  });

  it("mostra a mensagem de erro", () => {
    render(<Input label="Email" value="" error="Email inválido" />);

    expect(screen.getByText("Email inválido")).toBeTruthy();
  });

  it("usa o placeholder como data-field quando não há label", () => {
    const { container } = render(<Input placeholder="Buscar" value="" />);

    expect(container.querySelector('[data-field="Buscar"]')).toBeTruthy();
  });

  it("renderiza ícones das pontas", () => {
    render(
      <Input
        value=""
        leftIcon={<span>esquerda</span>}
        rightIcon={<span>direita</span>}
      />,
    );

    expect(screen.getByText("esquerda")).toBeTruthy();
    expect(screen.getByText("direita")).toBeTruthy();
  });

  it("encaminha foco e desfoque", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<Input value="" onFocus={onFocus} onBlur={onBlur} />);

    const campo = screen.getByRole("textbox");
    fireEvent.focus(campo);
    fireEvent.blur(campo);

    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });
});

describe("Switch", () => {
  it("expõe o estado por aria-checked", () => {
    render(<Switch checked onChange={vi.fn()} label="Vídeos" />);

    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });

  it("inverte o valor ao clicar", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Vídeos" />);

    fireEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("não dispara quando desabilitado", () => {
    const onChange = vi.fn();
    render(<Switch checked onChange={onChange} disabled label="Vídeos" />);

    fireEvent.click(screen.getByRole("switch"));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Dialog", () => {
  it("não renderiza quando invisível", () => {
    render(
      <Dialog visible={false} title="Confirmar?" onClose={vi.fn()} />,
    );

    expect(screen.queryByText("Confirmar?")).toBeNull();
  });

  it("mostra título, descrição e ações", () => {
    const onPress = vi.fn();
    render(
      <Dialog
        visible
        title="Confirmar?"
        description="Essa ação não pode ser desfeita."
        onClose={vi.fn()}
        actions={[{ label: "remover", onPress }]}
      />,
    );

    expect(screen.getByText("Confirmar?")).toBeTruthy();
    expect(screen.getByText("Essa ação não pode ser desfeita.")).toBeTruthy();

    fireEvent.click(screen.getByText("remover"));
    expect(onPress).toHaveBeenCalled();
  });

  it("fecha ao clicar no backdrop e não ao clicar no conteúdo", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog visible title="Confirmar?" onClose={onClose} />,
    );

    fireEvent.click(screen.getByText("Confirmar?"));
    expect(onClose).not.toHaveBeenCalled();

    const overlay = container.ownerDocument.querySelector("[data-dialog]")
      ?.parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Breadcrumb", () => {
  it("marca o último item como página atual", () => {
    render(
      <Breadcrumb
        items={[{ label: "Administrativo" }, { label: "Despesa mensal" }]}
      />,
    );

    expect(
      screen.getByText("Despesa mensal").getAttribute("aria-current"),
    ).toBe("page");
  });

  it("torna clicável só o item intermediário com onClick", () => {
    const onClick = vi.fn();
    render(
      <Breadcrumb
        items={[
          { label: "Administrativo", onClick },
          { label: "Despesa mensal" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Administrativo" }));

    expect(onClick).toHaveBeenCalled();
  });
});

describe("ItemActionList", () => {
  it("mostra título, descrição e dispara onPress", () => {
    const onPress = vi.fn();
    render(
      <ItemActionList
        title="Níveis de acesso"
        description="Gerencie quem é convidado."
        onPress={onPress}
      />,
    );

    expect(screen.getByText("Gerencie quem é convidado.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("TimePickerField", () => {
  it("quebra o valor recebido em hora e minuto", () => {
    const { container } = render(
      <TimePickerField label="Horário" value="19h30" onChange={vi.fn()} />,
    );

    const selects = container.querySelectorAll("[data-select]");
    expect(selects[0].textContent).toContain("19h");
    expect(selects[1].textContent).toContain("30");
  });

  it("mostra os placeholders quando o valor é inválido", () => {
    render(<TimePickerField value="" onChange={vi.fn()} />);

    expect(screen.getByText("Hora")).toBeTruthy();
    expect(screen.getByText("Min")).toBeTruthy();
  });

  it("emite o horário ao escolher a hora", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimePickerField value="" onChange={onChange} />,
    );

    const seletorHora = container.querySelectorAll("[data-select]")[0];
    fireEvent.click(seletorHora);
    fireEvent.click(screen.getByText("19h"));

    expect(onChange).toHaveBeenCalledWith("19h");
  });

  it("emite hora com minuto quando os dois estão escolhidos", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimePickerField value="19h" onChange={onChange} />,
    );

    const seletorMinuto = container.querySelectorAll("[data-select]")[1];
    fireEvent.click(seletorMinuto);
    fireEvent.click(screen.getByText("45"));

    expect(onChange).toHaveBeenCalledWith("19h45");
  });

  it("não emite minuto enquanto a hora não é escolhida", () => {
    const onChange = vi.fn();
    const { container } = render(
      <TimePickerField value="" onChange={onChange} />,
    );

    const seletorMinuto = container.querySelectorAll("[data-select]")[1];
    fireEvent.click(seletorMinuto);
    fireEvent.click(screen.getByText("15"));

    expect(onChange).not.toHaveBeenCalled();
  });
});
