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

type NavItem = {
  name: string;
  path: string;
  label: string;
  Icon: LucideIcon;
  badge?: string;
};
type NavSection = { label: string; items: NavItem[] };

const COMMUNITY_NAV: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", label: "Início", Icon: Home },
  { name: "Readings", path: "/readings", label: "Leituras", Icon: BookOpen },
  { name: "Bills", path: "/bills", label: "Contribuições", Icon: FileText },
  { name: "Videos", path: "/videos", label: "Vídeos", Icon: Video },
];

const ADMIN_ITEM: NavItem = {
  name: "Settings",
  path: "/settings",
  label: "Administrativo",
  Icon: ShieldUser,
};

const ACCOUNT_ITEM: NavItem = {
  name: "PersonalSettings",
  path: "/personal-settings",
  label: "Configurações pessoais",
  Icon: Settings,
};

const STORAGE_KEY = "sidebar:collapsed";
const SIDEBAR_WIDTH = "268px";
const SIDEBAR_WIDTH_COLLAPSED = "82px";

function roleLabel(role?: string): string {
  return role === "admin" ? "Coordenador" : "Membro";
}

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
      collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
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

  const sections: NavSection[] = [
    { label: "Comunidade", items: COMMUNITY_NAV },
    {
      label: "Gestão",
      items: [
        ...(member?.role === "admin" ? [ADMIN_ITEM] : []),
        ACCOUNT_ITEM,
      ],
    },
  ];

  const fullName =
    `${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim() || "Membro";

  return (
    <aside
      className={[styles.container, collapsed && styles.collapsed]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.brand}>
        <span className={styles.mark}>
          <LogoResgatar size={30} color="currentColor" />
        </span>
        {!collapsed && (
          <span className={styles.brandText}>
            <span className={styles.brandName}>Resgatar</span>
            <span className={styles.brandSub}>Comunidade</span>
          </span>
        )}
        <button
          type="button"
          className={styles.collapseButton}
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} color={colors.muted} />
          ) : (
            <PanelLeftClose size={19} color={colors.muted} />
          )}
        </button>
      </div>

      <nav className={styles.scroll}>
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && <div className={styles.secLabel}>{section.label}</div>}
            {section.items.map((item) => {
              const focused = pathname?.startsWith(item.path) ?? false;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  title={collapsed ? item.label : undefined}
                  className={[styles.navItem, focused && styles.navItemActive]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <CoachTarget
                    id={`tab-${item.name.toLowerCase()}`}
                    className={styles.navIcon}
                  >
                    <item.Icon size={21} strokeWidth={1.7} />
                  </CoachTarget>
                  {!collapsed && (
                    <>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge && (
                        <span className={styles.navBadge}>{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.userCard} title={collapsed ? fullName : undefined}>
        <div className={styles.userAvatar}>
          <Avatar photo={member?.profileImage} size={38} />
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
        {!collapsed && (
          <span className={styles.userText}>
            <span className={styles.userName}>{fullName}</span>
            <span className={styles.userRole}>{roleLabel(member?.role)}</span>
          </span>
        )}
        {!collapsed && (
          <button
            type="button"
            ref={menuButtonRef}
            className={styles.userMore}
            onClick={handleOpenMenu}
            aria-label="Mais opções"
          >
            <EllipsisVertical size={18} color={colors.muted} />
            {todayBirthdays > 0 && <span className={styles.menuBadge} />}
          </button>
        )}
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
