import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchTTSAudio } = vi.hoisted(() => ({ fetchTTSAudio: vi.fn() }));

vi.mock("@/services/GoogleTTSService", () => ({ fetchTTSAudio }));

import { useLiturgyTTS } from "@/hooks/useLiturgyTTS";

const AUDIO_SRC = "data:audio/mp3;base64,zzz";

interface AudioFalso {
  src: string;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  onended: (() => void) | null;
}

let audios: AudioFalso[] = [];

function ultimoAudio() {
  return audios[audios.length - 1];
}

beforeEach(() => {
  audios = [];
  fetchTTSAudio.mockReset().mockResolvedValue(AUDIO_SRC);
  vi.spyOn(console, "error").mockImplementation(() => {});

  vi.stubGlobal(
    "Audio",
    vi.fn(function (this: AudioFalso, src: string) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.onended = null;
      audios.push(this);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useLiturgyTTS", () => {
  it("começa parado e sem seção ativa", () => {
    const { result } = renderHook(() => useLiturgyTTS());

    expect(result.current.state).toBe("idle");
    expect(result.current.activeId).toBeNull();
  });

  it("busca o áudio e toca a seção", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("evangelho", "texto do evangelho");
    });

    expect(fetchTTSAudio).toHaveBeenCalledWith("texto do evangelho");
    expect(ultimoAudio().src).toBe(AUDIO_SRC);
    expect(ultimoAudio().play).toHaveBeenCalled();
    expect(result.current.state).toBe("playing");
    expect(result.current.activeId).toBe("evangelho");
  });

  it("volta para idle quando o áudio termina", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("evangelho", "texto");
    });

    act(() => {
      ultimoAudio().onended?.();
    });

    await waitFor(() => {
      expect(result.current.state).toBe("idle");
      expect(result.current.activeId).toBeNull();
    });
  });

  it("pausa a seção em reprodução", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });

    act(() => {
      result.current.pause();
    });

    expect(ultimoAudio().pause).toHaveBeenCalled();
    expect(result.current.state).toBe("paused");
  });

  it("retoma a mesma seção sem buscar o áudio de novo", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });
    act(() => {
      result.current.pause();
    });

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });

    expect(fetchTTSAudio).toHaveBeenCalledTimes(1);
    expect(audios).toHaveLength(1);
    expect(result.current.state).toBe("playing");
  });

  it("descarta o áudio anterior ao trocar de seção", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("primeira", "texto um");
    });
    const primeiro = ultimoAudio();

    await act(async () => {
      await result.current.playSection("evangelho", "texto dois");
    });

    expect(primeiro.pause).toHaveBeenCalled();
    expect(primeiro.src).toBe("");
    expect(audios).toHaveLength(2);
    expect(result.current.activeId).toBe("evangelho");
  });

  it("para tudo e limpa o estado", async () => {
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });
    const audio = ultimoAudio();

    act(() => {
      result.current.stop();
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.activeId).toBeNull();
  });

  it("volta para idle quando a busca do áudio falha", async () => {
    fetchTTSAudio.mockRejectedValueOnce(new Error("sem áudio"));
    const { result } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.activeId).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("ignora a resposta de uma reprodução abandonada", async () => {
    let liberar!: (src: string) => void;
    fetchTTSAudio.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          liberar = resolve;
        }),
    );

    const { result } = renderHook(() => useLiturgyTTS());

    let pendente!: Promise<void>;
    act(() => {
      pendente = result.current.playSection("primeira", "texto um");
    });

    act(() => {
      result.current.stop();
    });

    await act(async () => {
      liberar(AUDIO_SRC);
      await pendente;
    });

    expect(audios).toHaveLength(0);
    expect(result.current.state).toBe("idle");
  });

  it("para o áudio ao desmontar", async () => {
    const { result, unmount } = renderHook(() => useLiturgyTTS());

    await act(async () => {
      await result.current.playSection("salmo", "texto");
    });
    const audio = ultimoAudio();

    unmount();

    expect(audio.pause).toHaveBeenCalled();
  });
});
