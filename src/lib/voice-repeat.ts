import type { AppLanguage } from "@aya/shared";

/**
 * Prompt shown and/or spoken when Aya didn't hear or understand the user.
 * Localized so voice-first users hear the repeat request in their language.
 */
export const REPEAT_MESSAGES: Record<AppLanguage, string> = {
  en: "I didn't understand that. Please say it again.",
  tw: "Mante nea wokae no. Mesrɛ wo san ka bio.",
  ee: "Metse o. Gblɔe ake.",
};