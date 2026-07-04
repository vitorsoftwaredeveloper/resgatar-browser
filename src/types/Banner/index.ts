// O mesmo registro de banner (mesmo backend) é lido pelo resgatar_app (mobile)
// e por este projeto. O mobile grava/lê action.value como nome de tela do
// react-navigation (navigation.navigate(target)) — ver
// resgatar_app/src/types/Banner/index.ts. Por isso BannerScreen aqui espelha
// esses mesmos valores literais (não paths do App Router): um banner criado
// num app precisa continuar navegável no outro. BANNER_SCREEN_PATHS abaixo faz
// a tradução para path só na hora de navegar no web.

export type BannerActionType = "external" | "internal" | "none";

export type BannerScreen = "Bills" | "Readings" | "Profile" | "Videos" | "PersonalSettings";

export const BANNER_SCREEN_OPTIONS: { label: string; value: BannerScreen }[] = [
  { label: "Contribuições", value: "Bills" },
  { label: "Leituras", value: "Readings" },
  { label: "Mais", value: "Profile" },
  { label: "Vídeos", value: "Videos" },
  { label: "Configurações pessoais", value: "PersonalSettings" },
];

export const BANNER_SCREEN_PATHS: Record<BannerScreen, string> = {
  Bills: "/bills",
  Readings: "/readings",
  Profile: "/profile",
  Videos: "/videos",
  PersonalSettings: "/personal-settings",
};

// Tamanho máximo do data URI em bytes — espelha MAX_CAMPAIGN_BANNER_SIZE do backend.
export const MAX_BANNER_SIZE_BYTES = 500 * 1024;

export interface IBanner {
  id: string;
  banner: string;
  title: string;
  action: { type: BannerActionType; value: string };
  active: boolean;
  order: number;
}

export interface IBannerInput {
  banner: string;
  title: string;
  action: { type: BannerActionType; value: string };
  active?: boolean;
}
