import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * The MoMo PIN for "auto" mode (Security → "Let Aya enter my PIN").
 * Device-local only: held in the OS keystore, handed to the USSD dialog
 * in-process by the native automator, never logged, never transmitted,
 * never spoken.
 */

const KEY = "aya.momoPin.v1";

export async function getMomoPin(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export async function setMomoPin(pin: string | null): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (pin) {
      await SecureStore.setItemAsync(KEY, pin, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(KEY);
    }
  } catch {
    // Best effort; a failed write leaves the previous value in place.
  }
}