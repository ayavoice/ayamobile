import * as Speech from "expo-speech";
import type { Lang } from "../agent";
import { playClip, synthesize } from "./speechGateway";

export type Utterance = { done: Promise<void>; stop: () => void };

/** The HCI Lab voice is a Twi model with a small daily quota; once it fails, use the device voice for the session. */
let labVoiceDown = false;

const DEVICE_LANGUAGE: Record<Lang, string> = { en: "en-GB", tw: "en-GB", ee: "en-GB" };

function deviceSpeak(text: string, lang: Lang, rate: number): Utterance {
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  Speech.speak(text, { language: DEVICE_LANGUAGE[lang], rate, onDone: resolve, onStopped: resolve, onError: () => resolve() });
  return {
    done,
    stop: () => {
      Speech.stop();
      resolve();
    },
  };
}

/** Speak one of Aya's lines; `done` settles when she has finished or was stopped. */
export function sayAloud(text: string, lang: Lang, rate: number): Utterance {
  if (lang !== "tw" || labVoiceDown) return deviceSpeak(text, lang, rate);

  let stopped = false;
  let inner: (() => void) | undefined;
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));

  synthesize(text)
    .then((clip) => {
      if (stopped) return resolve();
      inner = playClip(clip.uri, resolve);
    })
    .catch(() => {
      labVoiceDown = true;
      if (stopped) return resolve();
      const fallback = deviceSpeak(text, lang, rate);
      inner = fallback.stop;
      fallback.done.then(resolve);
    });

  return {
    done,
    stop: () => {
      stopped = true;
      inner?.();
      resolve();
    },
  };
}
