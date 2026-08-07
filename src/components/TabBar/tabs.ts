import { usePermissions } from "@/hooks/usePermissions";
import { BookOpen, FileText, Home, TextAlignJustify } from "lucide-react";
import { usePathname } from "next/navigation";

export const ALL_TABS = [
  { name: "Dashboard", path: "/dashboard", label: "Início", Icon: Home },
  { name: "Readings", path: "/readings", label: "Leituras", Icon: BookOpen },
  { name: "Bills", path: "/bills", label: "Contribuições", Icon: FileText },
  { name: "Profile", path: "/profile", label: "Mais", Icon: TextAlignJustify },
];

export function useTabs() {
  const { isInternal } = usePermissions();
  return ALL_TABS.filter((tab) => tab.name !== "Bills" || isInternal);
}

export function useActiveTabIndex(tabs: typeof ALL_TABS) {
  const pathname = usePathname();
  return Math.max(
    tabs.findIndex((t) => pathname?.startsWith(t.path)),
    0,
  );
}
