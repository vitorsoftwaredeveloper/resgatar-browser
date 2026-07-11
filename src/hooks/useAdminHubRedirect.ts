import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBreakpoint } from "./useBreakpoint";

// As rotas standalone do Administrativo (/arrecadacao, /expenses, /donations,
// /balanco-anual, /member-actions) são a versão MOBILE dessas telas. No desktop
// a mesma tela vive inline no hub /settings (master-detail), então a rota
// standalone não deve ficar acessível ali — este hook redireciona pra
// /settings?open=<key> quando em desktop.
//
// Retorna `isDesktop` para a página poder devolver `null` enquanto o redirect
// acontece (evita piscar a versão mobile antes de sair da rota).
export function useAdminHubRedirect(openKey: string): boolean {
  const { isDesktop } = useBreakpoint();
  const router = useRouter();

  useEffect(() => {
    if (isDesktop) router.replace(`/settings?open=${openKey}`);
  }, [isDesktop, router, openKey]);

  return isDesktop;
}
