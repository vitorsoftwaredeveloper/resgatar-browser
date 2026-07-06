"use client";

import { Avatar } from "@/components/Avatar";
import { BirthdayModal } from "@/components/BirthdayModal";
import { CoachTarget } from "@/components/CoachTarget";
import { LogoResgatar } from "@/components/Svg/Logo";
import { useAuth } from "@/context/AuthContext";
import { useBirthday } from "@/context/BirthdayContext";
import { useAppTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  Cake,
  FileText,
  Home,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldUser,
  Sun,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

// Trilho vertical fixo do desktop (>=1024px). Substitui o TabBar do mobile e
// funciona como navegação principal: as 4 abas + os destinos que no mobile
// ficam sob "Mais" (Administrativo, Vídeos, Configurações pessoais). Pode ser
// recolhido (só ícones) — a largura é publicada em --sidebar-width para que o
// conteúdo se ajuste automaticamente.

type NavItem = { name: string; path: string; label: string; Icon: LucideIcon };

const BASE_NAV: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", label: "Início", Icon: Home },
  { name: "Readings", path: "/readings", label: "Leituras", Icon: BookOpen },
  { name: "Bills", path: "/bills", label: "Contribuições", Icon: FileText },
];

const ADMIN_ITEM: NavItem = {
  name: "Settings",
  path: "/settings",
  label: "Administrativo",
  Icon: ShieldUser,
};

const EXTRA_NAV: NavItem[] = [
  { name: "Videos", path: "/videos", label: "Vídeos", Icon: Video },
  {
    name: "PersonalSettings",
    path: "/personal-settings",
    label: "Configurações pessoais",
    Icon: Settings,
  },
];

const STORAGE_KEY = "sidebar:collapsed";

export function Sidebar() {
  const { colors, mode, toggleTheme } = useAppTheme();
  const { member } = useAuth();
  const { todayBirthdays } = useBirthday();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);

  useEffect(() => {
    // Sincroniza o estado persistido só no cliente (após a montagem) para não
    // divergir do HTML do servidor, que sempre renderiza expandido.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "72px" : "240px",
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const nav: NavItem[] = [
    ...BASE_NAV,
    ...(member?.role === "admin" ? [ADMIN_ITEM] : []),
    ...EXTRA_NAV,
  ];

  const fullName =
    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim();

  return (
    <aside
      className={[styles.container, collapsed && styles.collapsed]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.top}>
        {!collapsed && (
          <div className={styles.brand}>
            <LogoResgatar size={80} color={colors.primary} />
            <span className={styles.brandName}>Comunidade Resgatar</span>
          </div>
        )}
        <button
          type="button"
          className={styles.collapseButton}
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} color={colors.textMuted} />
          ) : (
            <PanelLeftClose size={18} color={colors.textMuted} />
          )}
        </button>
      </div>

      <nav className={styles.nav}>
        {nav.map((item) => {
          const focused = pathname?.startsWith(item.path) ?? false;
          const iconColor = focused ? colors.primary : colors.textMuted;

          return (
            <Link
              key={item.name}
              href={item.path}
              title={collapsed ? item.label : undefined}
              className={[styles.tab, focused && styles.tabActive]
                .filter(Boolean)
                .join(" ")}
            >
              <CoachTarget
                id={`tab-${item.name.toLowerCase()}`}
                className={styles.tabInner}
              >
                <item.Icon size={22} color={iconColor} />
                {!collapsed && (
                  <span className={styles.label} style={{ color: iconColor }}>
                    {item.label}
                  </span>
                )}
              </CoachTarget>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.action}
          onClick={toggleTheme}
          title={
            collapsed
              ? mode === "dark"
                ? "Modo claro"
                : "Modo escuro"
              : undefined
          }
        >
          <span className={styles.actionInner}>
            {mode === "dark" ? (
              <Sun size={20} color={colors.textMuted} />
            ) : (
              <Moon size={20} color={colors.textMuted} />
            )}
            {!collapsed && (
              <span className={styles.actionLabel}>
                {mode === "dark" ? "Modo claro" : "Modo escuro"}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          className={styles.action}
          onClick={() => setBirthdayVisible(true)}
          title={collapsed ? "Aniversariantes" : undefined}
        >
          <span className={styles.actionInner}>
            <span className={styles.actionIconWrap}>
              <Cake size={20} color={colors.textMuted} />
              {todayBirthdays > 0 && (
                <span className={styles.badge}>
                  <span className={styles.badgeText}>{todayBirthdays}</span>
                </span>
              )}
            </span>
            {!collapsed && (
              <span className={styles.actionLabel}>Aniversariantes</span>
            )}
          </span>
        </button>

        <Link
          href="/profile"
          className={styles.profile}
          title={collapsed ? fullName : undefined}
        >
          <Avatar photo={member?.profileImage} size={40} />
          {!collapsed && <span className={styles.profileName}>{fullName}</span>}
        </Link>
      </div>

      <BirthdayModal
        visible={birthdayVisible}
        onClose={() => setBirthdayVisible(false)}
      />
    </aside>
  );
}
