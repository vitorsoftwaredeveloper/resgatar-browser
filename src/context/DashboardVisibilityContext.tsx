"use client";

import { DashboardVisibilityServices } from "@/services/DashboardVisibilityService";
import { IDashboardVisibilitySettings } from "@/types/DashboardVisibility";
import { AuthContext } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DashboardVisibilityContextValue {
  settings: IDashboardVisibilitySettings | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const DashboardVisibilityContext = createContext<DashboardVisibilityContextValue>({
  settings: null,
  loading: true,
  refetch: async () => {},
});

export function DashboardVisibilityProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useContext(AuthContext);
  const [settings, setSettings] = useState<IDashboardVisibilitySettings | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSettings() {
    try {
      setSettings(await DashboardVisibilityServices.get());
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setSettings(null);
      setLoading(true);
      return;
    }

    fetchSettings();
  }, [isLoggedIn]);

  return (
    <DashboardVisibilityContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </DashboardVisibilityContext.Provider>
  );
}

export function useDashboardVisibility() {
  return useContext(DashboardVisibilityContext);
}
