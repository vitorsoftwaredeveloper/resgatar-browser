import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Switch } from "@/components/Switch";
import { TimePickerField } from "@/components/TimePickerField";

describe("Button", () => {
  it("mostra o título e expõe o data-button", () => {
    cy.mount(<Button title="Salvar" />);

    cy.get('[data-button="Salvar"]').should("contain.text", "Salvar");
  });

  it("dispara onPress ao clicar", () => {
    const onPress = cy.stub().as("onPress");
    cy.mount(<Button title="Salvar" onPress={onPress} />);

    cy.get('[data-button="Salvar"]').click();

    cy.get("@onPress").should("have.been.calledOnce");
  });

  it("não dispara quando desabilitado", () => {
    const onPress = cy.stub().as("onPress");
    cy.mount(<Button title="Salvar" onPress={onPress} disabled />);

    cy.get('[data-button="Salvar"]').click({ force: true });

    cy.get("@onPress").should("not.have.been.called");
  });

  it("respeita o loading controlado", () => {
    cy.mount(<Button title="Salvar" loading />);

    cy.get('[aria-label="Carregando"]').should("exist");
    cy.contains("Salvar").should("not.exist");
  });
});

describe("Input", () => {
  it("mostra label e propaga o texto digitado", () => {
    const onChangeText = cy.stub().as("onChangeText");
    cy.mount(<Input label="Email" value="" onChangeText={onChangeText} />);

    cy.get('[data-field="Email"] input').type("a");

    cy.contains("Email").should("be.visible");
    cy.get("@onChangeText").should("have.been.calledWith", "a");
  });

  it("mostra a mensagem de erro", () => {
    cy.mount(<Input label="Email" value="" error="Email inválido" />);

    cy.contains("Email inválido").should("be.visible");
  });
});

describe("Switch", () => {
  it("expõe o estado por aria-checked", () => {
    cy.mount(<Switch checked onChange={cy.stub()} label="Vídeos" />);

    cy.get('[role="switch"]').should("have.attr", "aria-checked", "true");
  });

  it("inverte o valor ao clicar", () => {
    const onChange = cy.stub().as("onChange");
    cy.mount(<Switch checked={false} onChange={onChange} label="Vídeos" />);

    cy.get('[role="switch"]').click();

    cy.get("@onChange").should("have.been.calledWith", true);
  });
});

describe("TimePickerField", () => {
  it("quebra o valor recebido em hora e minuto", () => {
    cy.mount(
      <TimePickerField label="Horário" value="19h30" onChange={cy.stub()} />,
    );

    cy.get("[data-select]").eq(0).should("contain.text", "19h");
    cy.get("[data-select]").eq(1).should("contain.text", "30");
  });

  it("emite o horário ao escolher a hora", () => {
    const onChange = cy.stub().as("onChange");
    cy.mount(<TimePickerField value="" onChange={onChange} />);

    cy.get("[data-select]").eq(0).click();
    cy.contains("19h").click();

    cy.get("@onChange").should("have.been.calledWith", "19h");
  });
});
