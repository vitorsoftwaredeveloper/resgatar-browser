// Portado de resgatar_app/src/types/Balance/index.ts (idêntico).

interface IAnnualBalanceMonth {
  month: number;
  entradas: number;
  doacoes: number;
  saidas: number;
  resultado: number;
  saldoAcumulado: number;
}

interface IAnnualBalance {
  year: number;
  asOfMonth: number;
  totals: {
    entradas: number;
    doacoes: number;
    saidas: number;
    resultado: number;
    saldoFinal: number;
  };
  byMonth: IAnnualBalanceMonth[];
  expensesByCategory: Record<string, number>;
}

export type { IAnnualBalance, IAnnualBalanceMonth };
