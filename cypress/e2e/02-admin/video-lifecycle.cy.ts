import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";

const VIDEO_CARD = "[data-video-card]";
const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("Ciclo de vida de um vídeo", () => {
  beforeEach(() => {
    cy.loginAs("admin");
    cy.visitApp("/videos");
  });

  it("publica, abre no feed e remove o vídeo de teste", () => {
    cy.get('button[aria-label="Cadastrar vídeo"]').click();
    cy.get(SELECTORS.modal("Cadastrar vídeo")).should("be.visible");

    cy.get(SELECTORS.modal("Cadastrar vídeo"))
      .find("input")
      .first()
      .type(VIDEO_URL);
    cy.get(SELECTORS.button("Salvar")).click();
    shell.expectToast("success", "Vídeo cadastrado!");

    cy.get(VIDEO_CARD, { timeout: 60000 }).should("have.length.at.least", 1);

    cy.get(VIDEO_CARD).first().click();
    cy.get('button[aria-label="Remover vídeo"]').should("be.visible");

    cy.get(VIDEO_CARD).then(($cards) => {
      if ($cards.length > 1) {
        cy.get('button[aria-label="Próximo vídeo"]').click();
        cy.get('button[aria-label="Vídeo anterior"]').click();
      }
    });

    cy.get('button[aria-label="Remover vídeo"]').first().click();
    cy.get(SELECTORS.dialog("Remover vídeo")).should("be.visible");
    cy.get(SELECTORS.button("Cancelar")).click();
    cy.get(SELECTORS.anyDialog).should("not.exist");

    cy.get('button[aria-label="Remover vídeo"]').first().click();
    cy.get(SELECTORS.button("Remover")).click();
    shell.expectToast("success");
  });
});
