import { BookOpen, FileText, Home, TextAlignJustify } from "lucide-react";
import { usePathname } from "next/navigation";

export const TABS = [
  { name: "Dashboard", path: "/dashboard", label: "Início", Icon: Home },
  { name: "Readings", path: "/readings", label: "Leituras", Icon: BookOpen },
  { name: "Bills", path: "/bills", label: "Contribuições", Icon: FileText },
  { name: "Profile", path: "/profile", label: "Mais", Icon: TextAlignJustify },
];

export function useActiveTabIndex() {
  const pathname = usePathname();
  return Math.max(
    TABS.findIndex((t) => pathname?.startsWith(t.path)),
    0,
  );
}
