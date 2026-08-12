import { ADMIN_TOOLS, MEMBER_ACTIONS, SELECTORS } from "../selectors";

export const adminHub = {
  tools: ADMIN_TOOLS,
  memberActions: MEMBER_ACTIONS,

  open: () => {
    cy.viewportDesktop();
    cy.visitApp("/settings");
    cy.contains("h1", "Administrativo").should("be.visible");
  },

  kpiTiles: () => cy.get(".tile"),

  openTool: (title: string) => {
    cy.get(SELECTORS.actionItem(title)).should("be.visible").click();
  },

  backToHub: () => {
    cy.get(SELECTORS.breadcrumb).contains("button", "Administrativo").click();
  },

  expectDetail: (title: string) => {
    cy.get(SELECTORS.breadcrumb).should("contain.text", title);
  },

  closeModal: () => {
    cy.get('button[aria-label="Fechar"]').first().click({ force: true });
    cy.get(SELECTORS.anyModal).should("not.exist");
  },
};
