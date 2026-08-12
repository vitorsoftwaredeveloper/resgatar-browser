import { SELECTORS } from "../../support/selectors";
import { adminHub } from "../../support/pages/adminHub";

const ROUTES = {
  notifications: "\\/notifications",
  banners: "\\/campaigns",
  commitments: "\\/commitments",
  birthdays: "\\/members\\/birthdays",
  videos: "\\/videos",
  donations: "\\/donations($|\\?)",
  charges: "\\/charges",
  chargesSummary: "\\/charges\\/summary",
  expenses: "\\/expenses($|\\?)",
  expensesList: "\\/expenses",
  member: "\\/members\\/[0-9a-zA-Z-]+($|\\?)",
  memberPassword: "\\/members\\/[0-9a-zA-Z-]+\\/password",
  dashboardVisibility: "\\/dashboard-settings",
} as const;

const LITURGY = /liturgia\.up\.railway\.app/;

function apiRoute(pattern: string): RegExp {
  const host = new URL(String(Cypress.env("apiBaseUrl"))).host.replace(
    /\./g,
    "\\.",
  );
  return new RegExp(host + pattern);
}

function failWith(method: string, url: RegExp, alias: string) {
  cy.intercept({ method, url }, { statusCode: 500, body: {} }).as(alias);
}

function failApi(method: string, pattern: string, alias: string) {
  failWith(method, apiRoute(pattern), alias);
}

describe("Degradação quando a API falha", () => {
  describe("Telas do membro", () => {
    beforeEach(() => {
      cy.loginAs("member");
    });

    it("dashboard sobrevive a todas as chamadas falhando", () => {
      failApi("GET", ROUTES.notifications, "notificacoes");
      failApi("GET", ROUTES.banners, "banners");
      failApi("GET", ROUTES.commitments, "compromissos");
      failApi("GET", ROUTES.birthdays, "aniversariantes");
      failApi("GET", ROUTES.videos, "videos");
      failApi("GET", ROUTES.donations, "doacoes");
      failApi("GET", ROUTES.charges, "cobrancas");

      cy.visitApp("/dashboard");
      cy.get(SELECTORS.header).should("exist");
      cy.get(SELECTORS.dashboardCard("streak")).should("exist");
    });

    it("leituras mostra o estado de erro e permite tentar de novo", () => {
      failWith("GET", LITURGY, "liturgia");

      cy.visitApp("/readings");
      cy.contains("Não foi possível carregar", { timeout: 30000 }).should(
        "be.visible",
      );
      cy.contains("button", "Tentar novamente").click();
      cy.contains("Não foi possível carregar").should("be.visible");
    });

    it("vídeos mostra a lista vazia quando a busca falha", () => {
      failApi("GET", ROUTES.videos, "videos");

      cy.visitApp("/videos");
      cy.contains("Nenhum vídeo por aqui ainda", { timeout: 30000 }).should(
        "be.visible",
      );
    });

    it("doação avisa o erro devolvido pela API", () => {
      failApi("POST", ROUTES.donations, "pix");

      cy.visitApp("/bills");
      cy.contains("button", "Fazer uma doação").click();
      cy.get(SELECTORS.modal("Fazer uma doação")).should("be.visible");
      cy.get(SELECTORS.button("Doar via PIX")).click();

      cy.wait("@pix");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });

    it("salvar o perfil avisa quando a API recusa", () => {
      failApi("PUT", ROUTES.member, "salvar");
      cy.intercept(
        { method: "GET", url: /viacep\.com\.br/ },
        {
          statusCode: 200,
          body: {
            logradouro: "Praça da Sé",
            localidade: "São Paulo",
            uf: "SP",
          },
        },
      ).as("viacep");

      cy.visitApp("/personal-settings");
      cy.get(SELECTORS.actionItem("Meus dados")).click();
      cy.get(SELECTORS.modal("Meus dados")).should("be.visible");

      cy.get(SELECTORS.field("CEP")).clear().type("01001000");
      cy.wait("@viacep");
      cy.get(SELECTORS.field("Número")).clear().type("100");
      cy.get(SELECTORS.field("Bio")).clear().type("bio de teste e2e");
      cy.get(SELECTORS.button("Salvar")).click();

      cy.wait("@salvar");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });

    it("atualizar senha avisa quando a API recusa", () => {
      failApi("PUT", ROUTES.memberPassword, "senha");

      cy.visitApp("/personal-settings");
      cy.get(SELECTORS.actionItem("Atualizar senha")).click();
      cy.get(SELECTORS.modal("Atualizar senha")).should("be.visible");

      cy.get(SELECTORS.field("Nova senha")).type("SenhaForte1@");
      cy.get(SELECTORS.field("Confirmar senha")).type("SenhaForte1@");
      cy.get(SELECTORS.button("Salvar")).click();

      cy.wait("@senha");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });
  });

  describe("Telas do administrador", () => {
    beforeEach(() => {
      cy.loginAs("admin");
    });

    it("entrada mensal avisa quando o resumo falha", () => {
      failApi("GET", ROUTES.chargesSummary, "resumo");

      cy.viewportMobile();
      cy.visitApp("/arrecadacao");
      cy.contains("Não foi possível carregar a arrecadação", {
        timeout: 30000,
      }).should("be.visible");
    });

    it("despesas avisa quando o mês falha", () => {
      failApi("GET", ROUTES.expensesList, "despesas");

      cy.viewportMobile();
      cy.visitApp("/expenses");
      cy.contains("Não foi possível carregar as despesas", {
        timeout: 30000,
      }).should("be.visible");
    });

    it("cadastro de despesa avisa quando a API recusa", () => {
      failApi("POST", ROUTES.expenses, "criar");

      adminHub.open();
      adminHub.openTool(adminHub.tools.expenses);
      cy.get('button[aria-label="Nova despesa"]').click();
      cy.get(SELECTORS.modal("Nova despesa")).should("be.visible");

      cy.get(SELECTORS.field("Descrição")).type("Falha E2E");
      cy.get(SELECTORS.field("Valor")).type("500");
      cy.contains("button", "Outros").click();
      cy.get(SELECTORS.button("Cadastrar despesa")).click();

      cy.wait("@criar");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });

    it("troca de nível de acesso avisa quando a API recusa", () => {
      failApi("PUT", ROUTES.member, "papel");

      cy.openMemberActionModal("Níveis de acesso");
      cy.get(SELECTORS.modal("Níveis de acesso")).should("be.visible");

      cy.get("[data-member-row]", { timeout: 60000 })
        .filter('[data-member-role="guest"]')
        .first()
        .as("linha");

      cy.get("@linha").find("[data-select]").click();
      cy.get("@linha").find(SELECTORS.selectOption("user")).click();
      cy.get(SELECTORS.button("confirmar")).click();

      cy.wait("@papel");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });

    it("envio de notificação avisa quando a API recusa", () => {
      failApi("POST", ROUTES.notifications, "enviar");

      adminHub.open();
      cy.get(SELECTORS.actionItem(adminHub.tools.sendNotification)).click();
      cy.get(SELECTORS.modal("Enviar notificação")).should("be.visible");

      cy.get(SELECTORS.field("Título")).type("Aviso de teste E2E");
      cy.get(SELECTORS.modal("Enviar notificação"))
        .find("textarea")
        .type("Mensagem de teste que nunca chega a ninguém.");
      cy.get(SELECTORS.button("Enviar")).click();

      cy.wait("@enviar");
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });

    it("visibilidade do convidado avisa quando a API recusa", () => {
      failApi("PUT", ROUTES.dashboardVisibility, "visibilidade");

      cy.openMemberActionModal("Visibilidade do convidado");
      cy.get(SELECTORS.modal("Visibilidade do convidado")).should("be.visible");

      cy.get('button[role="switch"][aria-label="Vídeos"]').click();
      cy.get(SELECTORS.toast("error")).should("be.visible");
    });
  });
});
