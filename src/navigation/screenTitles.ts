import type { ScreenId } from "./types";

export const SCREEN_TITLES: Record<ScreenId, string> = {
  splash: "Aya",
  onboarding: "Welcome",
  language: "Language",
  "accessibility-setup": "How Aya works",
  signup: "Your number",
  "otp-verify": "Verify",
  "sign-in": "Sign in",
  "app-lock-setup": "Biometrics",
  unlock: "Unlock",
  login: "Log in",
  home: "Home",
  listening: "Listening",
  "send-money": "Send money",
  "scan-pay": "Scan to pay",
  "transfer-receipt": "Transfer receipt",
  confirmation: "Confirm",
  biometric: "Approve",
  processing: "Processing",
  success: "Success",
  receipt: "Receipt",
  balance: "Balance",
  history: "History",
  services: "Services",
  "merchant-receive": "Shop payments",
  profile: "Profile",
  game: "Think Genius",
  leaderboard: "Leaderboard",
  "accessibility-settings": "Accessibility",
  security: "Security",
  help: "Help",
  support: "Get help",
  error: "Help",
};

export function documentTitleFor(screen: ScreenId): string {
  const label = SCREEN_TITLES[screen] ?? "Aya";
  return screen === "splash" ? "Aya" : `${label} · Aya`;
}
