import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Icon, Screen, ScreenFooter, VoiceWave } from "../components/ui";
import { useAppPrefs } from "../context/AppPrefs";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../theme";

type Props = { onNext: () => void; onBack: () => void };

const FIRST_WORD_DELAY_MS = 800;
const WORD_STEP_MS = 220;
const MUTE_POLL_MS = 150;

export default function ListeningScreen({ onNext, onBack }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const { flow } = useAppPrefs();
  const words = useMemo(
    () => flow.utterance.transcript.split(" "),
    [flow.utterance.transcript],
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  const transcriptSoFar = words.slice(0, revealedCount).join(" ");
  const done = revealedCount >= words.length && words.length > 0;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    setRevealedCount(0);

    const revealNext = (i: number) => {
      if (cancelled) return;
      if (mutedRef.current) {
        timeoutId = setTimeout(() => revealNext(i), MUTE_POLL_MS);
        return;
      }
      setRevealedCount(i);
      if (i < words.length) {
        timeoutId = setTimeout(() => revealNext(i + 1), WORD_STEP_MS);
      }
    };

    timeoutId = setTimeout(() => revealNext(1), FIRST_WORD_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [onNext, words]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Icon name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setMuted((m) => !m)}
            accessibilityRole="switch"
            role="switch"
            accessibilityState={{ checked: muted }}
            accessibilityLabel="Mute microphone"
            accessibilityHint={muted ? "Unmutes the microphone" : "Mutes the microphone"}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Icon name={muted ? "mic-off" : "mic"} size={22} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            role="button"
            accessibilityLabel="Close listening"
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Icon name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <View style={styles.flex}>
        <View style={styles.body}>
          <View style={[styles.waveWrap, muted && styles.waveMuted]}>
            <VoiceWave />
          </View>
          <AppText
            variant="titleLG"
            align="center"
            color={colors.textSecondary}
            style={styles.listening}
            heading={1}
          >
            {muted ? "Muted" : done ? "Got it" : "Listening..."}
          </AppText>
        </View>

        <View
          accessible
          accessibilityLabel={transcriptSoFar ? `Transcript: ${transcriptSoFar}` : "Transcript"}
          accessibilityLiveRegion="polite"
          style={styles.bubble}
        >
          <AppText variant="body" color={colors.text} importantForAccessibility="no">
            {transcriptSoFar || " "}
            {!done ? "…" : ""}
          </AppText>
        </View>
      </View>

      <ScreenFooter>
        <Button
          onPress={onNext}
          disabled={revealedCount === 0}
          accessibilityLabel="I'm done speaking, continue"
        >
          <Icon name="checkmark" size={20} color={colors.textOnYellow} />
          <AppText variant="button" color={colors.textOnYellow}>
            I'm done speaking
          </AppText>
        </Button>
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
    headerActions: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    headerBtn: {
      width: 44,
      height: 44,
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
    waveMuted: {
      opacity: 0.35,
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
  };
}
