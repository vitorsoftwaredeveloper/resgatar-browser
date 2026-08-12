import { getUser, provisionableUsers } from "../../support/users";
import { SELECTORS } from "../../support/selectors";

describe("Provisionamento dos usuários de teste", () => {
  it("cria o membro e o convidado pelo cadastro público", () => {
    provisionableUsers().forEach((user) => {
      cy.apiRegisterMember(user);
    });
  });

  it("todo cadastro novo nasce como Convidado", () => {
    cy.loginAs("admin");
    cy.openMemberActionModal("Níveis de acesso");
    cy.get(SELECTORS.modal("Níveis de acesso")).should("be.visible");

    cy.get(SELECTORS.memberRow(getUser("guest").email), { timeout: 60000 })
      .should("exist")
      .and("have.attr", "data-member-role", "guest");
  });

  it("o admin promove o usuário de teste a Membro interno", () => {
    cy.loginAs("admin");
    cy.setMemberRole(getUser("member").email, "user");
  });

  it("o usuário convidado permanece como Convidado", () => {
    cy.loginAs("admin");
    cy.setMemberRole(getUser("guest").email, "guest");
  });
});
