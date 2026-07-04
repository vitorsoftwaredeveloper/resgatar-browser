"use client";

import { useCoach } from "@/context/CoachContext";
import { useEffect, useState } from "react";
import styles from "./CoachOverlay.module.css";

// Portado de resgatar_app/src/components/CoachOverlay. O furo escurecido via
// SVG mask (react-native-svg) vira o truque de box-shadow gigante em CSS.
// Clicar em qualquer lugar (inclusive sobre o alvo) avança, igual ao app.

const PADDING = 8;
const BALLOON_WIDTH = 280;

export function CoachOverlay() {
  const { active, step, targetRect, stepIndex, totalSteps, next, prev, stop } =
    useCoach();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  if (!active || !step) return null;

  const { width: screenW, height: screenH } = viewport;

  const hole = targetRect
    ? {
        x: Math.max(targetRect.x - PADDING, 0),
        y: Math.max(targetRect.y, 0),
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  const showBelow = !targetRect || targetRect.y < screenH * 0.45;

  const balloonTop = hole
    ? showBelow
      ? hole.y + hole.height + 14
      : Math.max(hole.y - 190, 40)
    : screenH / 2 - 90;

  const balloonLeft = screenW / 2 - BALLOON_WIDTH / 2;

  const isLast = stepIndex === totalSteps - 1;

  return (
    <>
      <div className={styles.backdrop} onClick={next} />

      {hole ? (
        <div
          className={styles.hole}
          style={{ left: hole.x, top: hole.y, width: hole.width, height: hole.height }}
        />
      ) : (
        <div className={styles.noHole} />
      )}

      {hole && (
        <div
          className={styles.highlight}
          style={{ left: hole.x, top: hole.y, width: hole.width, height: hole.height }}
        />
      )}

      <div
        className={styles.balloon}
        style={{ top: balloonTop, left: balloonLeft, width: BALLOON_WIDTH }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.stepCounter}>
          {stepIndex + 1} de {totalSteps}
        </p>
        <p className={styles.title}>{step.title}</p>
        <p className={styles.text}>{step.text}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={stop}>
            Pular
          </button>

          <div className={styles.rightActions}>
            {stepIndex > 0 && (
              <button type="button" className={styles.prev} onClick={prev}>
                Anterior
              </button>
            )}
            <button type="button" className={styles.nextButton} onClick={next}>
              <span className={styles.nextLabel}>
                {isLast ? "Concluir" : "Próximo"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
