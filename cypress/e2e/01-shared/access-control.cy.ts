import { ALL_ROLES, ALL_ROUTES, RouteRule } from "../../support/roles";

function allowedRoutes(role: (typeof ALL_ROLES)[number]): RouteRule[] {
  return ALL_ROUTES.filter((route) => route.allowedFor.includes(role));
}

function deniedRoutes(role: (typeof ALL_ROLES)[number]): RouteRule[] {
  return ALL_ROUTES.filter((route) => !route.allowedFor.includes(role));
}

describe("Controle de acesso por papel", () => {
  describe("Sem sessão", () => {
    ALL_ROUTES.forEach((route) => {
      it(`manda ${route.path} para o login`, () => {
        cy.expectRedirect(route.path, "/login");
      });
    });
  });

  ALL_ROLES.forEach((role) => {
    describe(`Papel ${role}`, () => {
      beforeEach(() => {
        cy.loginAs(role);
        cy.viewportMobile();
      });

      allowedRoutes(role).forEach((route) => {
        it(`permite ${route.path} (${route.name})`, () => {
          cy.visitApp(route.path);
          cy.location("pathname").should("eq", route.path);
        });
      });

      deniedRoutes(role).forEach((route) => {
        it(`bloqueia ${route.path} e redireciona para ${route.redirectsTo}`, () => {
          cy.visit(route.path);
          cy.location("pathname", { timeout: 60000 }).should(
            "eq",
            route.redirectsTo,
          );
        });
      });
    });
  });
});
