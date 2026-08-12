import {
  ALL_ROLES,
  isAdmin,
  isInternal,
  sidebarLinksFor,
  tabLabelsFor,
} from "../../support/roles";
import { SELECTORS } from "../../support/selectors";
import { shell } from "../../support/pages/shell";

function navegarPelaSidebar(name: string, path: string) {
  shell.sidebar().should("have.attr", "data-collapsed", "false");
  shell.navItem(name).should("have.attr", "href", path);
  shell.navItem(name).click();
  cy.location("pathname", { timeout: 30000 }).should("eq", path);
}

describe("Navegação", () => {
  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role} · desktop`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.viewportDesktop();
        cy.visitApp("/dashboard");
      });

      it("mostra exatamente os itens de menu do papel", () => {
        const expected = sidebarLinksFor(role);

        shell
          .sidebar()
          .find("[data-nav-label]")
          .should("have.length", expected.length)
          .then(($items) => {
            const labels = $items.toArray().map((el) => el.dataset.navLabel);
            expect(labels).to.deep.eq(expected);
          });
      });

      it("esconde Contribuições de quem não é membro interno", () => {
        const assertion = isInternal(role) ? "exist" : "not.exist";
        shell.sidebar().find(SELECTORS.sidebarNavItem("Bills")).should(assertion);
      });

      it("esconde o Administrativo de quem não é admin", () => {
        const assertion = isAdmin(role) ? "exist" : "not.exist";
        shell
          .sidebar()
          .find(SELECTORS.sidebarNavItem("Settings"))
          .should(assertion);
      });

      it("navega para Leituras pelo menu lateral", () => {
        navegarPelaSidebar("Readings", "/readings");
        shell.expectBreadcrumb("Leituras");
      });

      it("navega para Vídeos pelo menu lateral", () => {
        navegarPelaSidebar("Videos", "/videos");
        shell.expectBreadcrumb("Vídeos");
      });

      it("navega para Configurações pessoais pelo menu lateral", () => {
        navegarPelaSidebar("PersonalSettings", "/personal-settings");
        shell.expectBreadcrumb("Configurações pessoais");
      });

      it("recolhe e expande o menu lateral", () => {
        shell.collapseSidebar();
        shell.sidebar().should("have.attr", "data-collapsed", "true");
        shell.expandSidebar();
        shell.sidebar().should("have.attr", "data-collapsed", "false");
      });

      it("manda /profile para Configurações pessoais no desktop", () => {
        cy.visit("/profile");
        cy.location("pathname", { timeout: 60000 }).should(
          "eq",
          "/personal-settings",
        );
      });
    });

    describe(`Papel ${role} · mobile`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.viewportMobile();
        cy.visitApp("/dashboard");
      });

      it("mostra a barra de abas do papel", () => {
        const expected = tabLabelsFor(role);

        shell
          .tabbar()
          .find("[data-tab]")
          .should("have.length", expected.length)
          .then(($tabs) => {
            const labels = $tabs.toArray().map((el) => el.innerText.trim());
            expect(labels).to.deep.eq(expected);
          });
      });

      it("não renderiza o menu lateral", () => {
        cy.get(SELECTORS.sidebar).should("not.exist");
      });

      it("navega entre as abas", () => {
        shell.tab("Readings").click();
        cy.location("pathname", { timeout: 30000 }).should("eq", "/readings");

        shell.tab("Profile").click();
        cy.location("pathname", { timeout: 30000 }).should("eq", "/profile");

        shell.tab("Dashboard").click();
        cy.location("pathname", { timeout: 30000 }).should("eq", "/dashboard");
      });

      it("abre a tela Mais com os atalhos do papel", () => {
        cy.visitApp("/profile");
        cy.get(SELECTORS.actionItem("Configurações pessoais")).should("exist");
        cy.get(SELECTORS.actionItem("Vídeos")).should("exist");
        cy.get(SELECTORS.actionItem("Rever tutorial")).should("exist");
        cy.get(SELECTORS.actionItem("Administrativo")).should(
          isAdmin(role) ? "exist" : "not.exist",
        );
      });
    });
  });
});
