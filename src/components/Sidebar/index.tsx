"use client";

import { Avatar } from "@/components/Avatar";
import { BirthdayModal } from "@/components/BirthdayModal";
import { CoachTarget } from "@/components/CoachTarget";
import { QuickActionsSheet } from "@/components/QuickActionsSheet";
import { LogoResgatar } from "@/components/Svg/Logo";
import { useAuth } from "@/context/AuthContext";
import { useBirthday } from "@/context/BirthdayContext";
import { useAppTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  EllipsisVertical,
  FileText,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldUser,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import styles from "./Sidebar.module.css";
import { Dialog } from "../Dialog";

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
  const { colors } = useAppTheme();
  const { member, logout } = useAuth();
  const { todayBirthdays } = useBirthday();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);
  const [dialogLogoutVisible, setDialogLogoutVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<
    { bottom: number; left: number } | undefined
  >();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleLogout = async () => {
    await logout();
    setDialogLogoutVisible(false);
  };

  function handleOpenMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const node = menuButtonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setAnchorPosition({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
    setMenuVisible(true);
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
        <div className={styles.profileRow}>
          <div className={styles.profile} title={collapsed ? fullName : undefined}>
            <div className={styles.avatarWrap}>
              <Avatar photo={member?.profileImage} size={40} />
              {collapsed && (
                <button
                  type="button"
                  ref={menuButtonRef}
                  className={styles.menuTriggerOverlay}
                  onClick={handleOpenMenu}
                  aria-label="Mais opções"
                >
                  <EllipsisVertical size={12} color={colors.white} />
                  {todayBirthdays > 0 && <span className={styles.menuBadge} />}
                </button>
              )}
            </div>
            {!collapsed && <span className={styles.profileName}>{fullName}</span>}
          </div>

          {!collapsed && (
            <button
              type="button"
              ref={menuButtonRef}
              className={styles.menuTrigger}
              onClick={handleOpenMenu}
              aria-label="Mais opções"
            >
              <EllipsisVertical size={16} color={colors.textMuted} />
              {todayBirthdays > 0 && <span className={styles.menuBadge} />}
            </button>
          )}
        </div>
      </div>

      <QuickActionsSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onOpenBirthdays={() => setBirthdayVisible(true)}
        onLogout={() => setDialogLogoutVisible(true)}
        anchorPosition={anchorPosition}
        todayBirthdays={todayBirthdays}
      />

      <BirthdayModal
        visible={birthdayVisible}
        onClose={() => setBirthdayVisible(false)}
      />

      <Dialog
        visible={dialogLogoutVisible}
        title="Tem certeza que deseja sair?"
        description="Você pode realizar o login novamente e ter acesso a todas as funcionalidades do nosso aplicativo."
        onClose={() => setDialogLogoutVisible(false)}
        actions={[
          {
            label: "cancelar",
            onPress: () => setDialogLogoutVisible(false),
            variant: "secondary",
          },
          {
            label: "sair",
            onPress: handleLogout,
            variant: "primary",
          },
        ]}
      />
    </aside>
  );
}
