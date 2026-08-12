import { adminHub } from "../../support/pages/adminHub";
import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";
import { getUser } from "../../support/users";

describe("Administrativo · gestão de membros", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    adminHub.open();
    adminHub.openTool(adminHub.tools.memberActions);
    cy.contains("h1", "Gestão de membros").should("be.visible");
  });

  it("lista todas as ações de gestão", () => {
    Object.values(adminHub.memberActions).forEach((action) => {
      cy.get(SELECTORS.actionItem(action)).should("exist");
    });
  });

  describe("Níveis de acesso", () => {
    beforeEach(() => {
      cy.get(SELECTORS.actionItem(adminHub.memberActions.accessLevels)).click();
      cy.get(SELECTORS.modal("Níveis de acesso")).should("be.visible");
    });

    it("filtra a lista por papel", () => {
      cy.get(SELECTORS.roleFilter("guest")).click();
      cy.get("[data-member-row]", { timeout: 60000 })
        .should("have.length.at.least", 1)
        .each(($row) => {
          expect($row.attr("data-member-role")).to.eq("guest");
        });

      cy.get(SELECTORS.roleFilter("admin")).click();
      cy.get("[data-member-row]").each(($row) => {
        expect($row.attr("data-member-role")).to.eq("admin");
      });

      cy.get(SELECTORS.roleFilter("all")).click();
      cy.get("[data-member-row]").should("have.length.at.least", 2);
    });

    it("mostra os usuários de teste com o papel provisionado", () => {
      cy.get(SELECTORS.memberRow(getUser("member").email), { timeout: 60000 })
        .should("exist")
        .and("have.attr", "data-member-role", "user");

      cy.get(SELECTORS.memberRow(getUser("guest").email))
        .should("exist")
        .and("have.attr", "data-member-role", "guest");
    });

    it("não deixa o admin rebaixar a si mesmo", () => {
      const proprio = getUser("admin").email;

      cy.get(SELECTORS.memberRow(proprio))
        .find("[data-select]")
        .should("have.css", "pointer-events", "none");

      cy.get(SELECTORS.memberRow(proprio)).should(
        "have.attr",
        "data-member-role",
        "admin",
      );
    });

    it("pede confirmação e permite cancelar a troca de papel", () => {
      const alvo = getUser("guest").email;

      cy.get(SELECTORS.memberRow(alvo)).find("[data-select]").click();
      cy.get(SELECTORS.memberRow(alvo))
        .find(SELECTORS.selectOption("user"))
        .click();

      cy.get(SELECTORS.dialog("Alterar nível de acesso?")).should("be.visible");
      cy.get(SELECTORS.button("cancelar")).click();

      cy.get(SELECTORS.anyDialog).should("not.exist");
      cy.get(SELECTORS.memberRow(alvo)).should(
        "have.attr",
        "data-member-role",
        "guest",
      );
    });

    it("promove e rebaixa o convidado de teste", () => {
      const alvo = getUser("guest").email;

      cy.get(SELECTORS.memberRow(alvo)).find("[data-select]").click();
      cy.get(SELECTORS.memberRow(alvo))
        .find(SELECTORS.selectOption("user"))
        .click();
      cy.get(SELECTORS.button("confirmar")).click();
      shell.expectToast("success", "Nível de acesso atualizado");
      cy.get(SELECTORS.memberRow(alvo)).should(
        "have.attr",
        "data-member-role",
        "user",
      );

      cy.get(SELECTORS.memberRow(alvo)).find("[data-select]").click();
      cy.get(SELECTORS.memberRow(alvo))
        .find(SELECTORS.selectOption("guest"))
        .click();
      cy.get(SELECTORS.button("confirmar")).click();
      cy.get(SELECTORS.memberRow(alvo)).should(
        "have.attr",
        "data-member-role",
        "guest",
      );
    });
  });

  describe("Remover membro", () => {
    it("abre a lista e cancela a remoção", () => {
      cy.get(SELECTORS.actionItem(adminHub.memberActions.remove)).click();
      cy.get(SELECTORS.modal("Remover membro")).should("be.visible");

      cy.get("[data-member-card]", { timeout: 60000 })
        .should("have.length.at.least", 1)
        .first()
        .find("button")
        .click();

      cy.get(SELECTORS.dialog("Confirmar remoção")).should("be.visible");
      cy.get(SELECTORS.button("cancelar")).click();
      cy.get(SELECTORS.anyDialog).should("not.exist");
    });
  });

  describe("Registrar pagamento em dinheiro", () => {
    it("abre o detalhe de um membro sem confirmar o pagamento", () => {
      cy.get(SELECTORS.actionItem(adminHub.memberActions.cashPayment)).click();
      cy.get(SELECTORS.modal("Registrar pagamento")).should("be.visible");

      cy.get(SELECTORS.memberCard(getUser("member").email), { timeout: 60000 })
        .find("button")
        .click();

      cy.get(SELECTORS.anyModal, { timeout: 60000 }).should(
        "have.attr",
        "data-modal",
        `${getUser("member").firstName} ${getUser("member").lastName}`,
      );
    });
  });

  describe("Atualizar senha de membro", () => {
    it("valida a senha antes de enviar", () => {
      cy.get(
        SELECTORS.actionItem(adminHub.memberActions.changePassword),
      ).click();
      cy.get(SELECTORS.modal("Atualizar senha")).should("be.visible");

      cy.get(SELECTORS.memberCard(getUser("member").email), { timeout: 60000 })
        .find("button")
        .click();

      cy.get(SELECTORS.field("Nova senha")).type("fraca");
      cy.get(SELECTORS.field("Confirmar senha")).type("fraca");
      cy.get(SELECTORS.button("Salvar")).click();
      shell.expectToast("error", "Campos inválidos");
    });
  });

  describe("Visibilidade do convidado", () => {
    it("liga e desliga um card do convidado", () => {
      cy.get(
        SELECTORS.actionItem(adminHub.memberActions.guestVisibility),
      ).click();
      cy.get(SELECTORS.modal("Visibilidade do convidado")).should("be.visible");

      cy.get('button[role="switch"][aria-label="Vídeos"]').as("toggle");

      cy.get("@toggle")
        .invoke("attr", "aria-checked")
        .then((inicial) => {
          const alvo = inicial === "true" ? "false" : "true";

          cy.get("@toggle").click();
          cy.get("@toggle", { timeout: 30000 }).should(
            "have.attr",
            "aria-checked",
            alvo,
          );

          cy.get("@toggle").click();
          cy.get("@toggle", { timeout: 30000 }).should(
            "have.attr",
            "aria-checked",
            String(inicial),
          );
        });
    });
  });

  describe("Enviar notificação", () => {
    it("valida o formulário sem disparar o envio", () => {
      adminHub.backToHub();
      cy.get(SELECTORS.actionItem(adminHub.tools.sendNotification)).click();
      cy.get(SELECTORS.modal("Enviar notificação")).should("be.visible");
      cy.get(SELECTORS.button("Enviar")).click();
      shell.expectToast("error");
    });
  });
});
