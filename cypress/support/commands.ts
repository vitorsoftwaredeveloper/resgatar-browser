import { RoleKey } from "./roles";
import { SELECTORS } from "./selectors";
import { getUser, registrationPayload } from "./users";
import { TestUser } from "./roles";

export const VIEWPORT = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
} as const;

function apiUrl(path: string): string {
  const base = String(Cypress.env("apiBaseUrl") ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
}

Cypress.Commands.add("viewportMobile", () => {
  cy.viewport(VIEWPORT.mobile.width, VIEWPORT.mobile.height);
});

Cypress.Commands.add("viewportDesktop", () => {
  cy.viewport(VIEWPORT.desktop.width, VIEWPORT.desktop.height);
});

Cypress.Commands.add("dismissBanners", () => {
  cy.get("body").then(($body) => {
    if ($body.find(SELECTORS.pwaBanner).length === 0) return;
    cy.get(SELECTORS.pwaBanner)
      .find('button[aria-label^="Fechar"]')
      .click({ force: true });
    cy.get(SELECTORS.pwaBanner).should("not.exist");
  });
});

Cypress.Commands.add("visitApp", (path: string) => {
  cy.visit(path);
  cy.get(SELECTORS.loadingScreen, { timeout: 60000 }).should("not.exist");
  cy.dismissBanners();
});

Cypress.Commands.add("completeOnboardingIfNeeded", () => {
  cy.location("pathname", { timeout: 60000 }).should((pathname) => {
    expect(["/onboarding", "/dashboard"]).to.include(pathname);
  });

  cy.location("pathname").then((pathname) => {
    if (pathname === "/onboarding") {
      cy.get(SELECTORS.button("Continuar")).click();
    }
  });

  cy.location("pathname", { timeout: 60000 }).should("eq", "/dashboard");
});

Cypress.Commands.add("loginViaUi", (email: string, password: string) => {
  cy.visit("/login");
  cy.get(SELECTORS.loginEmail, { timeout: 60000 })
    .should("be.visible")
    .clear()
    .type(email);
  cy.get(SELECTORS.loginPassword).clear().type(password, { log: false });
  cy.get(SELECTORS.loginSubmit).click();
});

Cypress.Commands.add("loginAs", (role: RoleKey) => {
  const user = getUser(role);

  cy.session(
    ["resgatar", role, user.email],
    () => {
      cy.loginViaUi(user.email, user.password);
      cy.completeOnboardingIfNeeded();
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.getAllLocalStorage().then((storages) => {
          const origin = String(Cypress.config("baseUrl")).replace(/\/+$/, "");
          const store = storages[origin] ?? {};
          expect(store["@auth:member"], "membro autenticado em cache").to.be.a(
            "string",
          );
        });
      },
    },
  );
});

Cypress.Commands.add("logoutViaUi", () => {
  cy.viewportMobile();
  cy.visitApp("/profile");
  cy.contains("button", "Sair da conta").click();
  cy.get(SELECTORS.dialog("Tem certeza que deseja sair?")).should("be.visible");
  cy.get(SELECTORS.button("sair")).click();
  cy.location("pathname", { timeout: 60000 }).should("eq", "/login");
});

Cypress.Commands.add("apiRegisterMember", (user: TestUser) => {
  cy.request({
    method: "POST",
    url: apiUrl("/members"),
    body: registrationPayload(user),
    failOnStatusCode: false,
  }).then((response) => {
    const created = response.status >= 200 && response.status < 300;
    const alreadyExists = response.status === 400 || response.status === 409;

    expect(
      created || alreadyExists,
      `cadastro de ${user.email} (status ${response.status}): ${JSON.stringify(
        response.body,
      )}`,
    ).to.eq(true);

    cy.task(
      "log",
      created
        ? `[e2e] usuário criado: ${user.email}`
        : `[e2e] usuário já existia: ${user.email}`,
    );
  });
});

Cypress.Commands.add("openAdminTool", (title: string) => {
  cy.viewportDesktop();
  cy.visitApp("/settings");
  cy.get(SELECTORS.actionItem(title), { timeout: 60000 })
    .should("be.visible")
    .click();
});

Cypress.Commands.add("openMemberActionModal", (title: string) => {
  cy.openAdminTool("Gestão de membros");
  cy.get(SELECTORS.actionItem(title)).should("be.visible").click();
});

Cypress.Commands.add(
  "setMemberRole",
  (email: string, nextRole: "guest" | "user" | "admin") => {
    cy.openMemberActionModal("Níveis de acesso");
    cy.get(SELECTORS.modal("Níveis de acesso")).should("be.visible");

    cy.get(SELECTORS.memberRow(email), { timeout: 60000 })
      .should("exist")
      .scrollIntoView();

    cy.get(SELECTORS.memberRow(email)).then(($row) => {
      if ($row.attr("data-member-role") === nextRole) {
        cy.task("log", `[e2e] ${email} já está como ${nextRole}`);
        return;
      }

      cy.wrap($row).find("[data-select]").click();
      cy.wrap($row).find(SELECTORS.selectOption(nextRole)).click();

      cy.get(SELECTORS.dialog("Alterar nível de acesso?")).should("be.visible");
      cy.get(SELECTORS.button("confirmar")).click();

      cy.get(SELECTORS.toast("success")).should("be.visible");
      cy.get(SELECTORS.memberRow(email)).should(
        "have.attr",
        "data-member-role",
        nextRole,
      );
    });
  },
);

Cypress.Commands.add("expectRedirect", (from: string, to: string) => {
  cy.visit(from);
  cy.location("pathname", { timeout: 60000 }).should("eq", to);
});

export {};
