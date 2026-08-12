import type { mount } from "cypress/react";
import type { RoleKey, TestUser } from "./roles";

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      viewportMobile(): Chainable<void>;
      viewportDesktop(): Chainable<void>;
      dismissBanners(): Chainable<void>;
      visitApp(path: string): Chainable<void>;
      completeOnboardingIfNeeded(): Chainable<void>;
      loginViaUi(email: string, password: string): Chainable<void>;
      loginAs(role: RoleKey): Chainable<void>;
      logoutViaUi(): Chainable<void>;
      apiRegisterMember(user: TestUser): Chainable<void>;
      openAdminTool(title: string): Chainable<void>;
      openMemberActionModal(title: string): Chainable<void>;
      setMemberRole(
        email: string,
        nextRole: "guest" | "user" | "admin",
      ): Chainable<void>;
      expectRedirect(from: string, to: string): Chainable<void>;
    }
  }
}

export {};
