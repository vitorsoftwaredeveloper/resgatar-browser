"use client";

import { Avatar } from "@/components/Avatar";
import { type BreadcrumbItem } from "@/components/Breadcrumb";
import { CoachTarget } from "@/components/CoachTarget";
import { LogoResgatar } from "@/components/Svg/Logo";
import { useAppTheme } from "@/context/ThemeContext";
import { useTopbar } from "@/context/TopbarContext";
import { resolveAvatarUri } from "@/utils/image";
import { ChevronLeft, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import styles from "./Header.module.css";

// Portado de resgatar_app/src/components/Header. measure() nativo vira
// getBoundingClientRect. useIsFocused (react-navigation) foi removido — este
// projeto ainda não tem rotas, então não há "tela perdeu foco" para fechar o
// sheet automaticamente.
//
// No desktop quem aparece é o Topbar (breadcrumb + toggle de tema),
// renderizado uma única vez no layout compartilhado (TabsLayout/SidebarFrame)
// pra poder ocupar a largura inteira ao lado da Sidebar — este componente,
// embutido dentro do conteúdo de cada página, não conseguiria estourar o
// max-width centralizado da página. Este Header só publica os crumbs da
// página atual no TopbarContext e renderiza a variante mobile (avatar,
// saudação, ações rápidas); o CSS esconde essa variante em telas >=1024px.
interface Props {
  name: string;
  photo?: string;
  onBack?: () => void;
  crumbs: BreadcrumbItem[];
}

export function Header({ name, photo, onBack, crumbs }: Props) {
  const { colors, mode, toggleTheme } = useAppTheme();
  const { setCrumbs } = useTopbar();

  const avatarUri = resolveAvatarUri(photo);

  useEffect(() => {
    setCrumbs(crumbs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crumbs]);

  return (
    <div className={styles.container} data-header>
      <div className={styles.left}>
        {onBack && (
          <button type="button" onClick={onBack} className={styles.backButton} aria-label="Voltar">
            <ChevronLeft size={22} color={colors.primary} />
          </button>
        )}

        <div className={styles.logo} data-greeting>
          {avatarUri ? <Avatar photo={photo} size={50} /> : <LogoResgatar size={100} color={colors.primary} />}
        </div>
        <div className={styles.textContainer} data-greeting>
          <p className={styles.hello}>Olá,</p>
          <p className={styles.name}>{name}</p>
        </div>
        <div className={styles.actions} data-header-actions>
          <CoachTarget id="header-quickactions">
            <button
              type="button"
              aria-label={mode === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              onClick={toggleTheme}
              className={styles.themeToggle}
            >
              {mode === "dark" ? (
                <Sun size={18} color={colors.primary} />
              ) : (
                <Moon size={18} color={colors.primary} />
              )}
            </button>
          </CoachTarget>
        </div>
      </div>
    </div>
  );
}
