"use client";

import { LoadingScreen } from "@/components/LoadingScreen";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  require: "internal" | "admin";
  children: React.ReactNode;
}

export function RoleGuard({ require, children }: Props) {
  const { isAdmin, isInternal } = usePermissions();
  const router = useRouter();
  const allowed = require === "admin" ? isAdmin : isInternal;

  useEffect(() => {
    if (!allowed) router.replace("/dashboard");
  }, [allowed, router]);

  if (!allowed) return <LoadingScreen />;

  return <>{children}</>;
}
