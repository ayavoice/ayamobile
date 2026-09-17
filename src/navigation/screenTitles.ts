import type { ScreenId } from "./types";

export const SCREEN_TITLES: Record<ScreenId, string> = {
  splash: "Aya",
  onboarding: "Welcome",
  "auth-welcome": "Get started",
  signup: "Sign up",
  login: "Log in",
  "forgot-pin": "Forgot PIN",
  "otp-verify": "Verify code",
  "create-pin": "Create PIN",
  language: "Language",
  "accessibility-setup": "Accessibility setup",
  home: "Home",
  listening: "Listening",
  "send-money": "Send money",
  "transfer-receipt": "Transfer receipt",
  confirmation: "Confirm",
  biometric: "Authenticate",
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
  error: "Help",
};

export function documentTitleFor(screen: ScreenId): string {
  const label = SCREEN_TITLES[screen] ?? "Aya";
  return screen === "splash" ? "Aya" : `${label} · Aya`;
}
