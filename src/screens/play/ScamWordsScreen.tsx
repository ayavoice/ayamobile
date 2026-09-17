import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, IconWell, ScreenFooter, WaveIcon } from "../../components/ui";
import { SCAM_WORD_ROUNDS } from "../../content/play";
import { DECORATIVE_A11Y } from "../../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";

type Props = {
  onExit: () => void;
  onFinish: (score: number, total: number) => void;
};

export default function ScamWordsScreen({ onExit, onFinish }: Props) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const rounds = useMemo(() => SCAM_WORD_ROUNDS, []);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const round = rounds[index];
  const total = rounds.length;
  const correct = picked === round?.answer;

  const choose = (option: string) => {
    if (picked || !round) return;
    setPicked(option);
    if (option === round.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (!picked) return;
    if (index >= total - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  if (done) {
    return (
      <View style={styles.body}>
        <View style={styles.resultCard}>
          <View style={styles.waveWrap} {...DECORATIVE_A11Y}>
            <WaveIcon size={40} color={colors.purple} animated />
          </View>
          <AppText variant="heading" heading={2} align="center">
            Scam words complete
          </AppText>
          <AppText variant="bodySM" align="center" color={colors.textMuted}>
            You spotted {score} of {total} pressure words.
          </AppText>
        </View>
        <ScreenFooter>
          <Button
            onPress={() => {
              onFinish(score, total);
              onExit();
            }}
          >
            Back to Learn
          </Button>
        </ScreenFooter>
      </View>
    );
  }

  if (!round) return null;

  return (
    <View style={styles.body}>
      <AppText variant="caption" color={colors.textMuted}>
        Round {index + 1} of {total}
      </AppText>
      <AppText variant="headingSM" heading={2} style={styles.prompt}>
        Which word feels like a scam trap?
      </AppText>
      <View style={styles.messageCard} accessibilityRole="text">
        <AppText variant="body">{round.message}</AppText>
      </View>

      <View
        style={styles.options}
        accessibilityRole="radiogroup"
        role="radiogroup"
        accessibilityLabel="Word choices"
      >
        {round.options.map((option) => {
          const selected = picked === option;
          const isAnswer = option === round.answer;
          const showResult = Boolean(picked);
          let bg = colors.surfaceCard;
          if (showResult && isAnswer) bg = colors.successSurface;
          else if (showResult && selected && !isAnswer) bg = colors.dangerSurface;

          return (
            <Pressable
              key={option}
              onPress={() => choose(option)}
              disabled={Boolean(picked)}
              accessibilityRole="radio"
              role="radio"
              accessibilityState={{ checked: selected, selected, disabled: Boolean(picked) }}
              aria-checked={selected}
              aria-disabled={Boolean(picked) || undefined}
              accessibilityLabel={option}
              style={[styles.option, { backgroundColor: bg }]}
            >
              <AppText variant="labelMD">{option}</AppText>
            </Pressable>
          );
        })}
      </View>

      {picked ? (
        <View style={styles.tip} accessibilityLiveRegion="polite" aria-live="polite" role="status">
          <IconWell
            backgroundColor={correct ? colors.successSurface : colors.dangerSurface}
            size={36}
            radius={12}
          >
            <WaveIcon size={16} color={correct ? colors.success : colors.danger} />
          </IconWell>
          <View style={styles.flex}>
            <AppText variant="labelSM">{correct ? "Nice catch" : "Watch that word"}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {round.tip}
            </AppText>
          </View>
        </View>
      ) : null}

      <ScreenFooter>
        <Button onPress={picked ? next : onExit} variant={picked ? "primary" : "ghost"}>
          {picked ? (index >= total - 1 ? "See results" : "Next message") : "Exit"}
        </Button>
      </ScreenFooter>
    </View>
  );
}

function createStyles(colors: Palette) {
  return {
    body: { gap: spacing.md, flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    prompt: { marginTop: 2 },
    messageCard: {
      borderRadius: radii["2xl"],
      backgroundColor: colors.washYellow,
      padding: spacing.lg,
    },
    options: { gap: 10 },
    option: {
      borderRadius: radii.xl,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
    },
    tip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceCard,
    },
    resultCard: {
      alignItems: "center" as const,
      gap: spacing.sm,
      paddingVertical: spacing["2xl"],
      paddingHorizontal: spacing.lg,
      borderRadius: radii["3xl"],
      backgroundColor: colors.washPurple,
    },
    waveWrap: {
      marginBottom: spacing.sm,
    },
  };
}
