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

// Espelho em JS da paleta editorial "Missal" definida em globals.css. Usada
// sobretudo para colorir ícones lucide (que recebem a cor via prop).
export const LIGHT: ThemeColors = {
  background: "#F1EADB",
  card: "#FCF9F1",
  primary: "#6C4A33",
  text: "#2C2015",
  textStrong: "#2C2015",
  textMuted: "#6B5A49",
  muted: "#9C8C78",
  mutedBackground: "#ffffff40",
  border: "#E4D9C6",
  inputBg: "#F6F0E3",
  black: "#000000",
  white: "#FFFFFF",
  error: "#A5462F",
  waiting: "#9C7A35",
  softBrown: "#F0E8D8",
  skeletonBg: "#ded2bd",
  success: "#3D7A57",
  info: "#3B6DF6",
  successBackground: "#E2EEE3",
  tabBarBg: "rgba(252, 249, 241, 0.9)",
  headerGlass: "rgba(252, 249, 241, 0.8)",
};

export const DARK: ThemeColors = {
  background: "#140E08",
  card: "#1F1810",
  primary: "#CB9D60",
  text: "#F1E7D5",
  textStrong: "#F1E7D5",
  textMuted: "#C1AF98",
  muted: "#897862",
  mutedBackground: "rgba(30,28,18,0.5)",
  border: "#352A1C",
  inputBg: "#271E13",
  black: "#000000",
  white: "#FFFFFF",
  error: "#DF8468",
  waiting: "#C7A052",
  softBrown: "#2E2416",
  skeletonBg: "#4b452d",
  success: "#6FB089",
  info: "#3B6DF6",
  successBackground: "#1E2A20",
  tabBarBg: "rgba(31, 24, 16, 0.92)",
  headerGlass: "rgba(31, 24, 16, 0.85)",
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
