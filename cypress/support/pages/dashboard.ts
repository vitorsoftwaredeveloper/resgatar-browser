import { SELECTORS } from "../selectors";
import { RoleKey, isInternal } from "../roles";

export const DASHBOARD_CARDS = {
  guestHome: "guestHome",
  banners: "banners",
  notices: "notices",
  birthdays: "birthdays",
  streak: "streak",
  communityGoal: "communityGoal",
  recentVideos: "recentVideos",
  recentDonations: "recentDonations",
} as const;

export const dashboard = {
  open: () => {
    cy.visitApp("/dashboard");
    cy.get(SELECTORS.header).should("exist");
  },

  card: (id: string) => cy.get(SELECTORS.dashboardCard(id)),

  expectCard: (id: string) =>
    cy.get(SELECTORS.dashboardCard(id)).should("exist"),

  expectNoCard: (id: string) =>
    cy.get(SELECTORS.dashboardCard(id)).should("not.exist"),

  expectCardsForRole: (role: RoleKey) => {
    if (isInternal(role)) {
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.guestHome)).should(
        "not.exist",
      );
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.streak)).should("exist");
      cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.recentDonations)).should(
        "exist",
      );
      return;
    }

    cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.guestHome)).should("exist");
    cy.get(SELECTORS.dashboardCard(DASHBOARD_CARDS.recentDonations)).should(
      "not.exist",
    );
  },
};
