import { adminHub } from "../../support/pages/adminHub";
import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";

describe("Administrativo · financeiro", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    adminHub.open();
  });

  describe("Entrada mensal", () => {
    beforeEach(() => {
      adminHub.openTool(adminHub.tools.arrecadacao);
      cy.contains("h1", "Entrada mensal").should("be.visible");
    });

    it("mostra meta, métodos de pagamento e contadores", () => {
      cy.contains("Meta do mês").should("be.visible");
      cy.contains("PIX").should("be.visible");
      cy.contains("Dinheiro").should("be.visible");
      cy.contains("Pagaram").should("be.visible");
      cy.contains("Inadimplentes").should("be.visible");
    });

    it("alterna entre pagantes e inadimplentes", () => {
      cy.get(".tabs button").contains("Inadimplentes").click();
      cy.get(".tabs button.on").should("contain.text", "Inadimplentes");

      cy.get(".tabs button").contains("Pagaram").click();
      cy.get(".tabs button.on").should("contain.text", "Pagaram");
    });

    it("navega para o mês anterior e bloqueia o mês futuro", () => {
      cy.get(".mn-lbl")
        .invoke("text")
        .then((atual) => {
          cy.get('button[aria-label="Mês anterior"]').click();
          cy.get(".mn-lbl").should("not.have.text", atual);

          cy.get('button[aria-label="Próximo mês"]').click();
          cy.get(".mn-lbl").should("have.text", atual);
          cy.get('button[aria-label="Próximo mês"]').should("be.disabled");
        });
    });
  });

  describe("Balanço anual", () => {
    beforeEach(() => {
      adminHub.openTool(adminHub.tools.balancoAnual);
      cy.contains("h1", "Balanço anual").should("be.visible");
    });

    it("carrega o fechamento do ano", () => {
      cy.contains("Balanço do ano", { timeout: 60000 }).should("be.visible");
    });
  });

  describe("Listagem de doações", () => {
    beforeEach(() => {
      adminHub.openTool(adminHub.tools.donations);
      cy.contains("h1", "Listagem de doações").should("be.visible");
    });

    it("carrega a listagem sem erro", () => {
      cy.get(SELECTORS.anyToast).should("not.exist");
    });
  });

  describe("Despesa mensal", () => {
    const descricao = `Despesa E2E ${Date.now()}`;

    beforeEach(() => {
      adminHub.openTool(adminHub.tools.expenses);
      cy.contains("h1", "Despesa mensal").should("be.visible");
    });

    it("mostra o total do mês e a navegação de meses", () => {
      cy.contains("Total de despesas no mês").should("be.visible");
      cy.get('button[aria-label="Mês anterior"]').should("exist");
      cy.get('button[aria-label="Próximo mês"]').should("be.disabled");
    });

    it("exige descrição, valor e categoria no cadastro", () => {
      cy.get('button[aria-label="Nova despesa"]').click();
      cy.get(SELECTORS.modal("Nova despesa")).should("be.visible");
      cy.get(SELECTORS.button("Cadastrar despesa")).click();
      shell.expectToast("error");
      cy.get('button[aria-label="Fechar"]').first().click();
      cy.get(SELECTORS.anyModal).should("not.exist");
    });

    it("cadastra e remove uma despesa de teste", () => {
      cy.get('button[aria-label="Nova despesa"]').click();
      cy.get(SELECTORS.modal("Nova despesa")).should("be.visible");

      cy.get(SELECTORS.field("Descrição")).type(descricao);
      cy.get(SELECTORS.field("Valor")).type("123");
      cy.contains("button", "Material").click();
      cy.get(SELECTORS.button("Cadastrar despesa")).click();

      shell.expectToast("success");
      cy.contains(descricao, { timeout: 60000 }).should("be.visible");

      cy.contains(".lrow", descricao)
        .find('button[aria-label="Remover item"]')
        .click();
      cy.get(SELECTORS.dialog("Remover despesa")).should("be.visible");
      cy.get(SELECTORS.button("remover")).click();

      shell.expectToast("success", "Despesa removida");
      cy.contains(descricao).should("not.exist");
    });
  });
});
