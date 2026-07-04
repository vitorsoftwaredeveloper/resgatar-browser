// Portado de resgatar_app/src/types/Member/index.ts (idêntico ao app).

export interface IMemberState {
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  bio: string;
  dateOfBirth: string | number;
  street: string;
  number: string;
  city: string;
  state: string;
  zip: string;
  complement: string;
  datePayment: string;
  amount: string;
  type: "CNPJ" | "CPF";
  numberType: string;
}

export interface IMember {
  _id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  dateOfBirth: number;
  address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zip?: string;
    complement?: string;
  };
  paymentInfo: {
    datePayment: number;
    amount: string;
  };
  identification: {
    type: "CPF" | "CNPJ";
    numberType: string;
  };
  role?: "admin" | "user";
  readingStreak?: {
    currentStreak: number;
    longestStreak: number;
    lastReadAt: string | null;
  };
}

export type IMemberWithContribution = IMember & {
  contributions: {
    year: number;
    months: Record<
      | "january"
      | "february"
      | "march"
      | "april"
      | "may"
      | "june"
      | "july"
      | "august"
      | "september"
      | "october"
      | "november"
      | "december",
      {
        paid: boolean;
        value: number;
        paidAt: string;
        paymentMethod?: "pix" | "cash";
      }
    >;
  };
};
