"use client";

import { useAppTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { useActiveTabIndex, useTabs } from "./tabs";
import styles from "./TabBar.module.css";

// Portado de resgatar_app/src/components/TabBar. O tabBar customizado do
// react-navigation vira uma barra fixa no rodapé com next/link + usePathname;
// o indicador deslizante usa transform: translateX(index * 100%) sobre uma
// largura de 100/N% (equivalente ao SCREEN_WIDTH/routes.length do app).

export function TabBar() {
  const { colors } = useAppTheme();
  const tabs = useTabs();
  const activeIndex = useActiveTabIndex(tabs);

  const tabWidth = 100 / tabs.length;

  return (
    <div className={styles.container} data-tabbar>
      <div
        className={styles.indicator}
        style={{ width: `${tabWidth}%`, transform: `translateX(${activeIndex * 100}%)` }}
      />

      <div className={styles.row}>
        {tabs.map((tab, index) => {
          const focused = index === activeIndex;
          const iconColor = focused ? colors.primary : colors.textMuted;

          return (
            <Link
              key={tab.name}
              href={tab.path}
              data-tab={tab.name}
              className={styles.tab}
              style={{ width: `${tabWidth}%` }}
            >
              <div className={styles.tabInner}>
                <tab.Icon size={24} color={iconColor} />
                <span className={styles.label} style={{ color: iconColor }}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
