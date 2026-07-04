"use client";

import { useCoach } from "@/context/CoachContext";
import React, { CSSProperties, useEffect, useRef } from "react";

// Portado de resgatar_app/src/components/CoachTarget. measureInWindow vira
// getBoundingClientRect. Uso: <CoachTarget id="tab-bills">...</CoachTarget>

interface Props {
  id: string;
  children: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function CoachTarget({ id, children, style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { register, unregister } = useCoach();

  useEffect(() => {
    register(id, (cb) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      cb({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    });
    return () => unregister(id);
  }, [id, register, unregister]);

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
