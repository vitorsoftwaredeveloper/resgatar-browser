"use client";

import { useAppTheme } from "@/context/ThemeContext";
import styles from "./page.module.css";

// Página inicial temporária: valida que tema, CSS variables e providers estão
// funcionando. Será substituída pelas telas portadas do resgatar_app.

export default function Home() {
  const { mode, toggleTheme } = useAppTheme();

  return (
    <div className="app-shell">
      <main className={styles.main}>
        <div>
          <h1 className={styles.title}>Resgatar</h1>
          <p className={styles.subtitle}>Base do projeto web configurada.</p>
        </div>

        <div className={styles.card}>
          <strong>Infra pronta</strong>
          <div className={styles.list}>
            <span>
              <span className={styles.check}>✓</span> Next.js (App Router) + TypeScript
            </span>
            <span>
              <span className={styles.check}>✓</span> Tema + design tokens (light/dark)
            </span>
            <span>
              <span className={styles.check}>✓</span> API axios + Cognito (Amplify)
            </span>
            <span>
              <span className={styles.check}>✓</span> AuthContext + storage (localStorage)
            </span>
          </div>
        </div>

        <button className={styles.themeButton} onClick={toggleTheme}>
          Tema atual: {mode} (alternar)
        </button>
      </main>
    </div>
  );
}
