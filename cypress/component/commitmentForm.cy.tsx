import { ModalCommitmentForm } from "@/components/NoticesCard/NoticeBoardModal/ModalCommitmentForm";
import { CommitmentService } from "@/services/CommitmentService";

describe("ModalCommitmentForm sem module mock", () => {
  it("valida os campos obrigatórios sem tocar na API", () => {
    cy.mount(
      <ModalCommitmentForm visible onClose={cy.stub()} onSuccess={cy.stub()} />,
    );

    cy.contains("Publicar").click();

    cy.contains("Informe o nome do compromisso").should("be.visible");
    cy.contains("Informe o horário").should("be.visible");
    cy.contains("Informe o local").should("be.visible");
  });

  it("tenta trocar o service pelo namespace do módulo", () => {
    cy.stub(CommitmentService, "create").as("create").resolves({});

    cy.mount(
      <ModalCommitmentForm visible onClose={cy.stub()} onSuccess={cy.stub()} />,
    );

    cy.get('[data-field="Nome"] input').type("Terço");
    cy.get('[data-field="Local"] input').type("Igreja Matriz");
    cy.get("[data-select]").eq(0).click();
    cy.contains("19h").click();
    cy.contains("Selecione o dia").click();
    cy.contains("Quarta").click();

    cy.contains("Publicar").click();

    cy.get("@create").should("have.been.called");
  });
});
