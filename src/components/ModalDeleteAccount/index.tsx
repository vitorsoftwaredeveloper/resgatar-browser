"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { ModalBase } from "@/components/ModalBase";
import { ToastMessage } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import styles from "./ModalDeleteAccount.module.css";
import { useAppTheme } from "@/context/ThemeContext";

// Portado de resgatar_app/src/screens/ProfileScreen/ModalDeleteAccount.

interface Props {
  visible: boolean;
  onClose: () => void;
}

const WARNINGS = [
  "Todos os seus dados pessoais serão removidos permanentemente.",
  "Seu histórico de contribuições será excluído.",
  "O acesso ao aplicativo será encerrado imediatamente.",
  "Esta ação não pode ser desfeita.",
];

export function ModalDeleteAccount({ visible, onClose }: Props) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useAppTheme();

  async function handleDelete() {
    if (!password.trim()) {
      ToastMessage.error(
        "Campo obrigatório",
        "Informe sua senha para continuar.",
      );
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(password);
      ToastMessage.success(
        "Conta encerrada",
        "Sua conta foi encerrada com sucesso.",
      );
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      const isWrongPassword =
        err?.name === "NotAuthorizedException" ||
        err?.message === "Senha incorreta.";
      ToastMessage.error(
        "Erro",
        isWrongPassword
          ? "Senha incorreta. Verifique e tente novamente."
          : "Não foi possível encerrar a conta. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBase visible={visible} onClose={onClose} title="Encerrar conta">
      <div className={styles.container}>
        <Card title="Atenção">
          <div className={styles.warningHeader}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <p className={styles.warningTitle}>
              Ao encerrar sua conta, os seguintes dados serão removidos:
            </p>
          </div>

          {WARNINGS.map((text) => (
            <div key={text} className={styles.warningItem}>
              <span className={styles.bullet} />
              <p className={styles.warningText}>{text}</p>
            </div>
          ))}
        </Card>

        <Card title="Confirmar identidade">
          <p className={styles.confirmLabel}>
            Para confirmar o encerramento, informe sua senha de acesso:
          </p>

          <Input
            label="Senha"
            type={showPassword ? "text" : "password"}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            leftIcon={<Lock size={20} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Mostrar/ocultar senha"
                style={{ background: "none", border: "none", display: "flex" }}
              >
                {showPassword ? (
                  <Eye size={20} color={colors.muted} />
                ) : (
                  <EyeOff size={20} color={colors.muted} />
                )}
              </button>
            }
          />
        </Card>

        <div className={styles.footer}>
          <Button
            title="Encerrar conta"
            onPress={handleDelete}
            loading={loading}
            disabled={loading}
            style={{ background: "var(--color-error)" }}
          />
        </div>
      </div>
    </ModalBase>
  );
}
