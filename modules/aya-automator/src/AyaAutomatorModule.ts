import {
  NativeModule,
  requireNativeModule,
} from "expo";
import type {
  UssdEvent,
  UssdMission,
  UssdResult,
  UssdState,
} from "./AyaAutomator.types";

declare class AyaAutomatorModule extends NativeModule<UssdEventMap> {
  /** True when the Aya AccessibilityService is enabled in system settings. */
  isEnabled(): Promise<boolean>;
  /** Opens the system accessibility settings so the user can enable Aya drive. */
  openAccessibilitySettings(): void;
  /** Hands a JSON-encoded mission to the service. Resolves false if the service is not enabled. */
  startMission(missionJson: string): Promise<boolean>;
  /** Aborts the current session (idempotent). */
  stop(): Promise<void>;
  /** Resolves with the latest session snapshot (null when idle). */
  currentState(): Promise<UssdState | null>;
}

/**
 * Native event payloads (single channel "onEvent").
 */
export type UssdEventMap = {
  onEvent: (event: UssdEvent) => void;
};

export type UssdSubscription = ReturnType<typeof Automator.addListener>;

export type { UssdMission, UssdEvent, UssdResult, UssdState };

const Automator = requireNativeModule<AyaAutomatorModule>("AyaAutomator");

export default Automator;

/**
 * Convenience wrapper: subscribes to native automator events. Returns a
 * handle that mirrors the native subscription — the caller owns its lifetime.
 */
export function useAutomatorEvents(handler: (event: UssdEvent) => void): UssdSubscription {
  return Automator.addListener("onEvent", handler);
}