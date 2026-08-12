import { ALL_ROLES } from "../../support/roles";
import { SELECTORS } from "../../support/selectors";

const DATE_NAVIGATOR = "[data-date-navigator]";
const SELECTED_DATE = "[data-selected-date]";
const CALENDAR = "[data-calendar-modal]";

describe("Leituras", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
      });

      it("carrega a liturgia do dia no desktop", () => {
        cy.viewportDesktop();
        cy.visitApp("/readings");
        cy.get(SELECTORS.breadcrumb).should("contain.text", "Leituras");
        cy.get("h1", { timeout: 60000 }).should("not.be.empty");
      });

      it("navega entre os dias no mobile", () => {
        cy.viewportMobile();
        cy.visitApp("/readings");

        cy.get(DATE_NAVIGATOR).should("be.visible");
        cy.get(SELECTED_DATE)
          .invoke("text")
          .then((hoje) => {
            cy.get('button[aria-label="Próximo dia"]').click();
            cy.get(SELECTED_DATE).should("not.have.text", hoje);

            cy.contains("button", "Voltar para hoje").click();
            cy.get(SELECTED_DATE).should("have.text", hoje);
          });
      });

      it("abre o calendário e escolhe outro dia", () => {
        cy.viewportMobile();
        cy.visitApp("/readings");

        cy.get(SELECTED_DATE)
          .invoke("text")
          .then((hoje) => {
            cy.get('button[aria-label="Abrir calendário"]').click();
            cy.get(CALENDAR).should("be.visible");

            const diaAlvo = new Date().getDate() === 1 ? "2" : "1";
            cy.get(CALENDAR)
              .contains("button:not([disabled])", diaAlvo)
              .first()
              .click();

            cy.get(CALENDAR).should("not.exist");
            cy.get(SELECTED_DATE).should("not.have.text", hoje);
          });
      });

      it("mostra a ofensiva de leituras no trilho do desktop", () => {
        cy.viewportDesktop();
        cy.visitApp("/readings");
        cy.contains("OFENSIVA DE LEITURAS").should("be.visible");
      });
    });
  });
});
