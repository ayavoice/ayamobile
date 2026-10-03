import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

const isWeb = Platform.OS === "web";
const WEB_DEMO_MS = 1000;

/** True when the phone has biometrics (fingerprint or face) set up. */
export async function biometricsAvailable(): Promise<boolean> {
  if (isWeb) return true;
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/**
 * Shows the phone's own biometric prompt. The fallback is the MoMo PIN in Aya,
 * not the phone passcode, so device fallback is off.
 */
export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  if (isWeb) {
    await new Promise((r) => setTimeout(r, WEB_DEMO_MS));
    return true;
  }
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Use MoMo PIN",
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
