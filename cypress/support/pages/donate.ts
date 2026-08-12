import { SELECTORS } from "../selectors";

export const PIX_ALIAS = "criarPix";
export const CASH_ALIAS = "registrarDinheiro";

export function stubDonationEndpoints() {
  cy.intercept("POST", "**/donations", { statusCode: 500, body: {} }).as(
    PIX_ALIAS,
  );
  cy.intercept("POST", "**/donations/cash", { statusCode: 500, body: {} }).as(
    CASH_ALIAS,
  );
}

export function openDonateModal() {
  cy.contains("button", "Fazer uma doação").click();
  cy.get(SELECTORS.modal("Fazer uma doação")).should("be.visible");
}

export function haveMoneyValue(expected: string) {
  return ($input: JQuery<HTMLElement>) => {
    expect(String($input.val()).replace(/\s/g, " ")).to.eq(`R$ ${expected}`);
  };
}

export function expectNoDonationCreated() {
  cy.get(`@${PIX_ALIAS}.all`).should("have.length", 0);
  cy.get(`@${CASH_ALIAS}.all`).should("have.length", 0);
}
