import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { UserProfile, Wallet } from "@aya/shared";

/**
 * The signed-in session (JWT + profile + wallet snapshot) persisted in
 * expo-secure-store (Keychain/Keystore — encrypted at rest, never mirrored to
 * the network except the JWT itself on authenticated calls).
 */

export type AuthSession = {
  token: string;
  user: UserProfile;
  wallet: Wallet;
  /** Server session lifetime; the app re-verifies on 401. */
  expiresAt: number;
};

const SESSION_KEY = "aya.session.v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

// SecureStore has no web implementation; keep an in-memory copy there.
let memorySession: AuthSession | null = null;

export async function loadSession(): Promise<AuthSession | null> {
  if (Platform.OS === "web") return memorySession;
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.token || !parsed.user) return null;
    if (Date.now() > parsed.expiresAt) {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(
  session: AuthSession | null,
): Promise<void> {
  memorySession = session;
  if (Platform.OS === "web") return;
  try {
    if (session) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch {
    // Persisting is best-effort; the in-memory copy keeps the session alive.
  }
}

export function sessionTtl(): number {
  return TTL_MS;
}