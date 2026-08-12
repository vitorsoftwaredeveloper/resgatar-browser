import { ALL_ROLES } from "../../support/roles";
import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { getUser } from "../../support/users";

describe("Configurações pessoais", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.visitApp("/personal-settings");
      });

      it("lista as ações da conta", () => {
        cy.contains("h1", "Configurações pessoais").should("be.visible");
        cy.get(SELECTORS.actionItem("Meus dados")).should("exist");
        cy.get(SELECTORS.actionItem("Atualizar senha")).should("exist");
        cy.get(SELECTORS.actionItem("Encerrar conta")).should("exist");
      });

      it("abre Meus dados com os dados do usuário logado", () => {
        cy.get(SELECTORS.actionItem("Meus dados")).click();
        cy.get(SELECTORS.modal("Meus dados")).should("be.visible");
        cy.get(SELECTORS.field("Email")).should(
          "have.value",
          getUser(role).email,
        );
        cy.get('button[aria-label="Fechar"]').first().click();
        cy.get(SELECTORS.anyModal).should("not.exist");
      });

      it("fecha Meus dados com a tecla Esc", () => {
        cy.get(SELECTORS.actionItem("Meus dados")).click();
        cy.get(SELECTORS.modal("Meus dados")).should("be.visible");
        cy.get("body").type("{esc}");
        cy.get(SELECTORS.anyModal).should("not.exist");
      });

      it("valida a força da nova senha", () => {
        cy.get(SELECTORS.actionItem("Atualizar senha")).click();
        cy.get(SELECTORS.modal("Atualizar senha")).should("be.visible");

        cy.get(SELECTORS.field("Nova senha")).type("fraca");
        cy.get(SELECTORS.field("Confirmar senha")).type("fraca");
        cy.get(SELECTORS.button("Salvar")).click();

        shell.expectToast("error", "Campos inválidos");
      });

      it("exige a senha atual para encerrar a conta", () => {
        cy.get(SELECTORS.actionItem("Encerrar conta")).click();
        cy.get(SELECTORS.modal("Encerrar conta")).should("be.visible");
        cy.contains(
          "Ao encerrar sua conta, os seguintes dados serão removidos:",
        ).should("be.visible");
        cy.get(SELECTORS.button("Encerrar conta")).click();
        shell.expectToast("error", "Informe sua senha para continuar.");
        cy.get('button[aria-label="Fechar"]').first().click();
        cy.get(SELECTORS.anyModal).should("not.exist");
      });

      it("alterna entre tema claro e escuro", () => {
        cy.viewportDesktop();
        shell.toggleTheme();
        cy.document()
          .its("documentElement")
          .should("have.attr", "data-theme", "dark");
        shell.toggleTheme();
        cy.document()
          .its("documentElement")
          .should("have.attr", "data-theme", "light");
      });
    });
  });
});
