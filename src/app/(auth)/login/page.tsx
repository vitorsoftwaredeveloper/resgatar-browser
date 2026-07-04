"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LogoResgatar } from "@/components/Svg/Logo";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./login.module.css";

// Portado de resgatar_app/src/screens/LoginScreen. KeyboardAvoidingView/
// ScrollView não são necessários no browser — o layout flexbox + scroll nativo
// da página já resolve isso.

export default function LoginPage() {
  const { login, loading: authLoading, isLoggedIn, needsOnboarding, onboardingChecked } = useAuth();
  const { colors } = useAppTheme();
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

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
    <div className="app-shell" style={{ minHeight: "100dvh" }}>
      <div className={styles.background}>
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <LogoResgatar color={colors.primary} size={300} />
          </div>

          <h1 className={styles.title}>Comunidade Resgatar</h1>

          <div className={styles.motion}>
            <div className={styles.divider} />
            <span className={styles.motionText}>Doar a vida por amor a santa cruz!</span>
            <div className={styles.divider} />
          </div>

          <p className={styles.subtitle}>Mc 10, 45</p>

          <div className={styles.form}>
            <Input
              placeholder="Email"
              type="email"
              autoCapitalize="none"
              onChangeText={(v) => {
                emailRef.current = v;
              }}
              rightIcon={<Mail size={24} color={colors.muted} />}
            />

            <Input
              placeholder="Senha"
              type={showPassword ? "text" : "password"}
              onChangeText={(v) => {
                passwordRef.current = v;
              }}
              rightIcon={
                <button
                  type="button"
                  aria-label="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", display: "flex" }}
                >
                  {showPassword ? <Eye size={24} color={colors.muted} /> : <EyeOff size={24} color={colors.muted} />}
                </button>
              }
            />
          </div>

          <Button
            title="Entrar"
            onPress={handleLogin}
            className={styles.submitButton}
            leftIcon={<LogIn size={20} color={colors.background} />}
            loading={loading}
          />

          <div className={styles.registerRow}>
            <span className={styles.registerText}>Não tem uma conta? </span>
            <Link href="/register" className={styles.registerLink}>
              Registre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
