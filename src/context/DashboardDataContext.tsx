"use client";

import { BannerService } from "@/services/BannerService";
import { ChargeServices } from "@/services/ChargeService";
import { CommitmentService } from "@/services/CommitmentService";
import { IBanner } from "@/types/Banner";
import { IGoalProgress } from "@/types/Charge";
import { ICommitment } from "@/types/Commitment";
import { AuthContext } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";

// Dados dos cards da Dashboard (banners, meta da comunidade, compromissos) não
// mudam a cada troca de aba — buscá-los de novo toda vez que a página remonta
// (ao voltar para "Início") é desperdício. Este provider é montado uma vez em
// providers.tsx (acima do router, ao lado da tela de login), então a busca só
// pode disparar quando `isLoggedIn` fica true — buscar no mount incondicional
// significa buscar antes do login existir, sem token, e nunca mais (deps []).

interface DashboardDataContextValue {
  banners: IBanner[];
  bannersLoading: boolean;
  goalProgress: IGoalProgress | null;
  goalLoading: boolean;
  commitments: ICommitment[];
  commitmentsLoading: boolean;
  refetchBanners: () => Promise<void>;
  refetchCommitments: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue>({
  banners: [],
  bannersLoading: true,
  goalProgress: null,
  goalLoading: true,
  commitments: [],
  commitmentsLoading: true,
  refetchBanners: async () => {},
  refetchCommitments: async () => {},
});

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useContext(AuthContext);
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [goalProgress, setGoalProgress] = useState<IGoalProgress | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [commitments, setCommitments] = useState<ICommitment[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setBanners([]);
      setBannersLoading(true);
      setGoalProgress(null);
      setGoalLoading(true);
      setCommitments([]);
      setCommitmentsLoading(true);
      return;
    }

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
  }, [isLoggedIn]);

  async function refetchBanners() {
    try {
      setBanners(await BannerService.list());
    } catch {
      setBanners([]);
    }
  }

  async function refetchCommitments() {
    try {
      setCommitments(await CommitmentService.list());
    } catch {
      setCommitments([]);
    }
  }

  return (
    <DashboardDataContext.Provider
      value={{
        banners,
        bannersLoading,
        goalProgress,
        goalLoading,
        commitments,
        commitmentsLoading,
        refetchBanners,
        refetchCommitments,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
