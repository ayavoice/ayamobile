import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";
import type { AccessibilityPrefs } from "../context/AppPrefs";
import type { AppLanguage } from "./flows";

type IonName = ComponentProps<typeof Ionicons>["name"];

export const WELCOME_LINES: { code: AppLanguage; text: string }[] = [
  { code: "tw", text: "Akwaaba! Me din de Aya." },
  { code: "en", text: "Welcome! I'm Aya." },
];

export const LANGUAGE_TILES: { code: AppLanguage; name: string; spoken: string }[] = [
  { code: "tw", name: "Twi", spoken: "Twi" },
  { code: "en", name: "English", spoken: "English" },
];

export type SetupMode = "standard" | "talk";

export const SETUP_MODES: {
  id: SetupMode;
  title: string;
  description: string;
  icon: IonName;
  prefs: Partial<AccessibilityPrefs>;
}[] = [
  {
    id: "standard",
    title: "Standard",
    description: "Read and tap. Follows your phone's text size.",
    icon: "phone-portrait-outline",
    prefs: {
      voiceFirst: false,
      haptics: true,
      captions: true,
      largeText: false,
      highContrast: false,
      textSize: 2,
      speechSpeed: 2,
    },
  },
  {
    id: "talk",
    title: "Accessibility",
    description: "Aya reads everything out loud. Works with screen readers.",
    icon: "accessibility",
    prefs: {
      voiceFirst: true,
      haptics: true,
      captions: true,
      largeText: false,
      highContrast: false,
      textSize: 2,
      speechSpeed: 2,
    },
  },
];

export const SAFETY_RULE_SHORT = "Never say or share your PIN. Type it only in MTN's PIN box.";

export const SAFETY_RULE =
  "Never say your PIN out loud or give it to anyone. Type it only in MTN's PIN box. MTN will never call to ask for it. If anyone asks, it's a scam.";

export const OWNER_DONE_LINE =
  "You're set up. From now on, only you can approve money. Nobody else needs your PIN.";

/** Progress through sign-up. Biometrics is the last step and is skipped on phones without it. */
export const SIGNUP_STEPS = {
  language: 1,
  mode: 2,
  phone: 3,
  code: 4,
  pin: 5,
  biometrics: 6,
} as const;
export const SIGNUP_TOTAL = 6;

export const PHONE_LENGTH = 9;

/** "+233 24 123 6631" */
export function formatGhanaPhone(phone: string) {
  return `+233 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
}

/** "024 ••• 7151": local format with the middle hidden. */
export function maskedGhanaPhone(phone: string) {
  return `0${phone.slice(0, 2)} ••• ${phone.slice(5)}`;
}

/** Stand-in for MTN's KYC name lookup on the verified number. */
export function lookupMomoName(_phone: string) {
  return "Ama Mensah";
}

/** Re-lock after the app has been in the background this long. */
export const AUTO_LOCK_MS = 60_000;

/** MTN locks the MoMo PIN after this many wrong tries. */
export const MOMO_PIN_TRIES = 3;
export const MOMO_PIN_LOCKED =
  "Too many wrong tries. MTN has locked your PIN for 24 hours. To reset it now, dial *170# and choose Forgot PIN.";
export const MOMO_PIN_LOCKED_SPOKEN = MOMO_PIN_LOCKED.replace("*170#", "star 1 7 0 hash");

export function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

/** "66 31": last four digits spoken in pairs. */
export function lastFourInPairs(phone: string) {
  const last = phone.slice(-4);
  return `${last.slice(0, 2)} ${last.slice(2)}`;
}
