"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { LogoResgatar } from "@/components/Svg/Logo";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./login.module.css";
import { LogoResgatarMark } from "@/components/Svg/LogoMark";

// Portado de resgatar_app/src/screens/LoginScreen — agora no layout editorial
// "Missal": hero litúrgico à esquerda (desktop) e cartão de acesso à direita.
// A lógica de autenticação (refs de e-mail/senha, validação e toasts) é a
// mesma; só a apresentação mudou.

export default function LoginPage() {
  const {
    login,
    loading: authLoading,
    isLoggedIn,
    needsOnboarding,
    onboardingChecked,
  } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<string>("");
  const passwordRef = useRef<string>("");

  useEffect(() => {
    if (authLoading || (isLoggedIn && !onboardingChecked)) return;
    if (isLoggedIn) {
      router.replace(needsOnboarding ? "/onboarding" : "/dashboard");
    }
  }, [authLoading, isLoggedIn, needsOnboarding, onboardingChecked, router]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleLogin = async () => {
    setLoading(true);

    if (!emailRef.current || !passwordRef.current) {
      ToastMessage.error("Erro", "Preencha todos os campos.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(emailRef.current)) {
      ToastMessage.error("Erro", "Informe um e-mail válido.");
      setLoading(false);
      return;
    }

    try {
      await login(emailRef.current.trim(), passwordRef.current);
      router.replace("/dashboard");
    } catch {
      ToastMessage.error("Erro", "Usuário ou senha incorretos.");
    }
    setLoading(false);
  };

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.aside}>
        <div className={styles.watermark} aria-hidden="true">
          <LogoResgatarMark size={1180} color="#EAD7AE" />
        </div>

        <div className={styles.asideCenter}>
          <p className={styles.verse}>
            &ldquo;Doar a vida por amor à santa cruz.&rdquo;
          </p>
          <div className={styles.verseRef}>Mc 10, 45</div>
        </div>
      </aside>

      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.cardBrand}>
            <LogoResgatar size={200} color="var(--accent)" />
          </div>

          <h1 className={styles.h}>Bem-vindo!</h1>
          <p className={styles.sub}>
            Entre para acompanhar leituras, contribuições e a vida da
            comunidade.
          </p>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div>
              <label className={styles.fieldLabel} htmlFor="login-email">
                Email
              </label>
              <div className={styles.field}>
                <span className={styles.fi}>
                  <Mail size={19} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  onChange={(e) => {
                    emailRef.current = e.target.value;
                  }}
                />
              </div>
            </div>

            <div>
              <label className={styles.fieldLabel} htmlFor="login-password">
                Senha
              </label>
              <div className={styles.field}>
                <span className={styles.fi}>
                  <Lock size={19} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  onChange={(e) => {
                    passwordRef.current = e.target.value;
                  }}
                />
                <button
                  type="button"
                  className={styles.ghost}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <Eye size={19} /> : <EyeOff size={19} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submit} disabled={loading}>
              <LogIn size={20} />
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className={styles.switch}>
            Não tem uma conta?
            <Link href="/register" className={styles.switchLink}>
              Registre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
