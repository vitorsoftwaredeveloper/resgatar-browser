import { SELECTORS } from "../../support/selectors";
import { adminHub } from "../../support/pages/adminHub";

describe("Administrativo · hub", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    adminHub.open();
  });

  it("mostra os KPIs do painel", () => {
    adminHub.kpiTiles().should("have.length.at.least", 4);
    cy.contains("Saldo em caixa").should("be.visible");
    cy.contains("Meta anual").should("be.visible");
    cy.contains("Inadimplentes").should("be.visible");
    cy.contains("Membros ativos").should("be.visible");
  });

  it("lista todas as ferramentas administrativas", () => {
    Object.values(adminHub.tools).forEach((tool) => {
      cy.get(SELECTORS.actionItem(tool)).should("exist");
    });
  });

  Object.entries(adminHub.tools)
    .filter(([key]) => key !== "sendNotification")
    .forEach(([, title]) => {
      it(`abre ${title} no master-detail e volta para o hub`, () => {
        adminHub.openTool(title);
        adminHub.expectDetail(title);
        cy.location("pathname").should("eq", "/settings");

        adminHub.backToHub();
        cy.contains("h1", "Administrativo").should("be.visible");
      });
    });

  it("redireciona as rotas standalone para o hub no desktop", () => {
    const standalone = [
      ["/arrecadacao", "arrecadacao"],
      ["/balanco-anual", "balanco-anual"],
      ["/expenses", "expenses"],
      ["/donations", "donations"],
      ["/member-actions", "member-actions"],
    ] as const;

    standalone.forEach(([path, key]) => {
      cy.visit(path);
      cy.location("pathname", { timeout: 60000 }).should("eq", "/settings");
      cy.location("search").should("eq", `?open=${key}`);
    });
  });

  it("mantém as rotas standalone no mobile", () => {
    cy.viewportMobile();
    cy.visitApp("/arrecadacao");
    cy.location("pathname").should("eq", "/arrecadacao");
  });

  it("agrupa as ferramentas por seção no mobile", () => {
    cy.viewportMobile();
    cy.visitApp("/settings");
    cy.contains("Financeiro").should("be.visible");
    cy.contains("Administração").should("be.visible");
  });
});
