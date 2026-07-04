"use client";

import { BannerService } from "@/services/BannerService";
import { ChargeServices } from "@/services/ChargeService";
import { CommitmentService } from "@/services/CommitmentService";
import { IBanner } from "@/types/Banner";
import { IGoalProgress } from "@/types/Charge";
import { ICommitment } from "@/types/Commitment";
import React, { createContext, useContext, useEffect, useState } from "react";

// Dados dos cards da Dashboard (banners, meta da comunidade, compromissos) não
// mudam a cada troca de aba — buscá-los de novo toda vez que a página remonta
// (ao voltar para "Início") é desperdício. Igual ao BirthdayContext, este
// provider é montado uma vez em providers.tsx (acima do router), busca tudo
// uma única vez por sessão e mantém em memória enquanto o app está aberto.

interface DashboardDataContextValue {
  banners: IBanner[];
  bannersLoading: boolean;
  goalProgress: IGoalProgress | null;
  goalLoading: boolean;
  commitments: ICommitment[];
  commitmentsLoading: boolean;
}

const DashboardDataContext = createContext<DashboardDataContextValue>({
  banners: [],
  bannersLoading: true,
  goalProgress: null,
  goalLoading: true,
  commitments: [],
  commitmentsLoading: true,
});

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [goalProgress, setGoalProgress] = useState<IGoalProgress | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [commitments, setCommitments] = useState<ICommitment[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(true);

  useEffect(() => {
    BannerService.list()
      .then(setBanners)
      .catch(() => setBanners([]))
      .finally(() => setBannersLoading(false));

    ChargeServices.getGoalProgress()
      .then(setGoalProgress)
      .catch(() => setGoalProgress(null))
      .finally(() => setGoalLoading(false));

    CommitmentService.list()
      .then(setCommitments)
      .catch(() => setCommitments([]))
      .finally(() => setCommitmentsLoading(false));
  }, []);

  return (
    <DashboardDataContext.Provider
      value={{ banners, bannersLoading, goalProgress, goalLoading, commitments, commitmentsLoading }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
