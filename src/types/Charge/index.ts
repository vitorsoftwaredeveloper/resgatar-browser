// Portado de resgatar_app/src/types/Charge/index.ts (idêntico).

interface ICharge {
  transactionId: string;
  memberId: string;
  status: string;
  statusDetail: string;
  transactionAmount: number;
  paymentMethodId: string;
  currencyId: string;
  dateCreated: string;
  dateOfExpiration: string;
  dateApproved?: string;
  payer: {
    firstName: string;
    lastName: string;
    email: string;
    identification: {
      type: string;
      numberType: string;
    };
  };
  transactionData: {
    qrCode: string;
    qrCodeBase64?: string;
    ticketUrl: string;
  };
}

interface IChargeSummaryMember {
  id: string;
  name: string;
  photo?: string | null;
  paid: boolean;
  method?: "pix" | "cash";
  paidAt?: string;
  amount: number;
}

interface IChargeSummary {
  goal: number;
  collected: number;
  remaining: number;
  byMethod: {
    pix: number;
    cash: number;
  };
  counts: {
    paid: number;
    pending: number;
    total: number;
  };
  members: IChargeSummaryMember[];
}

interface IGoalDonationItem {
  transactionId: string;
  donorName: string;
  amount: number;
  paymentMethodId: string;
  dateApproved: string;
}

interface IGoalExpenseItem {
  _id: string;
  description: string;
  amount: number;
  category: string;
  referenceMonth: number;
  referenceYear: number;
  date: string;
  note?: string;
  receiptKey?: string;
  adminId: string;
}

interface IGoalProgress {
  year: number;
  month: number;
  goal: number; // dues + donations − expenses
  dues: number;
  collected: number;
  donations: number; // total
  expenses: number; // total
  remaining: number;
  percent: number;
  donationItems: IGoalDonationItem[];
  expenseItems: IGoalExpenseItem[];
}

interface IAnnualMethodSplit {
  pix: number;
  cash: number;
}

interface IAnnualByMonth {
  month: number;
  goal: number;
  collected: number;
  remaining: number;
  percent: number;
  counts: {
    paid: number;
    pending: number;
    total: number;
  };
  byMethod: IAnnualMethodSplit;
}

interface IAnnualByMember {
  id: string;
  name: string;
  photo?: string | null;
  status: string;
  monthsPaid: number;
  monthsPending: number;
  totalPaid: number;
  totalDue: number;
  byMethod: IAnnualMethodSplit;
}

interface IAnnualSummary {
  year: number;
  asOfMonth: number;
  totals: {
    goal: number;
    collected: number;
    remaining: number;
    percent: number;
    byMethod: IAnnualMethodSplit;
    counts: {
      paid: number;
      pending: number;
    };
  };
  byMonth: IAnnualByMonth[];
  byMember: IAnnualByMember[];
}

const TRANSACTION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back",
};

const RETURNED_TRANSACTION_STATUSES: string[] = [
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.CHARGED_BACK,
];

const isReturnedTransaction = (status?: string): boolean =>
  status != null && RETURNED_TRANSACTION_STATUSES.includes(status);

const PAYMENT_NOTIFICATION_TYPE = "PAYMENT_UPDATE";

const PAYMENT_CONFIRMED_NOTIFICATION_TYPE = "PAYMENT_CONFIRMED";

export type {
  ICharge,
  IChargeSummary,
  IChargeSummaryMember,
  IGoalProgress,
  IGoalDonationItem,
  IGoalExpenseItem,
  IAnnualSummary,
  IAnnualByMonth,
  IAnnualByMember,
};
export {
  TRANSACTION_STATUS,
  isReturnedTransaction,
  PAYMENT_NOTIFICATION_TYPE,
  PAYMENT_CONFIRMED_NOTIFICATION_TYPE,
};
