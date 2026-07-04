// Portado de resgatar_app/src/types/Liturgy/index.ts (idêntico).

export type LiturgicalColor = "Verde" | "Roxo" | "Branco" | "Vermelho" | "Rosa";

export interface ILiturgiaLeitura {
  referencia: string;
  titulo: string;
  texto: string;
}

export interface ILiturgiaSalmo {
  referencia: string;
  refrao?: string;
  texto: string;
}

export interface ILiturgiaLeituras {
  primeiraLeitura: ILiturgiaLeitura;
  salmo: ILiturgiaSalmo;
  segundaLeitura?: ILiturgiaLeitura;
  evangelho: ILiturgiaLeitura;
  extras?: ILiturgiaLeitura[];
}

export interface ILiturgiaOracoes {
  coleta?: string;
  oferendas?: string;
  comunhao?: string;
  extras?: string[];
}

export interface ILiturgia {
  data: string;
  liturgia: string;
  cor: LiturgicalColor;
  leituras: ILiturgiaLeituras;
  oracoes?: ILiturgiaOracoes;
  antifonas?: {
    entrada?: string;
    comunhao?: string;
  };
}

export const LITURGICAL_ACCENT: Record<LiturgicalColor, string> = {
  Verde: "#2E7D32",
  Roxo: "#7B1FA2",
  Branco: "#B8860B",
  Vermelho: "#C62828",
  Rosa: "#AD1457",
};

export const LITURGICAL_BG: Record<LiturgicalColor, string> = {
  Verde: "#E8F5E9",
  Roxo: "#F3E5F5",
  Branco: "#FFF8E1",
  Vermelho: "#FFEBEE",
  Rosa: "#FCE4EC",
};
