"use client";

import { BreadcrumbItem } from "@/components/Breadcrumb";
import { createContext, useContext, useState } from "react";

// O topbar do desktop (breadcrumb + toggle de tema) precisa ficar fora do
// container de largura máxima da página para ocupar a faixa inteira ao lado
// da Sidebar (ver TabsLayout/SidebarFrame). Como ele é renderizado uma única
// vez no layout compartilhado mas os itens do breadcrumb são específicos de
// cada página, o Header de cada página publica os próprios crumbs aqui via
// useEffect, e o Topbar só consome.

interface TopbarContextValue {
  crumbs: BreadcrumbItem[];
  setCrumbs: (items: BreadcrumbItem[]) => void;
}

const TopbarContext = createContext<TopbarContextValue>({
  crumbs: [],
  setCrumbs: () => {},
});

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, setCrumbs] = useState<BreadcrumbItem[]>([]);

  return (
    <TopbarContext.Provider value={{ crumbs, setCrumbs }}>
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar() {
  return useContext(TopbarContext);
}
