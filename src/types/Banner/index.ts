// Adaptado de resgatar_app/src/types/Banner/index.ts. No app, BannerScreen
// referenciava rotas do react-navigation (RootStackParamList); aqui referencia
// paths do App Router diretamente, já que a navegação interna do banner
// simplesmente faz router.push(path).

export type BannerActionType = "external" | "internal" | "none";

export type BannerScreen = "/videos" | "/personal-settings" | "/bills" | "/readings" | "/profile";

export const BANNER_SCREEN_OPTIONS: { label: string; value: BannerScreen }[] = [
  { label: "Contribuições", value: "/bills" },
  { label: "Leituras", value: "/readings" },
  { label: "Mais", value: "/profile" },
  { label: "Vídeos", value: "/videos" },
  { label: "Configurações pessoais", value: "/personal-settings" },
];

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
