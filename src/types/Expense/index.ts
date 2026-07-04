// Portado de resgatar_app/src/types/Expense/index.ts (idêntico).

const EXPENSE_CATEGORIES = {
  MAINTENANCE: "maintenance",
  EVENT: "event",
  MATERIAL: "material",
  FOOD: "food",
  DONATION: "donation",
  UTILITIES: "utilities",
  TRANSPORT: "transport",
  OTHER: "other",
} as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];

const EXPENSE_CATEGORY_VALUES = Object.values(EXPENSE_CATEGORIES) as ExpenseCategory[];

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  maintenance: "Manutenção",
  event: "Evento",
  material: "Material",
  food: "Alimentação",
  donation: "Doação",
  utilities: "Contas/Utilidades",
  transport: "Transporte",
  other: "Outros",
};

interface ICreateExpensePayload {
  description: string;
  amount: string;
  category: ExpenseCategory;
  referenceMonth: number;
  referenceYear: number;
  date: number;
  note?: string;
  receiptKey?: string;
}

type IEditExpensePayload = Partial<Omit<ICreateExpensePayload, "receiptKey">> & {
  receiptKey?: string | null;
};

interface IExpense {
  _id: string;
  description: string;
  amount: string;
  category: ExpenseCategory;
  referenceMonth: number;
  referenceYear: number;
  date: number;
  note?: string;
  receiptKey?: string;
  adminId: string;
}

interface IExpensesSummary {
  year: number;
  month: number;
  total: number;
  count: number;
  byCategory: Record<string, number>;
  expenses: IExpense[];
}

export type { ExpenseCategory, ICreateExpensePayload, IEditExpensePayload, IExpense, IExpensesSummary };
export { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_VALUES, EXPENSE_CATEGORY_LABELS };
