export const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

export const MONTH_LABELS: Record<MonthKey, string> = {
  january: "Janeiro",
  february: "Fevereiro",
  march: "Março",
  april: "Abril",
  may: "Maio",
  june: "Junho",
  july: "Julho",
  august: "Agosto",
  september: "Setembro",
  october: "Outubro",
  november: "Novembro",
  december: "Dezembro",
};

export const PAID_AT = "2026-06-04T12:53:14";
export const PAID_AT_LABEL = "04/06/2026";
export const CHARGE_AMOUNT_LABEL = "1,00";
export const MONTH_VALUE = 1;

interface MonthOverride {
  key: MonthKey;
  paid: boolean;
  value?: number;
  paymentMethod?: "pix" | "cash";
}

interface StoredMember {
  contributions?: { year?: number; months?: Record<string, unknown> };
  [key: string]: unknown;
}

function apiHost(): string {
  return new URL(String(Cypress.env("apiBaseUrl"))).host.replace(/\./g, "\\.");
}

export function apiRoute(pattern: string): RegExp {
  return new RegExp(apiHost() + pattern);
}

export const CHARGE_ROUTES = {
  create: "\\/charges($|\\?)",
  consult: "\\/charges\\/[0-9]+",
  member: "\\/members($|\\?)",
} as const;

function buildMonths(overrides: MonthOverride[]) {
  const months: Record<string, unknown> = {};

  MONTH_KEYS.forEach((key) => {
    months[key] = {
      paid: false,
      value: MONTH_VALUE,
      paidAt: "",
      paymentMethod: "pix",
    };
  });

  overrides.forEach((override) => {
    months[override.key] = {
      paid: override.paid,
      value: override.value ?? MONTH_VALUE,
      paidAt: override.paid ? PAID_AT : "",
      paymentMethod: override.paymentMethod ?? "pix",
    };
  });

  return months;
}

export function storedMember(): Cypress.Chainable<StoredMember> {
  return cy.getAllLocalStorage().then((all) => {
    const origin = String(Cypress.config("baseUrl")).replace(/\/+$/, "");
    const raw = (all[origin] ?? {})["@auth:member"];
    expect(raw, "membro em cache da sessão").to.be.a("string");
    return JSON.parse(String(raw)) as StoredMember;
  });
}

export function stubMemberMonths(overrides: MonthOverride[], alias = "membro") {
  storedMember().then((member) => {
    const body = {
      data: {
        ...member,
        contributions: {
          ...(member.contributions ?? {}),
          year: member.contributions?.year ?? new Date().getFullYear(),
          months: buildMonths(overrides),
        },
      },
    };

    cy.intercept(
      { method: "GET", url: apiRoute(CHARGE_ROUTES.member) },
      { statusCode: 200, body },
    ).as(alias);
  });
}

export function stubCreateCharge(fixture: string, alias = "criarCobranca") {
  cy.intercept(
    { method: "POST", url: apiRoute(CHARGE_ROUTES.create) },
    { statusCode: 201, fixture },
  ).as(alias);
}

export function failCreateCharge(alias = "criarCobrancaFalha") {
  cy.intercept(
    { method: "POST", url: apiRoute(CHARGE_ROUTES.create) },
    { statusCode: 500, body: {} },
  ).as(alias);
}

export function stubConsultCharge(fixture: string, alias = "consultarCobranca") {
  cy.intercept(
    { method: "GET", url: apiRoute(CHARGE_ROUTES.consult) },
    { statusCode: 200, fixture },
  ).as(alias);
}

export function failConsultCharge(alias = "consultarCobrancaFalha") {
  cy.intercept(
    { method: "GET", url: apiRoute(CHARGE_ROUTES.consult) },
    { statusCode: 500, body: {} },
  ).as(alias);
}
