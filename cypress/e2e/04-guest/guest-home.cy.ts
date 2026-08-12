import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { dashboard, DASHBOARD_CARDS } from "../../support/pages/dashboard";
import {
  expectNoDonationCreated,
  haveMoneyValue,
  openDonateModal,
  stubDonationEndpoints,
} from "../../support/pages/donate";

describe("Convidado · início", () => {
  beforeEach(() => {
    cy.loginAs("guest");
    stubDonationEndpoints();
    dashboard.open();
  });

  it("mostra o cartão de convidado com o aviso de acesso", () => {
    cy.get(SELECTORS.guestCard).should("be.visible");
    cy.contains("VOCÊ ESTÁ COMO CONVIDADO").should("be.visible");
    cy.contains(
      "Para acessar contribuições e a vida interna da comunidade, fale com um administrador.",
    ).should("be.visible");
  });

  it("identifica o papel como Convidado no menu lateral", () => {
    shell
      .roleBadge()
      .should("have.attr", "data-user-role", "guest")
      .and("contain.text", "Convidado");
  });

  it("não mostra cards de membro interno", () => {
    dashboard.expectNoCard(DASHBOARD_CARDS.recentDonations);
  });

  it("lista as próprias doações do mês", () => {
    cy.get(SELECTORS.guestCard).should("contain.text", "Suas doações no mês");
  });

  it("abre a doação já sugerindo um valor", () => {
    openDonateModal();
    cy.get(SELECTORS.field("Valor")).should(haveMoneyValue("10,00"));
  });

  it("exige um valor antes de gerar a doação", () => {
    openDonateModal();
    cy.get(SELECTORS.field("Valor")).clear();
    cy.get(SELECTORS.button("Doar via PIX")).click();
    shell.expectToast("error", "Informe um valor para doar.");
    expectNoDonationCreated();
  });

  it("não oferece registro em dinheiro", () => {
    openDonateModal();
    cy.get(SELECTORS.button("Em dinheiro")).should("not.exist");
  });
});

describe("Convidado · limites de acesso", () => {
  beforeEach(() => {
    cy.loginAs("guest");
  });

  it("não tem a aba Contribuições no mobile", () => {
    cy.viewportMobile();
    cy.visitApp("/dashboard");
    cy.get(SELECTORS.tab("Bills")).should("not.exist");
    cy.get(SELECTORS.tabbar).find("[data-tab]").should("have.length", 3);
  });

  it("não tem Contribuições nem Administrativo no menu lateral", () => {
    cy.viewportDesktop();
    cy.visitApp("/dashboard");
    cy.get(SELECTORS.sidebarNavItem("Bills")).should("not.exist");
    cy.get(SELECTORS.sidebarNavItem("Settings")).should("not.exist");
  });

  it("não vê o atalho Administrativo na tela Mais", () => {
    cy.viewportMobile();
    cy.visitApp("/profile");
    cy.get(SELECTORS.actionItem("Administrativo")).should("not.exist");
    cy.get(SELECTORS.actionItem("Configurações pessoais")).should("exist");
  });

  it("é redirecionado ao tentar as rotas internas e administrativas", () => {
    ["/bills", "/settings", "/arrecadacao", "/member-actions"].forEach(
      (path) => {
        cy.visit(path);
        cy.location("pathname", { timeout: 60000 }).should("eq", "/dashboard");
      },
    );
  });

  it("continua com acesso a leituras e vídeos", () => {
    cy.visitApp("/readings");
    cy.location("pathname").should("eq", "/readings");

    cy.visitApp("/videos");
    cy.location("pathname").should("eq", "/videos");
  });
});
