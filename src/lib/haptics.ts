import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptic cues give non-visual feedback for voice states. Always best-effort:
 * wrapped so a missing vibrator or denied capability never breaks a flow.
 * Callers pass the user's `accessibility.haptics` preference.
 */

export type HapticCue = "start" | "stop" | "success" | "error" | "select";

export async function hapticCue(cue: HapticCue, enabled: boolean): Promise<void> {
  if (!enabled || Platform.OS === "web") return;
  try {
    switch (cue) {
      case "start":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "stop":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "select":
        await Haptics.selectionAsync();
        break;
    }
  } catch {
    // Haptics are optional; ignore failures.
  }
}
