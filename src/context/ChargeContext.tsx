"use client";

import { ChargeServices } from "@/services/ChargeService";
import { ICharge } from "@/types/Charge";
import React, { createContext, useContext, useState } from "react";

// Portado de resgatar_app/src/context/ChargeContext.tsx. No app, o polling de
// fallback (enquanto não chega o push de confirmação) vivia aqui e era
// global. No web isso fazia a tela de contribuições continuar batendo em
// /charges e /members mesmo depois do modal de pagamento fechado, já que o
// `charge` pendente nunca era limpo. Por isso aqui o contexto só guarda o
// estado e expõe `consultCharge`; quem decide *quando* reconsultar é o dono do
// modal de pagamento (ver (tabs)/bills/page.tsx), rodando o polling apenas
// enquanto o modal está de fato visível.

interface ChargeContextData {
  charge: ICharge;
  createCharge: (month: number) => Promise<void>;
  consultCharge: (transactionId: string) => Promise<void>;
}

const ChargeContext = createContext<ChargeContextData>(
  {} as ChargeContextData,
);

export const ChargeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [charge, setCharge] = useState({} as ICharge);

  async function createCharge(month: number) {
    try {
      const created = await ChargeServices.createCharge(month);
      setCharge(created);
    } catch (error) {
      console.error("Error creating charge", error);
      throw error;
    }
  }

  async function consultCharge(transactionId: string) {
    try {
      const chargeResult = await ChargeServices.consultCharge(transactionId);
      setCharge(chargeResult);
    } catch (error) {
      console.error("Error consulting charge", error);
      throw error;
    }
  }

  return (
    <ChargeContext.Provider value={{ charge, createCharge, consultCharge }}>
      {children}
    </ChargeContext.Provider>
  );
};

export function useCharge() {
  return useContext(ChargeContext);
}
