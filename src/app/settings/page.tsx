"use client";

import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

// Placeholder do SettingsScreen (área administrativa). Ainda não portado.

export default function SettingsPage() {
  const { member } = useAuth();
  const router = useRouter();

  return (
    <div className="app-shell">
      <Header
        name={`${member?.firstName ?? ""} ${member?.lastName ?? ""}`}
        photo={member?.profileImage}
        onBack={() => router.back()}
      />
      <div style={{ padding: "var(--spacing-lg)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Administrativo — em construção.</p>
      </div>
    </div>
  );
}
