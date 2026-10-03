import { Platform } from "react-native";
import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { File, Paths } from "expo-file-system";

/**
 * HCI Lab Speech Gateway (UG) — ASR and TTS for the Talk screen.
 * Docs: https://lab-subscription-platform.vercel.app/dashboard/documentation
 *
 * Quotas are small (ASR 10/day, TTS 15/day, TTS max 250 chars), so each Talk
 * turn makes exactly one ASR call and one TTS call.
 */

const BASE_URL = "https://lab-subscription-platform.vercel.app/api/v1";
const TOKEN = process.env.EXPO_PUBLIC_SPEECH_API_TOKEN ?? "";
const TTS_MAX_CHARS = 250;

export class SpeechGatewayError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

function authHeaders(): Record<string, string> {
  if (!TOKEN) throw new SpeechGatewayError("Speech API token is not configured.", "missing_token");
  return { Authorization: `Bearer ${TOKEN}` };
}

async function toError(res: Response): Promise<SpeechGatewayError> {
  const body = await res.text().catch(() => "");
  try {
    const json = JSON.parse(body);
    return new SpeechGatewayError(
      json?.error?.message ?? `Request failed (${res.status})`,
      json?.error?.code ?? `http_${res.status}`,
      json?.request_id,
    );
  } catch {
    return new SpeechGatewayError(body.slice(0, 200) || `Request failed (${res.status})`, `http_${res.status}`);
  }
}

/** POST /asr — uploads a recorded clip and returns the transcript. */
export async function transcribe(audioUri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(audioUri)).blob();
    const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
    form.append("file", blob, `speech.${ext}`);
  } else {
    // Expo's fetch only accepts Blob-like parts (with bytes()), not RN's { uri, name, type }.
    form.append("file", new File(audioUri) as unknown as Blob);
  }

  const res = await fetch(`${BASE_URL}/asr`, { method: "POST", headers: authHeaders(), body: form });
  if (!res.ok) throw await toError(res);

  const json: { transcription?: string } = await res.json();
  return json.transcription?.trim() ?? "";
}

export type SpeechClip = { uri: string; durationSec: number };

/** POST /tts — returns a playable URI for the synthesized WAV. */
export async function synthesize(text: string): Promise<SpeechClip> {
  const res = await fetch(`${BASE_URL}/tts`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, TTS_MAX_CHARS), model_type: "ss", speaker: "PT" }),
  });
  if (!res.ok || !res.headers.get("content-type")?.includes("audio")) throw await toError(res);

  const durationSec = Number(res.headers.get("x-duration-sec")) || 0;
  const bytes = new Uint8Array(await res.arrayBuffer());

  if (Platform.OS === "web") {
    return { uri: URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })), durationSec };
  }
  const file = new File(Paths.cache, `aya-tts-${Date.now()}.wav`);
  file.create();
  file.write(bytes);
  return { uri: file.uri, durationSec };
}

/** Plays a clip once; the returned function stops it early. */
export function playClip(uri: string, onEnd?: () => void): () => void {
  const player = createAudioPlayer(uri);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    sub.remove();
    player.remove();
  };
  const sub = player.addListener("playbackStatusUpdate", (status) => {
    if (status.didJustFinish) {
      release();
      onEnd?.();
    }
  });
  player.play();
  return release;
}

/** Microphone capture for one Talk turn. `stop` resolves with the clip URI. */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      throw new SpeechGatewayError("Microphone permission is needed to talk to Aya.", "mic_denied");
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stop = async (): Promise<string | null> => {
    try {
      await recorder.stop();
    } finally {
      // iOS routes playback to the earpiece while the session still allows recording.
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    }
    return recorder.uri;
  };

  return { start, stop };
}
