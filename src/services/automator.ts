import { PermissionsAndroid, Platform, type PermissionStatus } from "react-native";
import Automator, {
  useAutomatorEvents,
  type UssdEvent,
  type UssdMission,
  type UssdResult,
  type UssdState,
  type UssdSubscription,
} from "@aya/automator";

/**
 * App-level facade over the native USSD automator module.
 *
 * Handles the platform realities the screens shouldn't have to think about:
 * Aya Drive (accessibility service) enablement, the CALL_PHONE runtime
 * permission, event subscriptions and mission lifecycle.
 */

export type AutomatorErrorCode =
  | "dial-blocked"
  | "no-dialog"
  | "unknown"
  | "not-enabled"
  | "no-call-permission";

const IS_ANDROID = Platform.OS === "android";

/** True when the Aya accessibility service is enabled by the user. */
export function isAyaDriveEnabled(): Promise<boolean> {
  if (!IS_ANDROID) return Promise.resolve(false);
  return Automator.isEnabled();
}

/** Drops the user into system accessibility settings so they can enable Aya. */
export function openAyaDriveSettings(): void {
  if (!IS_ANDROID) return;
  Automator.openAccessibilitySettings();
}

/**
 * Requests the CALL_PHONE permission needed to dial *170#.
 * Granted by default on API ≤ 28; a runtime prompt on 29+.
 */
export async function ensureCallPermission(): Promise<boolean> {
  if (!IS_ANDROID) return false;
  const status: PermissionStatus = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
  );
  return status === "granted";
}

/**
 * Starts a mission against the live USSD session. Resolves `false` when Aya
 * Drive is not enabled ("not-enabled" error is also emitted by the service).
 */
export function startMission(mission: UssdMission): Promise<boolean> {
  if (!IS_ANDROID) return Promise.resolve(false);
  console.log(
    `[automator] start ${mission.id} *${mission.shortCode}# (${mission.steps.length} steps, ${mission.pinMode} pin)`,
  );
  return Automator.startMission(JSON.stringify(mission)).catch((err) => {
    console.warn("[automator] startMission rejected", err);
    return false;
  });
}

/** Aborts the current session (idempotent). */
export function stopMission(): Promise<void> {
  if (!IS_ANDROID) return Promise.resolve();
  return Automator.stop();
}

/** Latest session snapshot (null when idle). */
export function currentAutomatorState(): Promise<UssdState | null> {
  if (!IS_ANDROID) return Promise.resolve(null);
  return Automator.currentState();
}

/**
 * Subscribes to live automator events. Returns an unsubscribe handle; the
 * caller owns its lifetime (call it in an effect cleanup).
 */
export function subscribeAutomator(handler: (event: UssdEvent) => void): UssdSubscription {
  return useAutomatorEvents(handler);
}

export type {
  UssdEvent,
  UssdMission,
  UssdResult,
  UssdState,
  UssdSubscription,
  UssdMissionStep,
  UssdPinMode,
} from "@aya/automator";