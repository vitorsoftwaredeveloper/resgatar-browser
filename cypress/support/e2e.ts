import "@cypress/code-coverage/support";
import "./commands";

const IGNORED_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /NEXT_REDIRECT/i,
  /Failed to register a ServiceWorker/i,
  /messaging\/unsupported-browser/i,
  /Hydration failed/i,
];

Cypress.on("uncaught:exception", (error) => {
  const message = String(error?.message ?? "");
  if (IGNORED_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }
  return true;
});

beforeEach(() => {
  cy.viewportDesktop();
});
