export const SELECTORS = {
  loadingScreen: "[data-loading-screen]",
  toastHost: "[data-toast-host]",
  toast: (type: "success" | "error" | "warning" | "notification") =>
    `[data-toast="${type}"]`,
  anyToast: "[data-toast]",
  pwaBanner: "[data-pwa-banner]",

  sidebar: "[data-sidebar]",
  sidebarNavItem: (name: string) => `[data-nav-item="${name}"]`,
  sidebarNavLabel: (label: string) => `[data-nav-label="${label}"]`,
  sidebarUserRole: "[data-user-role]",
  sidebarUserName: "[data-user-name]",

  tabbar: "[data-tabbar]",
  tab: (name: string) => `[data-tab="${name}"]`,

  breadcrumb: 'nav[aria-label="Caminho"]',
  header: "[data-header]",

  actionItem: (title: string) => `[data-action-item="${title}"]`,
  button: (title: string) => `[data-button="${title}"]`,
  modal: (title: string) => `[data-modal="${title}"]`,
  anyModal: "[data-modal]",
  dialog: (title: string) => `[data-dialog="${title}"]`,
  anyDialog: "[data-dialog]",

  field: (label: string) => `[data-field="${label}"] input`,
  fieldError: (label: string) => `[data-field="${label}"] p`,
  select: (label: string) => `[data-select="${label}"]`,
  selectOption: (value: string) => `[data-select-option="${value}"]`,

  dashboardCard: (id: string) => `[data-card="${id}"]`,
  guestCard: "[data-guest-card]",

  memberRow: (email: string) => `[data-member-row="${email}"]`,
  memberCard: (email: string) => `[data-member-card="${email}"]`,
  roleFilter: (role: string) => `[data-role-filter="${role}"]`,

  loginEmail: "#login-email",
  loginPassword: "#login-password",
  loginSubmit: 'form button[type="submit"]',
} as const;

export const ADMIN_TOOLS = {
  arrecadacao: "Entrada mensal",
  balancoAnual: "Balanço anual",
  expenses: "Despesa mensal",
  donations: "Listagem de doações",
  memberActions: "Gestão de membros",
  sendNotification: "Enviar notificação",
} as const;

export const MEMBER_ACTIONS = {
  remove: "Remover membro",
  accessLevels: "Níveis de acesso",
  cashPayment: "Registrar pagamento em dinheiro",
  changePassword: "Atualizar senha de membro",
  guestVisibility: "Visibilidade do convidado",
} as const;
