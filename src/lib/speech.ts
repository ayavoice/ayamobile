import { AccessibilityInfo, Platform } from "react-native";

/** Speaks through the screen reader. Web relies on live regions instead. */
export function speak(message: string) {
  if (Platform.OS === "web") return;
  AccessibilityInfo.announceForAccessibility(message);
}
