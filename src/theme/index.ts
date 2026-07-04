// Design tokens portados do resgatar_app (src/theme + src/context/ThemeContext).
// Os valores numéricos de espaçamento/raio/tipografia são expressos em px para uso
// direto no CSS/CSS-variables. As paletas light/dark alimentam o ThemeContext e as
// CSS variables definidas em globals.css.

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  background: string;
  card: string;
  primary: string;
  text: string;
  textStrong: string;
  textMuted: string;
  muted: string;
  mutedBackground: string;
  border: string;
  inputBg: string;
  black: string;
  white: string;
  error: string;
  waiting: string;
  softBrown: string;
  skeletonBg: string;
  success: string;
  info: string;
  successBackground: string;
  tabBarBg: string;
  headerGlass: string;
};

export const LIGHT: ThemeColors = {
  background: "#F6F1EB",
  card: "#FFFFFF",
  primary: "#6B4F3A",
  text: "#3E2F23",
  textStrong: "#3E2C1C",
  textMuted: "#8C7A6B",
  muted: "#9E8E80",
  mutedBackground: "#ffffff40",
  border: "#DED6CC",
  inputBg: "#FBF8F4",
  black: "#000000",
  white: "#FFFFFF",
  error: "#E53935",
  waiting: "#E0B96A",
  softBrown: "#EDE6DE",
  skeletonBg: "#c0bcb6",
  success: "#1E7F43",
  info: "#3B6DF6",
  successBackground: "#E6F4EA",
  tabBarBg: "rgba(255, 255, 255, 0.9)",
  headerGlass: "rgba(255, 255, 255, 0.8)",
};

export const DARK: ThemeColors = {
  background: "#1A1812",
  card: "#252118",
  primary: "#C9A055",
  text: "#EDE0B8",
  textStrong: "#F5EDD5",
  textMuted: "#8A7D5A",
  muted: "#4A3F28",
  mutedBackground: "rgba(30,28,18,0.5)",
  border: "rgba(255,255,255,0.08)",
  inputBg: "#2C2820",
  black: "#000000",
  white: "#FFFFFF",
  error: "#E57373",
  waiting: "#C9902A",
  softBrown: "#2E2A1C",
  skeletonBg: "#4b452d",
  success: "#4CAF6B",
  info: "#3B6DF6",
  successBackground: "#182E20",
  tabBarBg: "rgba(26, 24, 18, 0.95)",
  headerGlass: "rgba(26, 24, 18, 0.88)",
};

export const PALETTES: Record<ThemeMode, ThemeColors> = {
  light: LIGHT,
  dark: DARK,
};

/** Espaçamentos (px). Equivalentes ao THEME.SPACING do app. */
export const SPACING = {
  xs: 6,
  xxs: 8,
  sm: 10,
  sm2: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** Raios de borda (px). Equivalentes ao THEME.RADIUS do app. */
export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
} as const;

/** Tamanhos de tipografia (px). Equivalentes ao THEME.TYPOGRAPHY do app. */
export const TYPOGRAPHY = {
  hero: 28,
  title: 20,
  large: 18,
  subtitle: 16,
  body: 14,
  small: 12,
  xsmall: 11,
} as const;

export const THEME = {
  COLORS: LIGHT,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
} as const;
