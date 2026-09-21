import { useCallback, useEffect, useRef, useState } from "react";
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioStream,
} from "expo-audio";
import type { AppLanguage, ParsedIntent } from "@aya/shared";
import { REPEAT_MESSAGES } from "../lib/voice-repeat";
import { api, friendlyApiError } from "../services/api";

export type CapturePhase =
  | "idle"
  | "requesting"
  | "listening"
  | "processing"
  | "error";

type Options = {
  language: AppLanguage;
  /** Trailing silence before we auto-stop. Tolerant default suits slow speakers. */
  silenceMs?: number;
  /** RMS floor (0..1) below which a frame counts as silence. */
  silenceRms?: number;
  /** Hard cap so a stuck mic can't record forever. */
  maxMs?: number;
  /** Fired right before an automatic stop so the UI can announce it. */
  onAutoStop?: () => void;
  onResult?: (intent: ParsedIntent) => void;
  onError?: (message: string) => void;
};

const TARGET_RATE = 16000;
const MIN_AUDIO_MS = 250;

/**
 * Drives the microphone and hands raw PCM straight to ayaai.
 *
 * `useAudioStream` gives us little-endian int16 mono PCM — exactly what ayaai's
 * `/v1/transcribe` expects — so there is no file recording or decoding step.
 * The mic is only ever opened by an explicit `start()` tap (never auto-open,
 * so TalkBack/Aya's own speech can't bleed into the recognizer) and closes on
 * an explicit `stop()`, a tolerant silence timeout, or a hard duration cap.
 * Nothing is transmitted on cancel.
 */
export function useVoiceCapture({
  language,
  silenceMs = 2800,
  silenceRms = 0.012,
  maxMs = 15000,
  onAutoStop,
  onResult,
  onError,
}: Options) {
  const { stream } = useAudioStream({
    encoding: "int16",
    channels: 1,
    sampleRate: TARGET_RATE,
  });

  const [phase, setPhase] = useState<CapturePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const phaseRef = useRef<CapturePhase>("idle");
  const chunksRef = useRef<ArrayBuffer[]>([]);
  const sampleRateRef = useRef(TARGET_RATE);
  const lastVoiceRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = useRef<() => void>(() => {});

  const callbacks = useRef({ onAutoStop, onResult, onError });
  callbacks.current = { onAutoStop, onResult, onError };

  const setPhaseBoth = useCallback((next: CapturePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    const sub = stream.addListener("audioStreamBuffer", (buffer) => {
      if (phaseRef.current !== "listening") return;
      chunksRef.current.push(buffer.data.slice(0));
      sampleRateRef.current = buffer.sampleRate || TARGET_RATE;
      const rms = rmsOfInt16(buffer.data);
      setLevel(rms);
      if (rms >= silenceRms) lastVoiceRef.current = Date.now();
    });
    return () => {
      try {
        sub.remove();
      } catch {
        // already detached
      }
    };
  }, [stream, silenceRms]);

  const stop = useCallback(async () => {
    if (phaseRef.current !== "listening") return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhaseBoth("processing");
    try {
      stream.stop();
    } catch {
      // stream already stopped
    }
    setLevel(0);

    const audio = concat(chunksRef.current);
    chunksRef.current = [];
    const minBytes = (TARGET_RATE * MIN_AUDIO_MS) / 1000 * 2;

    if (audio.byteLength < minBytes) {
      fail(REPEAT_MESSAGES[language]);
      return;
    }

    try {
      const intent = await api.voice.interpret({
        audio,
        sampleRate: sampleRateRef.current,
        language,
      });
      setPhaseBoth("idle");
      callbacks.current.onResult?.(intent);
    } catch (err) {
      console.warn("[voice] interpret failed", err);
      fail(
        friendlyApiError(
          err,
          "The voice service is unavailable. Please try again.",
        ),
      );
    }

    function fail(message: string) {
      setError(message);
      setPhaseBoth("error");
      callbacks.current.onError?.(message);
    }
  }, [stream, language, setPhaseBoth]);

  stopRef.current = () => {
    void stop();
  };

  const start = useCallback(async () => {
    setError(null);
    setPhaseBoth("requesting");
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone permission is needed.");
        setPhaseBoth("error");
        callbacks.current.onError?.("Microphone permission is needed.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      chunksRef.current = [];
      sampleRateRef.current = TARGET_RATE;
      lastVoiceRef.current = Date.now();
      await stream.start();
      setPhaseBoth("listening");

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const silentFor = now - lastVoiceRef.current;
        if (now - startedAt > maxMs || silentFor > silenceMs) {
          callbacks.current.onAutoStop?.();
          stopRef.current();
        }
      }, 150);
    } catch (err) {
      console.warn("[voice] mic start failed", err);
      const message = "Could not start the microphone.";
      setError(message);
      setPhaseBoth("error");
      callbacks.current.onError?.(message);
    }
  }, [stream, silenceMs, maxMs, setPhaseBoth]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      stream.stop();
    } catch {
      // noop
    }
    chunksRef.current = [];
    setLevel(0);
    setError(null);
    setPhaseBoth("idle");
  }, [stream, setPhaseBoth]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return { phase, error, level, start, stop, cancel };
}

function rmsOfInt16(data: ArrayBuffer): number {
  const view = new Int16Array(data);
  if (view.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < view.length; i += 1) {
    const sample = view[i] / 32768;
    sum += sample * sample;
  }
  return Math.sqrt(sum / view.length);
}

function concat(chunks: ArrayBuffer[]): ArrayBuffer {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}
