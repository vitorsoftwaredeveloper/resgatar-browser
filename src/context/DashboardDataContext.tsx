"use client";

import { BannerService } from "@/services/BannerService";
import { ChargeServices } from "@/services/ChargeService";
import { CommitmentService } from "@/services/CommitmentService";
import { DonationServices } from "@/services/DonationService";
import { VideoService } from "@/services/VideoService";
import { IBanner } from "@/types/Banner";
import { IGoalProgress, isReturnedTransaction } from "@/types/Charge";
import { ICommitment } from "@/types/Commitment";
import { IDonation } from "@/types/Donation";
import { IVideoFeedItem } from "@/types/Video";
import { AuthContext } from "@/context/AuthContext";
import { useDashboardVisibility } from "@/context/DashboardVisibilityContext";
import React, { createContext, useContext, useEffect, useState } from "react";

// Dados dos cards da Dashboard (banners, meta da comunidade, compromissos,
// aniversariantes, vídeos e doações recentes) não mudam a cada troca de aba —
// buscá-los de novo toda vez que a página remonta (ao voltar para "Início") é
// desperdício. Este provider é montado uma vez em providers.tsx (acima do
// router, ao lado da tela de login), então a busca só pode disparar quando
// `isLoggedIn` fica true — buscar no mount incondicional significa buscar
// antes do login existir, sem token, e nunca mais (deps []).

// Quantidade exibida no card "Vídeos recentes" — mesmo PAGE_SIZE não faria
// sentido aqui, é só uma prévia que linka pra /videos.
const RECENT_VIDEOS_LIMIT = 6;

interface DashboardDataContextValue {
  banners: IBanner[];
  bannersLoading: boolean;
  goalProgress: IGoalProgress | null;
  goalLoading: boolean;
  commitments: ICommitment[];
  commitmentsLoading: boolean;
  videos: IVideoFeedItem[];
  videosLoading: boolean;
  donations: IDonation[];
  donationsLoading: boolean;
  refetchBanners: () => Promise<void>;
  refetchCommitments: () => Promise<void>;
  refetchVideos: () => Promise<void>;
  refetchGoalProgress: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardDataContextValue>({
  banners: [],
  bannersLoading: true,
  goalProgress: null,
  goalLoading: true,
  commitments: [],
  commitmentsLoading: true,
  videos: [],
  videosLoading: true,
  donations: [],
  donationsLoading: true,
  refetchBanners: async () => {},
  refetchCommitments: async () => {},
  refetchVideos: async () => {},
  refetchGoalProgress: async () => {},
});

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, member } = useContext(AuthContext);
  const isInternal = member?.role === "admin" || member?.role === "user";
  const { settings: guestVisibility, loading: guestVisibilityLoading } = useDashboardVisibility();
  const canSeeBanners = isInternal || guestVisibility?.banners === true;
  const canSeeVideos = isInternal || guestVisibility?.videos === true;
  const canSeeCommunityGoal = isInternal || guestVisibility?.communityGoal === true;
  const canSeeNotices = isInternal || guestVisibility?.notices === true;
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [goalProgress, setGoalProgress] = useState<IGoalProgress | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [commitments, setCommitments] = useState<ICommitment[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(true);
  const [videos, setVideos] = useState<IVideoFeedItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [donations, setDonations] = useState<IDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setBanners([]);
      setBannersLoading(true);
      setGoalProgress(null);
      setGoalLoading(true);
      setCommitments([]);
      setCommitmentsLoading(true);
      setVideos([]);
      setVideosLoading(true);
      setDonations([]);
      setDonationsLoading(true);
      return;
    }

    if (!isInternal && guestVisibilityLoading) return;

    if (canSeeBanners) {
      BannerService.list()
        .then(setBanners)
        .catch(() => setBanners([]))
        .finally(() => setBannersLoading(false));
    } else {
      setBanners([]);
      setBannersLoading(false);
    }

    if (canSeeVideos) {
      VideoService.listAllVideos(1, RECENT_VIDEOS_LIMIT)
        .then((data) => setVideos(data.items))
        .catch(() => setVideos([]))
        .finally(() => setVideosLoading(false));
    } else {
      setVideos([]);
      setVideosLoading(false);
    }

    if (canSeeCommunityGoal) {
      ChargeServices.getGoalProgress()
        .then(setGoalProgress)
        .catch(() => setGoalProgress(null))
        .finally(() => setGoalLoading(false));
    } else {
      setGoalProgress(null);
      setGoalLoading(false);
    }

    if (canSeeNotices) {
      CommitmentService.list()
        .then(setCommitments)
        .catch(() => setCommitments([]))
        .finally(() => setCommitmentsLoading(false));
    } else {
      setCommitments([]);
      setCommitmentsLoading(false);
    }

    if (!isInternal) {
      setDonations([]);
      setDonationsLoading(false);
      return;
    }

    const now = new Date();
    DonationServices.list(now.getFullYear())
      .then((data) =>
        setDonations(data.filter((d) => d.referenceMonth === now.getMonth() && !isReturnedTransaction(d.status))),
      )
      .catch(() => setDonations([]))
      .finally(() => setDonationsLoading(false));
  }, [
    isLoggedIn,
    isInternal,
    guestVisibilityLoading,
    canSeeBanners,
    canSeeVideos,
    canSeeCommunityGoal,
    canSeeNotices,
  ]);

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

  async function refetchVideos() {
    try {
      const data = await VideoService.listAllVideos(1, RECENT_VIDEOS_LIMIT);
      setVideos(data.items);
    } catch {
      setVideos([]);
    }
  }

  async function refetchGoalProgress() {
    try {
      setGoalProgress(await ChargeServices.getGoalProgress());
    } catch {
      setGoalProgress(null);
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
        videos,
        videosLoading,
        donations,
        donationsLoading,
        refetchBanners,
        refetchCommitments,
        refetchVideos,
        refetchGoalProgress,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DashboardDataContext);
}
