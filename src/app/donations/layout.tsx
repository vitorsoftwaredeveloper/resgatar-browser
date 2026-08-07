import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RoleGuard require="admin">{children}</RoleGuard>
    </AuthGuard>
  );
}
