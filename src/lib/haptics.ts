import * as Haptics from "expo-haptics";
import { Platform, Vibration } from "react-native";

/**
 * Fixed, learnable haptic vocabulary (architecture.md §8).
 * Patterns are [wait, vibrate, wait, vibrate, ...] in milliseconds.
 */
export const HAPTICS = {
  listening: [0, 40],
  understood: [0, 40, 90, 40],
  micOff: [0, 400],
  success: [0, 40, 90, 40, 90, 40],
  failed: [0, 300, 120, 60, 120, 300],
  /** Support-only: something changed on your request. */
  update: [0, 120, 120, 120],
} as const;

export type HapticPattern = keyof typeof HAPTICS;

type Tap = Haptics.ImpactFeedbackStyle;
const { Light, Medium, Heavy } = Haptics.ImpactFeedbackStyle;

/** iOS ignores vibration durations, so a "long" buzz is a rapid train of strong taps. */
function buzzTrain(start: number, duration: number, style: Tap = Heavy): [number, Tap][] {
  const taps: [number, Tap][] = [];
  for (let t = 0; t < duration; t += 40) taps.push([start + t, style]);
  return taps;
}

const IOS_HAPTICS: Record<HapticPattern, [number, Tap][]> = {
  listening: [[0, Light]],
  understood: [[0, Light], [130, Light]],
  micOff: buzzTrain(0, 450),
  success: [[0, Light], [130, Light], [260, Light]],
  failed: [...buzzTrain(0, 300), [420, Medium], ...buzzTrain(600, 300)],
  update: [[0, Medium], [240, Medium]],
};

export function vibrate(pattern: HapticPattern, enabled: boolean) {
  if (!enabled) return;
  try {
    if (Platform.OS === "ios") {
      for (const [at, style] of IOS_HAPTICS[pattern]) {
        setTimeout(() => Haptics.impactAsync(style).catch(() => {}), at);
      }
      return;
    }
    Vibration.vibrate([...HAPTICS[pattern]]);
  } catch {
    // Web and some emulators have no vibration motor.
  }
}
