"use client";

import { fetchTTSAudio } from "@/services/GoogleTTSService";
import { useCallback, useEffect, useRef, useState } from "react";

// Portado de resgatar_app/src/hooks/useLiturgyTTS.ts. expo-av (Audio.Sound)
// vira HTMLAudioElement — mesma máquina de estados (idle/loading/playing/paused)
// e mesmo token de corrida para descartar respostas de reproduções abandonadas.

export type TTSState = "idle" | "loading" | "playing" | "paused";

export function useLiturgyTTS() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [state, setState] = useState<TTSState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const unloadCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
  }, []);

  const playSection = useCallback(
    async (id: string, text: string) => {
      if (activeId === id && state === "paused") {
        await audioRef.current?.play();
        setState("playing");
        return;
      }

      const token = ++tokenRef.current;
      unloadCurrent();
      setActiveId(id);
      setState("loading");

      try {
        const src = await fetchTTSAudio(text);
        if (tokenRef.current !== token) return;

        const audio = new Audio(src);
        audio.onended = () => {
          if (tokenRef.current !== token) return;
          setActiveId(null);
          setState("idle");
        };

        audioRef.current = audio;
        await audio.play();

        if (tokenRef.current !== token) {
          audio.pause();
          return;
        }
        setState("playing");
      } catch (err) {
        console.error("[TTS] error:", err);
        if (tokenRef.current !== token) return;
        setActiveId(null);
        setState("idle");
      }
    },
    [activeId, state, unloadCurrent],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    tokenRef.current++;
    unloadCurrent();
    setActiveId(null);
    setState("idle");
  }, [unloadCurrent]);

  return { activeId, state, playSection, pause, stop };
}
