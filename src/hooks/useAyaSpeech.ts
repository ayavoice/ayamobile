import { useCallback, useEffect, useRef } from "react";
import { createAudioPlayer } from "expo-audio";
import type { AppLanguage } from "@aya/shared";
import { api, audioDataUri } from "../services/api";

type Player = ReturnType<typeof createAudioPlayer>;

/**
 * Aya's voice output. `speakLocalized` plays full localized read-backs via
 * ayaai MMS-TTS. It resolves `true` when playback finished and `false` on any
 * failure so callers can surface an error instead of leaving the user hanging.
 * Resolving only after playback lets the caller open the mic after Aya has
 * stopped talking (avoids audio feeding back into ASR).
 */
export function useAyaSpeech() {
  const playerRef = useRef<Player | null>(null);

  const getPlayer = useCallback((): Player | null => {
    try {
      if (!playerRef.current) playerRef.current = createAudioPlayer();
      return playerRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(
    () => () => {
      try {
        playerRef.current?.release();
      } catch {
        // already released
      }
      playerRef.current = null;
    },
    [],
  );

  const speakLocalized = useCallback(
    async (text: string, language: AppLanguage): Promise<boolean> => {
      if (!text.trim()) return true;
      try {
        const res = await api.voice.speak({ text, language });
        const player = getPlayer();
        if (!player) {
          console.warn("[speech] audio player unavailable");
          return false;
        }
        return await playToEnd(player, audioDataUri(res));
      } catch (err) {
        console.warn("[speech] TTS unavailable", err);
        return false;
      }
    },
    [getPlayer],
  );

  const stop = useCallback(() => {
    try {
      playerRef.current?.pause();
    } catch {
      // noop
    }
  }, []);

  return { speakLocalized, stop };
}

function playToEnd(player: Player, uri: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let sub: { remove: () => void } | null = null;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      try {
        sub?.remove();
      } catch {
        // noop
      }
      resolve(ok);
    };
    try {
      sub = player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) finish(true);
      });
      player.replace(uri);
      player.play();
    } catch (err) {
      console.warn("[speech] playback failed", err);
      finish(false);
      return;
    }
    setTimeout(() => finish(true), 15000);
  });
}
