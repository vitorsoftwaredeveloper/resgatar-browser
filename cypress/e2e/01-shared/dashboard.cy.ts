import { ALL_ROLES, isInternal } from "../../support/roles";
import { DASHBOARD_CARDS, dashboard } from "../../support/pages/dashboard";
import { SELECTORS } from "../../support/selectors";

describe("Dashboard", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        dashboard.open();
      });

      it("saúda o usuário autenticado", () => {
        cy.get(SELECTORS.header).should("contain.text", "Olá,");
        cy.get(SELECTORS.breadcrumb).should("contain.text", "Início");
      });

      it("monta os cards previstos para o papel", () => {
        dashboard.expectCardsForRole(role);
      });

      it("mostra o cartão de convidado apenas para convidados", () => {
        cy.get(SELECTORS.guestCard).should(
          isInternal(role) ? "not.exist" : "exist",
        );
      });

      it("mostra o card de leitura para todos os papéis", () => {
        dashboard.expectCard(DASHBOARD_CARDS.streak);
      });
    });
  });

  describe("Cards exclusivos de membro interno", () => {
    it("membro vê as doações recentes", () => {
      cy.loginAs("member");
      dashboard.open();
      dashboard.expectCard(DASHBOARD_CARDS.recentDonations);
    });

    it("convidado não vê as doações recentes", () => {
      cy.loginAs("guest");
      dashboard.open();
      dashboard.expectNoCard(DASHBOARD_CARDS.recentDonations);
    });
  });
});
