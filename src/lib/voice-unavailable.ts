import { Alert } from "react-native";
import type { AppLanguage } from "@aya/shared";
import type { useAyaSpeech } from "../hooks/useAyaSpeech";

type SpeakLocalized = ReturnType<typeof useAyaSpeech>["speakLocalized"];

/**
 * Speak a read-back and, if the voice service is down, surface an alert instead
 * of leaving the user hanging. Retrying re-speaks; cancel leaves the flow.
 */
export async function speakOrAlert(
  speakLocalized: SpeakLocalized,
  text: string,
  language: AppLanguage,
  onCancel: () => void,
) {
  const ok = await speakLocalized(text, language);
  if (ok) return;
  Alert.alert(
    "Voice unavailable",
    'I can\'t reach the voice service. Say "continue" or "cancel", or use the buttons below.',
    [
      {
        text: "Try again",
        onPress: () => {
          void speakOrAlert(speakLocalized, text, language, onCancel);
        },
      },
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
    ],
  );
}