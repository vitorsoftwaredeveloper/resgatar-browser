import { SELECTORS } from "../selectors";

export const shell = {
  sidebar: () => cy.get(SELECTORS.sidebar),
  navItem: (name: string) => cy.get(SELECTORS.sidebarNavItem(name)),
  navLabel: (label: string) => cy.get(SELECTORS.sidebarNavLabel(label)),
  roleBadge: () => cy.get(SELECTORS.sidebarUserRole),
  tabbar: () => cy.get(SELECTORS.tabbar),
  tab: (name: string) => cy.get(SELECTORS.tab(name)),
  breadcrumb: () => cy.get(SELECTORS.breadcrumb),
  expectBreadcrumb: (label: string) =>
    cy.get(SELECTORS.breadcrumb).should("contain.text", label),
  toggleTheme: () => cy.get('button[aria-label="Alternar tema"]').click(),
  themeMode: () =>
    cy.document().then((doc) => doc.documentElement.dataset.theme),
  collapseSidebar: () =>
    cy.get('button[aria-label="Recolher menu"]').click({ force: true }),
  expandSidebar: () =>
    cy.get('button[aria-label="Expandir menu"]').click({ force: true }),
  expectToast: (
    type: "success" | "error" | "warning" | "notification",
    text?: string,
  ) => {
    const toast = cy.get(SELECTORS.toast(type), { timeout: 20000 });
    return text ? toast.should("contain.text", text) : toast.should("exist");
  },
};
