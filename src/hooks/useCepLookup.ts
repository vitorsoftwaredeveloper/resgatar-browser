import { ToastMessage } from "@/components/Toast";
import { onlyNumbers } from "@/utils/mask";
import { useState } from "react";

// Portado de resgatar_app/src/hooks/useCepLookup.ts (idêntico — fetch puro,
// sem dependência nativa).

interface CepResult {
  street: string;
  city: string;
  state: string;
}

interface UseCepLookupResult {
  loading: boolean;
  fetchCep: (cep: string) => Promise<CepResult | null>;
}

export function useCepLookup(): UseCepLookupResult {
  const [loading, setLoading] = useState(false);

  async function fetchCep(cep: string): Promise<CepResult | null> {
    const digits = onlyNumbers(cep);
    if (digits.length !== 8) return null;

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        ToastMessage.error("CEP não encontrado", "Verifique o CEP informado.");
        return null;
      }

      return {
        street: data.logradouro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    } catch {
      ToastMessage.error("Erro", "Não foi possível consultar o CEP.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, fetchCep };
}
