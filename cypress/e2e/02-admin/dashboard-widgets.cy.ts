import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { dashboard, DASHBOARD_CARDS } from "../../support/pages/dashboard";

describe("Administrativo · widgets da Dashboard", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    dashboard.open();
  });

  describe("Campanhas (banners)", () => {
    beforeEach(() => {
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.banners)).within(() => {
        cy.get(
          'button[aria-label="Gerenciar banners"], button[aria-label="Cadastrar primeiro banner"]',
        ).click();
      });
      cy.get(SELECTORS.modal("Campanhas")).should("be.visible");
    });

    it("abre o gerenciador de campanhas", () => {
      cy.get(SELECTORS.modal("Campanhas")).should("be.visible");
    });

    it("entra e sai do modo de reordenação", () => {
      cy.get('button[aria-label="Editar ordem dos banners"]').click();
      cy.get('button[aria-label="Concluir edição"]').should("be.visible").click();
      cy.get('button[aria-label="Editar ordem dos banners"]').should(
        "be.visible",
      );
    });

    it("exige imagem e título para publicar um banner", () => {
      cy.get('button[aria-label="Adicionar banner"]').click();
      cy.get(SELECTORS.modal("Novo banner")).should("be.visible");

      cy.get(SELECTORS.button("Publicar")).click();
      cy.contains("Selecione uma imagem para o banner.").should("be.visible");
      cy.contains("O título é obrigatório.").should("be.visible");

      cy.get(SELECTORS.field("Título *")).type("Campanha E2E");
      cy.get(SELECTORS.button("Publicar")).click();
      cy.contains("O título é obrigatório.").should("not.exist");
      cy.contains("Selecione uma imagem para o banner.").should("be.visible");
    });

    it("fecha o formulário de banner sem salvar", () => {
      cy.get('button[aria-label="Adicionar banner"]').click();
      cy.get(SELECTORS.modal("Novo banner")).should("be.visible");
      cy.get("body").type("{esc}");
      cy.get(SELECTORS.modal("Novo banner")).should("not.exist");
    });
  });

  describe("Quadro de avisos", () => {
    beforeEach(() => {
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.notices)).within(() => {
        cy.get('button[aria-label="Gerenciar Quadro de Avisos"]').click();
      });
      cy.get(SELECTORS.modal("Quadro de avisos")).should("be.visible");
    });

    it("entra e sai do modo de edição dos compromissos", () => {
      cy.get('button[aria-label="Editar compromissos"]').click();
      cy.get('button[aria-label="Concluir edição"]').should("be.visible").click();
      cy.get('button[aria-label="Editar compromissos"]').should("be.visible");
    });

    it("valida o formulário de novo compromisso", () => {
      cy.get('button[aria-label="Publicar compromisso"]').click();
      cy.get(SELECTORS.modal("Novo compromisso")).should("be.visible");

      cy.get(SELECTORS.button("Publicar")).click();
      cy.contains("Informe o nome do compromisso").should("be.visible");
      cy.contains("Informe o horário").should("be.visible");
      cy.contains("Informe o local").should("be.visible");
    });

    it("preenche nome, horário e local de um compromisso", () => {
      cy.get('button[aria-label="Publicar compromisso"]').click();
      cy.get(SELECTORS.modal("Novo compromisso")).should("be.visible");

      cy.get(SELECTORS.field("Nome")).type("Terço E2E");
      cy.get(SELECTORS.field("Local")).type("Igreja Matriz");
      cy.get(SELECTORS.field("Nome")).should("have.value", "Terço E2E");

      cy.get("body").type("{esc}");
      cy.get(SELECTORS.modal("Novo compromisso")).should("not.exist");
    });
  });

  describe("Meta da comunidade", () => {
    it("valida o valor da meta do mês", () => {
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.communityGoal)).within(
        () => {
          cy.get('button[aria-label="Editar meta do mês"]').click();
        },
      );

      cy.get(SELECTORS.modal("Meta do mês")).should("be.visible");
      cy.get(SELECTORS.field("Valor da meta")).clear();
      cy.get(SELECTORS.button("Salvar meta")).click();
      shell.expectToast("error");

      cy.get(SELECTORS.field("Valor da meta")).type("50000");
      cy.get(SELECTORS.field("Valor da meta"))
        .invoke("val")
        .should("match", /500,00$/);

      cy.get("body").type("{esc}");
      cy.get(SELECTORS.modal("Meta do mês")).should("not.exist");
    });
  });
});
