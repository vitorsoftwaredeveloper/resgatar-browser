import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { dashboard, DASHBOARD_CARDS } from "../../support/pages/dashboard";
import {
  expectNoDonationCreated,
  haveMoneyValue,
  openDonateModal,
  stubDonationEndpoints,
} from "../../support/pages/donate";

describe("Membro interno · contribuições", () => {
  beforeEach(() => {
    cy.loginAs("member");
    stubDonationEndpoints();
    cy.visitApp("/bills");
  });

  it("abre a tela de contribuições com o resumo do ano", () => {
    cy.contains("h1", "Contribuições").should("be.visible");
    cy.contains("Progresso do ano").should("be.visible");
    cy.contains("Total pago").should("be.visible");
    cy.contains("Em aberto").should("be.visible");
  });

  it("lista as mensalidades do ano", () => {
    cy.contains("h2", "Mensalidades").should("be.visible");
    cy.contains("meses").should("be.visible");
  });

  it("abre a doação já sugerindo o valor da mensalidade", () => {
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

  it("não oferece registro em dinheiro para quem não é admin", () => {
    openDonateModal();
    cy.get(SELECTORS.button("Em dinheiro")).should("not.exist");
  });

  it("preenche o valor por atalho e fecha o modal", () => {
    openDonateModal();
    cy.contains("button", "R$ 20").click();
    cy.get(SELECTORS.field("Valor")).should(haveMoneyValue("20,00"));
    cy.get('button[aria-label="Fechar"]').first().click();
    cy.get(SELECTORS.anyModal).should("not.exist");
  });

  it("mostra a aba Contribuições no mobile", () => {
    cy.viewportMobile();
    cy.visitApp("/dashboard");
    shell.tab("Bills").should("exist").click();
    cy.location("pathname").should("eq", "/bills");
  });
});

describe("Membro interno · dashboard", () => {
  beforeEach(() => {
    cy.loginAs("member");
    dashboard.open();
  });

  it("mostra os cards da vida interna", () => {
    dashboard.expectCard(DASHBOARD_CARDS.recentDonations);
    dashboard.expectCard(DASHBOARD_CARDS.streak);
    dashboard.expectNoCard(DASHBOARD_CARDS.guestHome);
  });

  it("identifica o papel como Membro no menu lateral", () => {
    shell
      .roleBadge()
      .should("have.attr", "data-user-role", "user")
      .and("contain.text", "Membro");
  });
});
