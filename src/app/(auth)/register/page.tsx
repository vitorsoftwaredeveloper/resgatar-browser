"use client";

import Link from "next/link";

// Placeholder do RegisterScreen (386 linhas no app — formulário completo de
// cadastro com CPF/CNPJ, CEP, upload de foto etc.). Ainda não portado; esta
// página só evita um link quebrado a partir do Login.

export default function RegisterPage() {
  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: 24,
        gap: 16,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "var(--font-title)", color: "var(--color-text-strong)" }}>Cadastro</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        O formulário de cadastro ainda está sendo portado para a web.
      </p>
      <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
        Voltar para o login
      </Link>
    </div>
  );
}
