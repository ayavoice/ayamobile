import { AccessibilityInfo, findNodeHandle, Platform } from "react-native";
import type { RefObject } from "react";
import type { View } from "react-native";

/**
 * Screen-reader announcement helpers. TalkBack/VoiceOver narrate live regions
 * and focused nodes, but some state changes (recording start/stop, async
 * results) need an explicit announcement. Web relies on aria-live instead, so
 * these are native-only.
 */

export function announce(message: string): void {
  if (Platform.OS === "web") return;
  if (!message) return;
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Move screen-reader focus onto a node. Used on screen entry so TalkBack reads
 * the new screen's heading rather than leaving focus stranded on the previous
 * screen. Native only; web moves focus via the `#main-content` skip target.
 */
export function focusA11y(target: RefObject<View | null> | number | null): void {
  if (Platform.OS === "web") return;
  let handle: number | null = null;
  if (typeof target === "number") {
    handle = target;
  } else if (target?.current) {
    handle = findNodeHandle(target.current);
  }
  if (handle == null) return;
  AccessibilityInfo.setAccessibilityFocus(handle);
}
