import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Card, Icon } from "../../components/ui";
import { DECORATIVE_A11Y, formatCurrency, formatCurrencySpoken } from "../../lib/currency";
import { radii, spacing, useColors, usePaletteStyles, type Palette } from "../../theme";
import {
  OWARE_ROUNDS,
  OWARE_START_MONEY,
  OWARE_START_SAFETY,
  starsForSafety,
  xpForTier,
  type OwareChoice,
} from "../../content/play";
import { ChunkyButton, StarRow } from "./shared";

type LogEntry = { title: string; delta: number; tier: OwareChoice["tier"] };

const ACCENT_KEY = "purple" as const;

function deltaSpoken(delta: number): string {
  if (delta === 0) return "no change";
  const spoken = formatCurrencySpoken(delta);
  return delta > 0 ? `plus ${spoken}` : spoken;
}

/** Speak money tokens inside a sentence without dropping the surrounding words. */
function speakChoiceLabel(label: string): string {
  return label.replace(/GH₵\s*([\d,]+(?:\.\d+)?)/gi, (_, amount: string) => formatCurrencySpoken(amount));
}

export default function OwareGame({
  bestScore,
  onExit,
  onFinish,
}: {
  bestScore: number;
  onExit: () => void;
  onFinish: (xpEarned: number, score: number, total: number) => void;
}) {
  const colors = useColors();
  const styles = usePaletteStyles(createStyles);
  const accent = colors[ACCENT_KEY];

  const [roundIndex, setRoundIndex] = useState(0);
  const [wallet, setWallet] = useState(OWARE_START_MONEY);
  const [safety, setSafety] = useState(OWARE_START_SAFETY);
  const [xp, setXp] = useState(0);
  const [bestCount, setBestCount] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [choice, setChoice] = useState<OwareChoice | null>(null);

  const round = OWARE_ROUNDS[roundIndex];
  const done = roundIndex >= OWARE_ROUNDS.length;

  useEffect(() => {
    if (done) onFinish(xp, bestCount, OWARE_ROUNDS.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function reset() {
    setRoundIndex(0);
    setWallet(OWARE_START_MONEY);
    setSafety(OWARE_START_SAFETY);
    setXp(0);
    setBestCount(0);
    setLog([]);
    setChoice(null);
  }

  function pick(c: OwareChoice) {
    setChoice(c);
    setWallet((w) => w + c.delta);
    setSafety((s) => Math.max(0, Math.min(100, s + c.safetyDelta)));
    setXp((x) => x + xpForTier(c.tier));
    if (c.tier === "best") setBestCount((n) => n + 1);
    setLog((l) => [...l, { title: round.title, delta: c.delta, tier: c.tier }]);
  }

  if (done) {
    const stars = starsForSafety(safety);
    const isNewBest = bestCount > 0 && bestCount > bestScore;
    return (
      <Card style={styles.resultCard}>
        <AppText variant="overline" color={colors.text} heading={2}>
          Ama's Day
        </AppText>
        <StarRow count={stars} size={40} filledColor={colors.warning} emptyColor={colors.borderMuted} />
        {isNewBest ? (
          <View
            style={styles.newBestChip}
            accessible
            accessibilityRole="text"
            accessibilityLabel="New best"
          >
            <View {...DECORATIVE_A11Y}>
              <Icon name="sparkles" size={14} color={colors.text} />
            </View>
            <AppText variant="labelXS" color={colors.text} importantForAccessibility="no">
              New best!
            </AppText>
          </View>
        ) : null}

        <View
          style={styles.ledger}
          role="list"
          accessibilityRole="list"
          accessibilityLabel={`Day summary, ${stars} stars, plus ${xp} XP earned`}
        >
          <View
            role="listitem"
            accessible
            accessibilityLabel={`Starting money, ${formatCurrencySpoken(OWARE_START_MONEY)}`}
            style={styles.ledgerRow}
          >
            <AppText variant="bodySM" importantForAccessibility="no">
              Starting money
            </AppText>
            <AppText variant="labelMD" importantForAccessibility="no">
              {formatCurrency(OWARE_START_MONEY)}
            </AppText>
          </View>
          {log.map((entry, i) => (
            <View
              key={i}
              role="listitem"
              accessible
              accessibilityLabel={`${entry.title}, ${deltaSpoken(entry.delta)}`}
              style={styles.ledgerRow}
            >
              <AppText variant="bodySM" numberOfLines={1} style={styles.ledgerLabel} importantForAccessibility="no">
                {entry.title}
              </AppText>
              <AppText
                variant="labelMD"
                color={entry.delta < 0 ? colors.danger : entry.delta > 0 ? colors.successDark : colors.textSubtle}
                importantForAccessibility="no"
              >
                {entry.delta === 0 ? "±0" : `${entry.delta > 0 ? "+" : ""}${formatCurrency(entry.delta)}`}
              </AppText>
            </View>
          ))}
          <View
            role="listitem"
            accessible
            accessibilityLabel={`Money remaining, ${formatCurrencySpoken(wallet)}`}
            style={[styles.ledgerRow, styles.ledgerDivider]}
          >
            <AppText variant="labelMD" importantForAccessibility="no">
              Money remaining
            </AppText>
            <AppText variant="labelLG" color={colors.text} importantForAccessibility="no">
              {formatCurrency(wallet)}
            </AppText>
          </View>
          <View
            role="listitem"
            accessible
            accessibilityLabel={`Financial safety, ${safety} percent`}
            style={styles.ledgerRow}
          >
            <AppText variant="labelMD" importantForAccessibility="no">
              Financial safety
            </AppText>
            <AppText variant="labelLG" color={colors.successDark} importantForAccessibility="no">
              {safety}%
            </AppText>
          </View>
        </View>

        <AppText variant="caption" color={colors.textSubtle} accessible accessibilityLabel={`Plus ${xp} XP earned`}>
          +{xp} XP earned
        </AppText>

        <View style={styles.fullWidth}>
          <ChunkyButton label="Play again" icon="refresh" color={accent} onPress={reset} />
        </View>
        <Pressable
          style={styles.secondaryBtn}
          onPress={onExit}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Back to games"
          accessibilityHint="Returns to AYA Learn"
        >
          <AppText variant="labelMD" importantForAccessibility="no">
            Back to games
          </AppText>
        </Pressable>
      </Card>
    );
  }

  const answered = choice !== null;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={styles.progressTrack}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Round progress, ${roundIndex} of ${OWARE_ROUNDS.length}`}
          accessibilityValue={{ min: 0, max: OWARE_ROUNDS.length, now: roundIndex }}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${(roundIndex / OWARE_ROUNDS.length) * 100}%`, backgroundColor: accent },
            ]}
            importantForAccessibility="no"
          />
        </View>
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          role="button"
          accessibilityLabel="Exit game"
          accessibilityHint="Returns to AYA Learn"
          style={styles.exitBtn}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon name="close" size={20} color={colors.textSubtle} />
          </View>
        </Pressable>
      </View>

      <View style={styles.walletRow}>
        <View
          style={styles.walletChip}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Wallet, ${formatCurrencySpoken(wallet)}`}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon name="wallet" size={14} color={colors.text} />
          </View>
          <AppText variant="labelXS" importantForAccessibility="no">
            {formatCurrency(wallet)}
          </AppText>
        </View>
        <View
          style={styles.walletChip}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Safety, ${safety} percent`}
        >
          <View {...DECORATIVE_A11Y}>
            <Icon name="shield-checkmark" size={14} color={colors.successMid} />
          </View>
          <AppText variant="labelXS" importantForAccessibility="no">
            {safety}% safe
          </AppText>
        </View>
        <AppText
          variant="caption"
          color={colors.textSubtle}
          accessible
          accessibilityLabel={`Round ${roundIndex + 1} of ${OWARE_ROUNDS.length}`}
        >
          {roundIndex + 1} of {OWARE_ROUNDS.length}
        </AppText>
      </View>

      <View
        style={styles.situationRow}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${round.title}. ${round.situation}`}
      >
        <View style={[styles.roundIcon, { backgroundColor: colors.washPurple }]} {...DECORATIVE_A11Y}>
          <Icon name={round.icon} size={20} color={colors.text} />
        </View>
        <View style={styles.flex} importantForAccessibility="no">
          <AppText variant="labelLG" importantForAccessibility="no">
            {round.title}
          </AppText>
          <AppText variant="bodySM" importantForAccessibility="no">
            {round.situation}
          </AppText>
        </View>
      </View>

      <View
        style={styles.choices}
        role="radiogroup"
        accessibilityRole="radiogroup"
        accessibilityLabel="Choices"
      >
        {round.choices.map((c) => {
          const isSelected = choice?.id === c.id;
          const revealTier = answered && isSelected;
          return (
            <Pressable
              key={c.id}
              disabled={answered}
              onPress={() => pick(c)}
              accessibilityRole="radio"
              role="radio"
              accessibilityLabel={speakChoiceLabel(c.label)}
              accessibilityState={{ checked: isSelected, selected: isSelected, disabled: answered }}
              aria-checked={isSelected}
              aria-disabled={answered || undefined}
              style={[
                styles.choice,
                revealTier && c.tier === "best" && styles.choiceGood,
                revealTier && c.tier === "trap" && styles.choiceBad,
                revealTier && c.tier === "okay" && styles.choiceMid,
              ]}
            >
              <AppText variant="labelMD" style={styles.choiceLabel} importantForAccessibility="no">
                {c.label}
              </AppText>
              {revealTier ? (
                <View {...DECORATIVE_A11Y}>
                  <Icon
                    name={c.tier === "best" ? "checkmark-circle" : c.tier === "trap" ? "close-circle" : "alert-circle"}
                    size={20}
                    color={c.tier === "best" ? colors.successDark : c.tier === "trap" ? colors.danger : colors.warning}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {answered && choice ? (
        <>
          <AppText variant="bodySM" style={styles.explanation} accessibilityLiveRegion="polite" aria-live="polite" role="status">
            {choice.feedback}
          </AppText>
          <ChunkyButton
            label={roundIndex + 1 === OWARE_ROUNDS.length ? "See results" : "Next"}
            icon="arrow-forward"
            iconTrailing
            color={accent}
            onPress={() => {
              setChoice(null);
              setRoundIndex((i) => i + 1);
            }}
          />
        </>
      ) : null}
    </Card>
  );
}

function createStyles(colors: Palette) {
  return {
    card: { gap: spacing.md },
    flex: { flex: 1, minWidth: 0 },
    fullWidth: { alignSelf: "stretch" as const },
    topRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.md },
    progressTrack: {
      flex: 1,
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceGhost,
      overflow: "hidden" as const,
    },
    progressFill: { height: "100%" as const, borderRadius: radii.full },
    exitBtn: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    walletRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: spacing.sm },
    walletChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii.full,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    situationRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 12 },
    roundIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      flexShrink: 0,
    },
    choices: { gap: spacing.sm },
    choice: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: radii.lg,
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      minHeight: 44,
    },
    choiceLabel: { flex: 1 },
    choiceGood: { backgroundColor: colors.successSurface },
    choiceBad: { backgroundColor: colors.dangerSurface },
    choiceMid: { backgroundColor: colors.surfaceWarning },
    explanation: { color: colors.textSecondary },
    secondaryBtn: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 10,
      minHeight: 44,
    },
    resultCard: { alignItems: "center" as const, gap: spacing.sm },
    newBestChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      backgroundColor: colors.surfaceGhost,
      borderRadius: radii.full,
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
    ledger: { alignSelf: "stretch" as const, gap: 6, marginVertical: spacing.xs },
    ledgerRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: spacing.md,
      minHeight: 44,
    },
    ledgerLabel: { flex: 1 },
    ledgerDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.borderMuted,
      paddingTop: 8,
      marginTop: 4,
    },
  };
}
