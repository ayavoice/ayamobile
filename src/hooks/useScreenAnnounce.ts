import { useEffect, useRef } from "react";
import type { View } from "react-native";
import { announce, focusA11y } from "../lib/a11y";

/**
 * On screen mount, either announce a purpose string or move screen-reader focus
 * to the returned ref (attach it to the screen's heading). A short delay lets
 * the navigation animation settle so TalkBack doesn't read the old screen.
 */
export function useScreenAnnounce(announceText?: string, delayMs = 150) {
  const ref = useRef<View>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (announceText) announce(announceText);
      else focusA11y(ref);
    }, delayMs);
    return () => clearTimeout(t);
  }, [announceText, delayMs]);

  return ref;
}
