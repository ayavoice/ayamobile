import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { ParsedIntent } from "@aya/shared";
import { AppText, Button, Icon, Screen, ScreenFooter, VoiceWave } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { useAyaSpeech } from "../hooks/useAyaSpeech";
import { useScreenAnnounce } from "../hooks/useScreenAnnounce";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { announce } from "../lib/a11y";
import { hapticCue } from "../lib/haptics";
import { REPEAT_MESSAGES } from "../lib/voice-repeat";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = {
  onResult: (intent: ParsedIntent) => void;
  onBack: () => void;
};

export default function ListeningScreen({ onResult, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow, language, accessibility } = useAppPrefs();
  const [clarify, setClarify] = useState<string | null>(null);
  const { speakLocalized, stop } = useAyaSpeech();
  const autoRelistenUsed = useRef(false);

  useScreenAnnounce(`${flow.intentLabel}. ${flow.listenHint}`);

  useEffect(() => () => stop(), [stop]);

  const { phase, error, start, stop: stopCapture } = useVoiceCapture({
    language,
    onAutoStop: () => {
      void hapticCue("stop", accessibility.haptics);
      announce("Stopped listening.");
    },
    onResult: (intent) => {
      if (!intent.flow) {
        const message = REPEAT_MESSAGES[language];
        setClarify(message);
        void hapticCue("error", accessibility.haptics);
        announce(message);
        if (!autoRelistenUsed.current) {
          autoRelistenUsed.current = true;
          void (async () => {
            await speakLocalized(message, language);
            void start();
          })();
        }
        return;
      }
      setClarify(null);
      void hapticCue("success", accessibility.haptics);
      announce(`You said: ${intent.rawText}. Continuing.`);
      setTimeout(() => onResult(intent), 700);
    },
    onError: (message) => {
      void hapticCue("error", accessibility.haptics);
      announce(message);
    },
  });

  const handleStart = useCallback(() => {
    setClarify(null);
    autoRelistenUsed.current = false;
    void hapticCue("start", accessibility.haptics);
    announce("Listening. Speak now.");
    void start();
  }, [accessibility.haptics, start]);

  const handleStop = useCallback(() => {
    void hapticCue("stop", accessibility.haptics);
    void stopCapture();
  }, [accessibility.haptics, stopCapture]);

  const listening = phase === "listening";
  const busy = phase === "requesting" || phase === "processing";

  const status = listening
    ? "Listening…"
    : phase === "requesting"
      ? "Opening microphone…"
      : phase === "processing"
        ? "Understanding…"
        : clarify
          ? "I didn't catch that"
          : "Ready when you are";

  const bubble = listening
    ? "Speak now. Tell Aya what you want to do."
    : clarify ?? flow.listenHint;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Go back"
          accessibilityHint="Leaves voice input without doing anything"
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Icon name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <AppText variant="headingSM" heading={1}>
          Talk to Aya
        </AppText>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Cancel"
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Icon name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.flex}>
        <View style={styles.body}>
          <View style={[styles.waveWrap, !listening && styles.waveIdle]}>
            <VoiceWave />
          </View>
          <AppText
            variant="titleLG"
            align="center"
            color={colors.textSecondary}
            style={styles.listening}
            heading={2}
            accessibilityLiveRegion="polite"
            role="status"
          >
            {status}
          </AppText>
        </View>

        <View
          accessible
          accessibilityLabel={bubble}
          accessibilityLiveRegion="polite"
          role="status"
          style={styles.bubble}
        >
          <AppText variant="body" color={colors.text} importantForAccessibility="no">
            {bubble}
          </AppText>
        </View>

        {error ? (
          <View
            accessible
            accessibilityRole="alert"
            role="alert"
            accessibilityLiveRegion="assertive"
            style={styles.errorBox}
          >
            <AppText variant="bodySM" color={colors.danger ?? colors.text} align="center">
              {error}
            </AppText>
          </View>
        ) : null}
      </View>

      <ScreenFooter>
        {listening ? (
          <Button onPress={handleStop} accessibilityLabel="I'm done speaking">
            <Icon name="checkmark" size={20} color={colors.textOnYellow} />
            <AppText variant="button" color={colors.textOnYellow}>
              I&apos;m done speaking
            </AppText>
          </Button>
        ) : (
          <Button
            onPress={handleStart}
            disabled={busy}
            accessibilityLabel={busy ? "Please wait" : "Start talking"}
            accessibilityHint="Opens the microphone so you can speak"
          >
            <Icon name="mic" size={20} color={colors.textOnYellow} />
            <AppText variant="button" color={colors.textOnYellow}>
              {phase === "requesting"
                ? "Opening…"
                : phase === "processing"
                  ? "Understanding…"
                  : clarify
                    ? "Try again"
                    : "Start talking"}
            </AppText>
          </Button>
        )}
      </ScreenFooter>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return {
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: spacing.sm,
      minHeight: 52,
      flexShrink: 0,
    },
    headerBtn: {
      width: 48,
      height: 48,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    body: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: spacing.xl,
      gap: spacing["3xl"],
    },
    waveWrap: {
      width: "100%" as const,
      alignItems: "center" as const,
    },
    waveIdle: {
      opacity: 0.45,
    },
    listening: {
      fontWeight: "600" as const,
    },
    bubble: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii["3xl"],
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      minHeight: 72,
      justifyContent: "center" as const,
    },
    errorBox: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
  };
}
