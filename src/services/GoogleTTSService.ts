import { api } from "@/services/api";

// Portado de resgatar_app/src/services/GoogleTTSService.ts. No app o áudio
// base64 retornado pelo backend era gravado em arquivo (expo-file-system) para
// tocar via expo-av; no browser vira direto uma data URI, consumível por
// <audio>/HTMLAudioElement sem passo intermediário de disco.

export async function fetchTTSAudio(text: string): Promise<string> {
  const { data } = await api.post<{ audioContent: string }>("/tts", { text });
  return `data:audio/mp3;base64,${data.audioContent}`;
}
