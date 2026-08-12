import { ALL_ROLES, isInternal } from "../../support/roles";
import { SELECTORS } from "../../support/selectors";

const FAB = 'button[aria-label="Cadastrar vídeo"]';

describe("Vídeos", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.visitApp("/videos");
      });

      it("abre a listagem com a busca disponível", () => {
        cy.get(SELECTORS.breadcrumb).should("contain.text", "Vídeos");
        cy.get('input[placeholder="Buscar vídeos..."]').should("be.visible");
      });

      it("filtra por um termo sem resultado e limpa a busca", () => {
        cy.get('input[placeholder="Buscar vídeos..."]').type(
          "zzz-termo-inexistente-e2e{enter}",
        );
        cy.contains("Nenhum vídeo encontrado", { timeout: 30000 }).should(
          "be.visible",
        );
        cy.contains("button", "Limpar busca").click();
        cy.contains("Nenhum vídeo encontrado").should("not.exist");
      });

      it("libera o botão de publicar apenas para membro interno", () => {
        cy.get(FAB).should(isInternal(role) ? "exist" : "not.exist");
      });

      if (isInternal(role)) {
        it("abre o formulário de cadastro de vídeo e valida a URL", () => {
          cy.get(FAB).click();
          cy.get(SELECTORS.modal("Cadastrar vídeo")).should("be.visible");

          cy.get(SELECTORS.modal("Cadastrar vídeo"))
            .find("input")
            .first()
            .type("nao-e-uma-url-do-youtube");
          cy.get(SELECTORS.button("Salvar")).click();
          cy.contains("URL do YouTube inválida").should("be.visible");

          cy.get('button[aria-label="Fechar"]').first().click();
          cy.get(SELECTORS.anyModal).should("not.exist");
        });
      }
    });
  });
});
