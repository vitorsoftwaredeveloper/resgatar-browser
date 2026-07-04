import { getLiturgyCache, setLiturgyCache } from "@/storage/localStorage";
import { ILiturgia } from "@/types/Liturgy";
import { normalizeText } from "@/utils/helper";
import axios from "axios";

// Portado de resgatar_app/src/services/LiturgyService.ts (idêntico — API
// pública de liturgia diária, cache local por data).

const LITURGY_BASE = "https://liturgia.up.railway.app";

interface RawReading {
  referencia: string;
  titulo?: string;
  texto?: string;
}

interface RawSalmo {
  referencia: string;
  refrao?: string;
  texto?: string;
}

interface RawLiturgia {
  data: string;
  liturgia: string;
  cor: ILiturgia["cor"];
  leituras: {
    primeiraLeitura: RawReading | RawReading[];
    salmo: RawSalmo | RawSalmo[];
    segundaLeitura?: RawReading | RawReading[];
    evangelho: RawReading | RawReading[];
  };
  oracoes?: {
    coleta?: string;
    oferendas?: string;
    comunhao?: string;
  };
  antifonas?: { entrada?: string; comunhao?: string };
}

function first<T>(value: T | T[] | undefined): T | undefined {
  if (Array.isArray(value)) return value.length > 0 ? value[0] : undefined;
  return value;
}

function normalizeLiturgy(raw: RawLiturgia): ILiturgia {
  const normalizeReading = (r: RawReading | undefined) =>
    r
      ? {
          ...r,
          texto: normalizeText(r.texto ?? ""),
          titulo: normalizeText(r.titulo ?? ""),
        }
      : undefined;

  const salmo = first(raw.leituras.salmo)!;

  return {
    ...raw,
    leituras: {
      primeiraLeitura: normalizeReading(first(raw.leituras.primeiraLeitura))!,
      salmo: {
        ...salmo,
        texto: normalizeText(salmo.texto ?? ""),
        refrao: normalizeText(salmo.refrao ?? ""),
      },
      segundaLeitura: normalizeReading(first(raw.leituras.segundaLeitura)),
      evangelho: normalizeReading(first(raw.leituras.evangelho))!,
    },
    oracoes: raw.oracoes
      ? {
          coleta: normalizeText(raw.oracoes.coleta ?? ""),
          oferendas: normalizeText(raw.oracoes.oferendas ?? ""),
          comunhao: normalizeText(raw.oracoes.comunhao ?? ""),
        }
      : undefined,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const LiturgyService = {
  // `force` bypasses the daily cache — use only for explicit user refresh.
  async getToday(force = false): Promise<ILiturgia> {
    const key = todayKey();

    if (!force) {
      const cached = await getLiturgyCache<ILiturgia>(key);
      if (cached) return cached;
    }

    const { data } = await axios.get<RawLiturgia>(`${LITURGY_BASE}/v2/`);
    const liturgy = normalizeLiturgy(data);
    await setLiturgyCache(key, liturgy);
    return liturgy;
  },

  async getByDate(date: Date): Promise<ILiturgia> {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const { data } = await axios.get<RawLiturgia>(
      `${LITURGY_BASE}/v2/?dia=${day}&mes=${month}&ano=${year}`,
    );
    return normalizeLiturgy(data);
  },
};
