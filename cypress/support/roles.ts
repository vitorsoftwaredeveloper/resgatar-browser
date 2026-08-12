export type RoleKey = "admin" | "member" | "guest";

export interface TestUser {
  role: RoleKey;
  persistedRole: "admin" | "user" | "guest";
  label: string;
  sidebarRoleLabel: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
  birthDate: string;
}

export interface RouteRule {
  path: string;
  name: string;
  allowedFor: RoleKey[];
  redirectsTo: string;
}

export const INTERNAL_ROLES: RoleKey[] = ["admin", "member"];
export const ALL_ROLES: RoleKey[] = ["admin", "member", "guest"];

export const ADMIN_ROUTES: RouteRule[] = [
  {
    path: "/settings",
    name: "Administrativo",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
  {
    path: "/arrecadacao",
    name: "Entrada mensal",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
  {
    path: "/balanco-anual",
    name: "Balanço anual",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
  {
    path: "/expenses",
    name: "Despesa mensal",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
  {
    path: "/donations",
    name: "Listagem de doações",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
  {
    path: "/member-actions",
    name: "Gestão de membros",
    allowedFor: ["admin"],
    redirectsTo: "/dashboard",
  },
];

export const INTERNAL_ROUTES: RouteRule[] = [
  {
    path: "/bills",
    name: "Contribuições",
    allowedFor: INTERNAL_ROLES,
    redirectsTo: "/dashboard",
  },
];

export const AUTHENTICATED_ROUTES: RouteRule[] = [
  {
    path: "/dashboard",
    name: "Início",
    allowedFor: ALL_ROLES,
    redirectsTo: "/login",
  },
  {
    path: "/readings",
    name: "Leituras",
    allowedFor: ALL_ROLES,
    redirectsTo: "/login",
  },
  {
    path: "/videos",
    name: "Vídeos",
    allowedFor: ALL_ROLES,
    redirectsTo: "/login",
  },
  {
    path: "/personal-settings",
    name: "Configurações pessoais",
    allowedFor: ALL_ROLES,
    redirectsTo: "/login",
  },
];

export const ALL_ROUTES: RouteRule[] = [
  ...AUTHENTICATED_ROUTES,
  ...INTERNAL_ROUTES,
  ...ADMIN_ROUTES,
];

export function isInternal(role: RoleKey): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function isAdmin(role: RoleKey): boolean {
  return role === "admin";
}

export function sidebarLinksFor(role: RoleKey): string[] {
  const community = ["Início", "Leituras", "Vídeos"];
  if (isInternal(role)) community.splice(2, 0, "Contribuições");
  const management = isAdmin(role)
    ? ["Administrativo", "Configurações pessoais"]
    : ["Configurações pessoais"];
  return [...community, ...management];
}

export function tabLabelsFor(role: RoleKey): string[] {
  return isInternal(role)
    ? ["Início", "Leituras", "Contribuições", "Mais"]
    : ["Início", "Leituras", "Mais"];
}
