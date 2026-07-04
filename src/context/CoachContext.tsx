"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// Portado de resgatar_app/src/context/CoachContext.tsx. A medição de posição
// (measureInWindow) vira getBoundingClientRect no CoachTarget web. A navegação
// entre abas/telas (navigateToTab/navigateToScreen) ainda não existe neste
// projeto (rotas não foram portadas) — os passos que dependem de `tab`/`screen`
// ficam como TODO até a navegação existir; por ora o tour mede o alvo na tela
// atual, sem trocar de aba.

export interface CoachRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type MeasureCallback = (cb: (rect: CoachRect) => void) => void;

export interface CoachStep {
  id: string;
  title: string;
  text: string;
  tab?: string;
  screen?: "Videos";
  optional?: boolean;
  onEnter?: () => void;
}

export const COACH_STEPS: CoachStep[] = [
  {
    id: "banner-carousel",
    title: "Banners da comunidade",
    text: "Aqui você vê os avisos e campanhas em destaque. Deslize para navegar entre os banners.",
    tab: "Dashboard",
    optional: true,
  },
  {
    id: "streak-card",
    title: "Ofensiva de leituras",
    text: "Acompanhe sua sequência diária de leituras. Cada dia que você lê conta para a ofensiva!",
    tab: "Dashboard",
  },
  {
    id: "community-goal-card",
    title: "Meta da comunidade",
    text: "Veja o percentual de contribuições já realizadas este mês pela comunidade.",
    tab: "Dashboard",
  },
  {
    id: "notices-card",
    title: "Compromissos da comunidade",
    text: "Fique por dentro dos compromissos e avisos importantes do grupo.",
    tab: "Dashboard",
  },
  {
    id: "tab-readings",
    title: "Leituras do dia",
    text: "Acesse a liturgia diária: primeira leitura, salmo responsorial, segunda leitura e evangelho. Navegue por qualquer data pelo calendário.",
    tab: "Readings",
  },
  {
    id: "reading-tts-btn",
    title: "Ouvir a leitura",
    text: "Toque neste botão para ouvir a leitura em voz alta. Útil para acompanhar sem precisar olhar para a tela.",
    tab: "Readings",
  },
  {
    id: "bills-donation",
    title: "Fazer uma doação",
    text: "Contribua com um valor extra para a comunidade via PIX ou dinheiro.",
    tab: "Bills",
  },
  {
    id: "profile-photo",
    title: "Alterar foto",
    text: "Toque na sua foto de perfil para trocá-la usando a câmera ou galeria.",
    tab: "Profile",
  },
  {
    id: "profile-personal-settings",
    title: "Configurações pessoais",
    text: "Edite seus dados pessoais, atualize sua senha e gerencie sua conta por aqui.",
    tab: "Profile",
  },
  {
    id: "profile-videos",
    title: "Vídeos da comunidade",
    text: "Assista e compartilhe vídeos publicados pelos membros da comunidade.",
    tab: "Profile",
  },
  {
    id: "header-quickactions",
    title: "Ações rápidas",
    text: "Toque aqui para acessar atalhos úteis como aniversariantes, modo escuro e mais.",
    tab: "Dashboard",
  },
];

interface CoachContextData {
  active: boolean;
  stepIndex: number;
  step: CoachStep | null;
  targetRect: CoachRect | null;
  totalSteps: number;
  register: (id: string, measure: MeasureCallback) => void;
  unregister: (id: string) => void;
  registerAction: (id: string, fn: () => void) => void;
  unregisterAction: (id: string) => void;
  start: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

const CoachContext = createContext<CoachContextData>({} as CoachContextData);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// TODO: ligar à navegação real quando as rotas existirem.
function navigateToTab(_tab: string) {}
function navigateToScreen(_screen: string) {}

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const registry = useRef<Map<string, MeasureCallback>>(new Map());
  const actionRegistry = useRef<Map<string, () => void>>(new Map());

  const registerAction = useCallback((id: string, fn: () => void) => {
    actionRegistry.current.set(id, fn);
  }, []);

  const unregisterAction = useCallback((id: string) => {
    actionRegistry.current.delete(id);
  }, []);

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<CoachRect | null>(null);

  const register = useCallback((id: string, measure: MeasureCallback) => {
    registry.current.set(id, measure);
  }, []);

  const unregister = useCallback((id: string) => {
    registry.current.delete(id);
  }, []);

  const measureWithRetry = useCallback(
    async (id: string, attempts = 10): Promise<CoachRect | null> => {
      for (let i = 0; i < attempts; i++) {
        const measure = registry.current.get(id);
        if (measure) {
          const rect = await new Promise<CoachRect>((resolve) =>
            measure(resolve),
          );
          if (rect && rect.width > 0 && rect.height > 0) return rect;
        }
        await wait(90);
      }
      return null;
    },
    [],
  );

  const goToStep = useCallback(
    async (index: number, direction: 1 | -1 = 1) => {
      if (index < 0 || index >= COACH_STEPS.length) {
        setActive(false);
        setTargetRect(null);
        return;
      }

      const step = COACH_STEPS[index];

      setTargetRect(null);

      if (step.screen) {
        navigateToScreen(step.screen);
        await wait(350);
      } else if (step.tab) {
        navigateToTab(step.tab);
        await wait(300);
      }

      const action = actionRegistry.current.get(step.id);
      if (action) {
        action();
        await wait(250);
      }

      const rect = await measureWithRetry(step.id, step.optional ? 5 : 10);

      if (!rect && step.optional) {
        goToStep(index + direction, direction);
        return;
      }

      setStepIndex(index);
      setTargetRect(rect);
    },
    [measureWithRetry],
  );

  const start = useCallback(() => {
    setActive(true);
    setStepIndex(0);
    goToStep(0, 1);
  }, [goToStep]);

  const next = useCallback(() => {
    goToStep(stepIndex + 1, 1);
  }, [stepIndex, goToStep]);

  const prev = useCallback(() => {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1, -1);
  }, [stepIndex, goToStep]);

  const stop = useCallback(() => {
    setActive(false);
    setTargetRect(null);
  }, []);

  return (
    <CoachContext.Provider
      value={{
        active,
        stepIndex,
        step: active ? (COACH_STEPS[stepIndex] ?? null) : null,
        targetRect,
        totalSteps: COACH_STEPS.length,
        register,
        unregister,
        registerAction,
        unregisterAction,
        start,
        next,
        prev,
        stop,
      }}
    >
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  return useContext(CoachContext);
}
