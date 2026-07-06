"use client";

import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import styles from "./Breadcrumb.module.css";

// Trilha de navegação para o desktop: mostra o caminho até a tela atual
// (ex.: "Administrativo > Entrada mensal"). Itens com onClick voltam para o
// nível correspondente; o último item é a tela atual (texto, não clicável).

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className={styles.breadcrumb} aria-label="Caminho">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {item.onClick && !isLast ? (
              <button type="button" className={styles.link} onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span className={isLast ? styles.current : styles.link} aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className={styles.separator} aria-hidden />}
          </Fragment>
        );
      })}
    </nav>
  );
}
