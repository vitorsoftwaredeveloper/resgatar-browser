// Espelha os breakpoints literais usados em @media dentro dos .module.css
// (não há plugin de custom-media no PostCSS deste projeto).
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;
