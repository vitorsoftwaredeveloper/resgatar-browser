"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PALETTES, ThemeColors, ThemeMode } from "@/theme";

// Portado de resgatar_app/src/context/ThemeContext.tsx. No web, além de expor as
// cores para uso em JS, sincronizamos o atributo data-theme no <html> para que as
// CSS variables definidas em globals.css troquem entre light/dark.

const STORAGE_KEY = "@resgatar:theme";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: PALETTES.light,
  toggleTheme: () => {},
});

function applyThemeAttribute(mode: ThemeMode) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", mode);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      setMode(saved);
      applyThemeAttribute(saved);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyThemeAttribute(next);
      return next;
    });
  }, []);

  const colors = useMemo(() => PALETTES[mode], [mode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
