import { adminHub } from "../../support/pages/adminHub";
import { SELECTORS } from "../../support/selectors";

describe("Administrativo · exportação do balanço anual", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    adminHub.open();
    adminHub.openTool(adminHub.tools.balancoAnual);
    cy.contains("h1", "Balanço anual").should("be.visible");
    cy.contains("Balanço do ano", { timeout: 60000 }).should("be.visible");
  });

  it("monta o relatório em PDF e manda para a janela de impressão", () => {
    cy.window().then((win) => {
      cy.stub(win, "open")
        .callsFake(() => ({
          document: {
            write: cy.stub(),
            close: cy.stub(),
          },
          focus: cy.stub(),
          print: cy.stub(),
          close: cy.stub(),
        }))
        .as("abrirJanela");
    });

    cy.get('button[aria-label="Exportar balanço em PDF"]').click();
    cy.get("@abrirJanela").should("have.been.called");
  });

  it("gera a planilha do balanço", () => {
    cy.get('button[aria-label="Exportar balanço em Excel"]').click();
    cy.contains("Gerando Excel…").should("not.exist");
    cy.get(SELECTORS.toast("error")).should("not.exist");
  });

  it("navega entre os anos do balanço", () => {
    cy.get(".mn-lbl")
      .invoke("text")
      .then((atual) => {
        cy.get('button[aria-label="Ano anterior"]').click();
        cy.get(".mn-lbl").should("not.have.text", atual);
        cy.get('button[aria-label="Próximo ano"]').click();
        cy.get(".mn-lbl").should("have.text", atual);
      });
  });
});
