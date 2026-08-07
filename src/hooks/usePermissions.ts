import { useAuth } from "@/context/AuthContext";
import { MemberRole } from "@/types/Member";

export function usePermissions() {
  const { member } = useAuth();
  const role: MemberRole = member?.role ?? "guest";

  const isAdmin = role === "admin";
  const isInternal = role === "admin" || role === "user";
  const isGuest = !isInternal;

  return { role, isAdmin, isInternal, isGuest };
}
